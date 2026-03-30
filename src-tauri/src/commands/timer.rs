use crate::state::{AppState, TimerPhase, TimerStateResponse};
use std::sync::Arc;
use std::time::Instant;

#[tauri::command]
pub fn start_timer(
    state: tauri::State<'_, Arc<AppState>>,
    duration_secs: u64,
    phase: TimerPhase,
) -> Result<TimerStateResponse, String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    inner.remaining_secs = duration_secs;
    inner.total_secs = duration_secs;
    inner.phase = phase;
    inner.is_running = true;
    inner.is_paused = false;
    if phase == TimerPhase::Focus {
        inner.next_check_in = Some(
            Instant::now() + std::time::Duration::from_secs(inner.check_in_interval_secs),
        );
    } else {
        inner.next_check_in = None;
    }
    Ok(inner.to_response())
}

#[tauri::command]
pub fn pause_timer(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<TimerStateResponse, String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    if inner.is_running && !inner.is_paused {
        inner.is_paused = true;
    }
    Ok(inner.to_response())
}

#[tauri::command]
pub fn resume_timer(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<TimerStateResponse, String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    if inner.is_running && inner.is_paused {
        inner.is_paused = false;
        inner.next_check_in = Some(
            Instant::now() + std::time::Duration::from_secs(inner.check_in_interval_secs),
        );
    }
    Ok(inner.to_response())
}

#[tauri::command]
pub fn stop_timer(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<TimerStateResponse, String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    inner.remaining_secs = 0;
    inner.total_secs = 0;
    inner.phase = TimerPhase::Idle;
    inner.is_running = false;
    inner.is_paused = false;
    inner.next_check_in = None;
    Ok(inner.to_response())
}

#[tauri::command]
pub fn get_timer_state(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<TimerStateResponse, String> {
    let inner = state.inner.lock().map_err(|e| e.to_string())?;
    Ok(inner.to_response())
}

#[tauri::command]
pub fn update_settings(
    state: tauri::State<'_, Arc<AppState>>,
    focus_duration_secs: Option<u64>,
    break_duration_secs: Option<u64>,
    check_in_interval_secs: Option<u64>,
    audio_enabled: Option<bool>,
) -> Result<TimerStateResponse, String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    if let Some(v) = focus_duration_secs {
        inner.focus_duration_secs = v;
    }
    if let Some(v) = break_duration_secs {
        inner.break_duration_secs = v;
    }
    if let Some(v) = check_in_interval_secs {
        inner.check_in_interval_secs = v;
        // Reset check-in timer if currently in focus mode
        if inner.is_running && inner.phase == TimerPhase::Focus {
            inner.next_check_in = Some(
                Instant::now() + std::time::Duration::from_secs(v),
            );
        }
    }
    if let Some(v) = audio_enabled {
        inner.audio_enabled = v;
    }
    Ok(inner.to_response())
}
