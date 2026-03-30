use std::sync::Mutex;
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TimerPhase {
    Idle,
    Focus,
    Break,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TimerStateResponse {
    pub remaining_secs: u64,
    pub total_secs: u64,
    pub phase: TimerPhase,
    pub is_running: bool,
    pub is_paused: bool,
    pub current_task_name: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Reminder {
    pub id: String,
    pub text: String,
    pub trigger_at_secs: u64,
    pub triggered: bool,
    pub recur_interval_secs: Option<u64>,
}

pub struct InnerState {
    pub remaining_secs: u64,
    pub total_secs: u64,
    pub phase: TimerPhase,
    pub is_running: bool,
    pub is_paused: bool,
    pub current_task_name: Option<String>,
    pub next_check_in: Option<Instant>,
    pub check_in_interval_secs: u64,
    pub reminders: Vec<Reminder>,
    pub focus_duration_secs: u64,
    pub break_duration_secs: u64,
    pub audio_enabled: bool,
}

impl Default for InnerState {
    fn default() -> Self {
        Self {
            remaining_secs: 0,
            total_secs: 0,
            phase: TimerPhase::Idle,
            is_running: false,
            is_paused: false,
            current_task_name: None,
            next_check_in: None,
            check_in_interval_secs: 600,
            reminders: Vec::new(),
            focus_duration_secs: 1500,
            break_duration_secs: 300,
            audio_enabled: true,
        }
    }
}

impl InnerState {
    pub fn to_response(&self) -> TimerStateResponse {
        TimerStateResponse {
            remaining_secs: self.remaining_secs,
            total_secs: self.total_secs,
            phase: self.phase.clone(),
            is_running: self.is_running,
            is_paused: self.is_paused,
            current_task_name: self.current_task_name.clone(),
        }
    }
}

pub struct AppState {
    pub inner: Mutex<InnerState>,
}
