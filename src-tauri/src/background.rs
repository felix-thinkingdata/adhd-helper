use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};

use tauri::menu::MenuItem;
use tauri::{AppHandle, Emitter};
use crate::state::{AppState, TimerPhase, TimerStateResponse};

static RUNNING: AtomicBool = AtomicBool::new(true);

pub fn stop() {
    RUNNING.store(false, Ordering::Relaxed);
}

fn send_notification(app: &AppHandle, title: &str, body: &str) {
    use tauri_plugin_notification::NotificationExt;
    match app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
    {
        Ok(()) => {}
        Err(e) => eprintln!("[notification error] {}", e),
    }
}

pub fn start_background_thread(
    app: AppHandle,
    state: std::sync::Arc<AppState>,
    start_focus_item: MenuItem<tauri::Wry>,
    pause_item: MenuItem<tauri::Wry>,
    resume_item: MenuItem<tauri::Wry>,
    stop_item: MenuItem<tauri::Wry>,
) {
    std::thread::spawn(move || {
        let tick_interval = Duration::from_secs(1);
        let tray_id = tauri::tray::TrayIconId::new("main-tray");

        while RUNNING.load(Ordering::Relaxed) {
            std::thread::sleep(tick_interval);

            let actions = {
                let mut inner = match state.inner.lock() {
                    Ok(guard) => guard,
                    Err(_) => continue,
                };

                let mut actions = Vec::new();

                if inner.is_running && !inner.is_paused {
                    if inner.remaining_secs > 0 {
                        inner.remaining_secs -= 1;

                        // Check check-in interval
                        if let Some(next) = inner.next_check_in {
                            if Instant::now() >= next {
                                actions.push(BackgroundAction::CheckIn {
                                    task_name: inner.current_task_name.clone(),
                                });
                                inner.next_check_in = Some(
                                    Instant::now()
                                        + Duration::from_secs(inner.check_in_interval_secs),
                                );
                            }
                        }

                        actions.push(BackgroundAction::Tick(inner.to_response()));
                    } else {
                        // Timer completed
                        let completed_phase = inner.phase.clone();
                        let break_dur = inner.break_duration_secs;

                        match completed_phase {
                            TimerPhase::Focus => {
                                inner.remaining_secs = break_dur;
                                inner.total_secs = break_dur;
                                inner.phase = TimerPhase::Break;
                                inner.next_check_in = None;
                                actions.push(BackgroundAction::TimerComplete {
                                    phase: TimerPhase::Focus,
                                });
                                actions.push(BackgroundAction::Tick(inner.to_response()));
                            }
                            TimerPhase::Break => {
                                inner.phase = TimerPhase::Idle;
                                inner.is_running = false;
                                inner.is_paused = false;
                                inner.next_check_in = None;
                                actions.push(BackgroundAction::TimerComplete {
                                    phase: TimerPhase::Break,
                                });
                                actions.push(BackgroundAction::Tick(inner.to_response()));
                            }
                            TimerPhase::Idle => {}
                        }
                    }
                }

                // Check reminders
                let now_secs = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();

                for reminder in &mut inner.reminders {
                    if !reminder.triggered && now_secs >= reminder.trigger_at_secs {
                        if let Some(interval) = reminder.recur_interval_secs {
                            reminder.trigger_at_secs = now_secs + interval;
                        } else {
                            reminder.triggered = true;
                        }
                        actions.push(BackgroundAction::ReminderTriggered {
                            id: reminder.id.clone(),
                            text: reminder.text.clone(),
                        });
                    }
                }

                inner.reminders.retain(|r| !r.triggered);

                actions
            };

            // Emit events outside of lock
            for action in actions {
                match action {
                    BackgroundAction::Tick(ts) => {
                        let is_running = ts.is_running;
                        let is_paused = ts.is_paused;

                        if is_running {
                            let title = format!("{:02}:{:02}", ts.remaining_secs / 60, ts.remaining_secs % 60);
                            if let Some(tray) = app.tray_by_id(&tray_id) {
                                let _ = tray.set_title(Some(&title));
                            }
                        } else if let Some(tray) = app.tray_by_id(&tray_id) {
                            let _ = tray.set_title(None::<&str>);
                        }

                        // Update tray menu item enabled states
                        let _ = start_focus_item.set_enabled(!is_running || is_paused);
                        let _ = pause_item.set_enabled(is_running && !is_paused);
                        let _ = resume_item.set_enabled(is_running && is_paused);
                        let _ = stop_item.set_enabled(is_running);

                        let _ = app.emit("timer-tick", ts);
                    }
                    BackgroundAction::TimerComplete { phase } => {
                        match phase {
                            TimerPhase::Focus => {
                                send_notification(&app, "专注完成！", "休息一下吧，你做到了。");
                            }
                            TimerPhase::Break => {
                                send_notification(&app, "休息结束！", "准备好继续专注了吗？");
                            }
                            _ => {}
                        }
                        let _ = app.emit("timer-complete", phase);
                    }
                    BackgroundAction::CheckIn { task_name } => {
                        let task = task_name.as_deref().unwrap_or("当前任务");
                        send_notification(&app, "专注检查", &format!("你还在做\"{}\"吗？", task));
                        let _ = app.emit("check-in", task_name);
                    }
                    BackgroundAction::ReminderTriggered { id, text } => {
                        send_notification(&app, "提醒", &text);
                        let _ = app.emit("reminder-triggered", serde_json::json!({
                            "id": id,
                            "text": text,
                        }));
                    }
                }
            }
        }
    });
}

enum BackgroundAction {
    Tick(TimerStateResponse),
    TimerComplete { phase: TimerPhase },
    CheckIn { task_name: Option<String> },
    ReminderTriggered { id: String, text: String },
}
