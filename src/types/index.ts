export type TimerPhase = 'idle' | 'focus' | 'break';

export interface TimerStateResponse {
  remaining_secs: number;
  total_secs: number;
  phase: TimerPhase;
  is_running: boolean;
  is_paused: boolean;
  current_task_name: string | null;
}

export interface Task {
  id: string;
  title: string;
  createdAt: number;
  completedAt: number | null;
  skipped: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  trigger_at_secs: number;
  triggered: boolean;
  recur_interval_secs: number | null;
}

export interface Settings {
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  checkInIntervalMinutes: number;
  audioEnabled: boolean;
}

export type ActiveTab = 'timer' | 'tasks' | 'reminders' | 'settings';
