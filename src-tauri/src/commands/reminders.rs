use crate::state::{AppState, Reminder};
use std::sync::Arc;

#[tauri::command]
pub fn add_reminder(
    state: tauri::State<'_, Arc<AppState>>,
    text: String,
    trigger_in_secs: u64,
    recur_interval_secs: Option<u64>,
) -> Result<Reminder, String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    let now_secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    let reminder = Reminder {
        id: uuid::Uuid::new_v4().to_string(),
        text,
        trigger_at_secs: now_secs + trigger_in_secs,
        triggered: false,
        recur_interval_secs,
    };
    let result = reminder.clone();
    inner.reminders.push(reminder);
    Ok(result)
}

#[tauri::command]
pub fn list_reminders(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Vec<Reminder>, String> {
    let inner = state.inner.lock().map_err(|e| e.to_string())?;
    Ok(inner.reminders.iter().cloned().collect())
}

#[tauri::command]
pub fn delete_reminder(
    state: tauri::State<'_, Arc<AppState>>,
    id: String,
) -> Result<(), String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    inner.reminders.retain(|r| r.id != id);
    Ok(())
}
