import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { TimerPhase, TimerStateResponse, Reminder } from '../types';

export const tauriApi = {
  // Timer
  startTimer: (durationSecs: number, phase: TimerPhase) =>
    invoke<TimerStateResponse>('start_timer', { durationSecs, phase }),
  pauseTimer: () =>
    invoke<TimerStateResponse>('pause_timer'),
  resumeTimer: () =>
    invoke<TimerStateResponse>('resume_timer'),
  stopTimer: () =>
    invoke<TimerStateResponse>('stop_timer'),
  getTimerState: () =>
    invoke<TimerStateResponse>('get_timer_state'),

  // Tasks
  setCurrentTask: (taskName: string | null) =>
    invoke<void>('set_current_task', { taskName }),
  getCurrentTask: () =>
    invoke<string | null>('get_current_task'),

  // Reminders
  addReminder: (text: string, triggerInSecs: number, recurIntervalSecs?: number) =>
    invoke<Reminder>('add_reminder', { text, triggerInSecs, recurIntervalSecs: recurIntervalSecs ?? null }),
  listReminders: () =>
    invoke<Reminder[]>('list_reminders'),
  deleteReminder: (id: string) =>
    invoke<void>('delete_reminder', { id }),

  // Settings
  updateSettings: (opts: {
    focusDurationSecs?: number;
    breakDurationSecs?: number;
    checkInIntervalSecs?: number;
    audioEnabled?: boolean;
  }) => invoke<TimerStateResponse>('update_settings', opts),

  // Event listeners
  onTimerTick: (handler: (state: TimerStateResponse) => void): Promise<UnlistenFn> =>
    listen<TimerStateResponse>('timer-tick', (e) => handler(e.payload)),
  onTimerComplete: (handler: (phase: TimerPhase) => void): Promise<UnlistenFn> =>
    listen<TimerPhase>('timer-complete', (e) => handler(e.payload)),
  onCheckIn: (handler: (taskName: string | null) => void): Promise<UnlistenFn> =>
    listen<string | null>('check-in', (e) => handler(e.payload)),
  onReminderTriggered: (handler: (data: { id: string; text: string }) => void): Promise<UnlistenFn> =>
    listen<{ id: string; text: string }>('reminder-triggered', (e) => handler(e.payload)),
  onRemindersChanged: (handler: () => void): Promise<UnlistenFn> =>
    listen('reminders-changed', () => handler()),
};
