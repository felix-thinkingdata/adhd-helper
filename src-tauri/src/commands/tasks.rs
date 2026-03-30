use crate::state::AppState;
use std::sync::Arc;

#[tauri::command]
pub fn set_current_task(
    state: tauri::State<'_, Arc<AppState>>,
    task_name: Option<String>,
) -> Result<(), String> {
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    inner.current_task_name = task_name;
    Ok(())
}

#[tauri::command]
pub fn get_current_task(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Option<String>, String> {
    let inner = state.inner.lock().map_err(|e| e.to_string())?;
    Ok(inner.current_task_name.clone())
}
