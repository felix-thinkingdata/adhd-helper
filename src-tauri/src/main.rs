#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod commands;
mod background;

use std::sync::Arc;
use state::AppState;
use tauri::{Emitter, Manager};

fn main() {
    let state = Arc::new(AppState {
        inner: std::sync::Mutex::new(state::InnerState::default()),
    });

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .manage(state.clone())
        .invoke_handler(tauri::generate_handler![
            commands::timer::start_timer,
            commands::timer::pause_timer,
            commands::timer::resume_timer,
            commands::timer::stop_timer,
            commands::timer::get_timer_state,
            commands::timer::update_settings,
            commands::tasks::set_current_task,
            commands::tasks::get_current_task,
            commands::reminders::add_reminder,
            commands::reminders::list_reminders,
            commands::reminders::delete_reminder,
        ])
        .setup(move |app| {
            // Hide dock icon on macOS
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Setup tray menu
            let start_focus = tauri::menu::MenuItem::with_id(app, "start-focus", "开始专注 25min", true, None::<&str>)?;
            let pause_item = tauri::menu::MenuItem::with_id(app, "pause", "暂停", true, None::<&str>)?;
            let resume_item = tauri::menu::MenuItem::with_id(app, "resume", "继续", true, None::<&str>)?;
            let stop_item = tauri::menu::MenuItem::with_id(app, "stop", "停止", true, None::<&str>)?;
            let sep1 = tauri::menu::PredefinedMenuItem::separator(app)?;
            let remind_5 = tauri::menu::MenuItem::with_id(app, "remind-5", "5 分钟后提醒", true, None::<&str>)?;
            let remind_10 = tauri::menu::MenuItem::with_id(app, "remind-10", "10 分钟后提醒", true, None::<&str>)?;
            let remind_30 = tauri::menu::MenuItem::with_id(app, "remind-30", "30 分钟后提醒", true, None::<&str>)?;
            let sep2 = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit_item = tauri::menu::MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            let tray_menu = tauri::menu::Menu::with_items(app, &[
                &start_focus, &pause_item, &resume_item, &stop_item,
                &sep1,
                &remind_5, &remind_10, &remind_30,
                &sep2,
                &quit_item,
            ])?;

            // Initial menu state: pause/resume/stop disabled
            pause_item.set_enabled(false).ok();
            resume_item.set_enabled(false).ok();
            stop_item.set_enabled(false).ok();

            // Setup tray icon
            let _tray = tauri::tray::TrayIconBuilder::with_id(
                tauri::tray::TrayIconId::new("main-tray")
            )
                .icon(app.default_window_icon().cloned().unwrap())
                .tooltip("Focus - ADHD Helper")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app_handle, event| {
                    let event_id = event.id().as_ref();
                    match event_id {
                        "start-focus" => {
                            let app_state = app_handle.state::<Arc<AppState>>();
                            if let Ok(mut inner) = app_state.inner.lock() {
                                inner.remaining_secs = inner.focus_duration_secs;
                                inner.total_secs = inner.focus_duration_secs;
                                inner.phase = state::TimerPhase::Focus;
                                inner.is_running = true;
                                inner.is_paused = false;
                                inner.next_check_in = Some(
                                    std::time::Instant::now() + std::time::Duration::from_secs(inner.check_in_interval_secs),
                                );
                            };
                        }
                        "pause" => {
                            if let Ok(mut inner) = app_handle.state::<Arc<AppState>>().inner.lock() {
                                if inner.is_running && !inner.is_paused {
                                    inner.is_paused = true;
                                }
                            }
                        }
                        "resume" => {
                            if let Ok(mut inner) = app_handle.state::<Arc<AppState>>().inner.lock() {
                                if inner.is_running && inner.is_paused {
                                    inner.is_paused = false;
                                    inner.next_check_in = Some(
                                        std::time::Instant::now() + std::time::Duration::from_secs(inner.check_in_interval_secs),
                                    );
                                }
                            }
                        }
                        "stop" => {
                            if let Ok(mut inner) = app_handle.state::<Arc<AppState>>().inner.lock() {
                                inner.remaining_secs = 0;
                                inner.total_secs = 0;
                                inner.phase = state::TimerPhase::Idle;
                                inner.is_running = false;
                                inner.is_paused = false;
                                inner.next_check_in = None;
                            }
                        }
                        "remind-5" | "remind-10" | "remind-30" => {
                            let secs: u64 = match event_id {
                                "remind-5" => 300,
                                "remind-10" => 600,
                                "remind-30" => 1800,
                                _ => 0,
                            };
                            if let Ok(mut inner) = app_handle.state::<Arc<AppState>>().inner.lock() {
                                let now_secs = std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs();
                                inner.reminders.push(state::Reminder {
                                    id: uuid::Uuid::new_v4().to_string(),
                                    text: format!("{} 分钟提醒", secs / 60),
                                    trigger_at_secs: now_secs + secs,
                                    triggered: false,
                                    recur_interval_secs: None,
                                });
                            };
                            let _ = app_handle.emit("reminders-changed", ());
                        }
                        "quit" => {
                            background::stop();
                            app_handle.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
                    // Forward event to positioner plugin so it knows tray position
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app_handle = tray.app_handle();
                        if let Some(popup) = app_handle.get_webview_window("popup") {
                            if popup.is_visible().unwrap_or(false) {
                                let _ = popup.hide();
                            } else {
                                use tauri_plugin_positioner::{Position, WindowExt};
                                let _ = popup.move_window(Position::TrayCenter);
                                let _ = popup.show();
                                let _ = popup.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Start background thread
            let bg_state = state.clone();
            background::start_background_thread(
                app.handle().clone(),
                bg_state,
                start_focus,
                pause_item,
                resume_item,
                stop_item,
            );

            // Hide popup when it loses focus (click outside)
            if let Some(popup) = app.get_webview_window("popup") {
                let popup_clone = popup.clone();
                popup.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = popup_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            background::stop();
        }
    });
}
