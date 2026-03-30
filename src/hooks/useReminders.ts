import { useState, useEffect, useCallback } from 'react';
import { tauriApi } from '../lib/tauri-api';
import type { Reminder } from '../types';

export function useReminders(refreshKey = 0) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    tauriApi.listReminders().then(setReminders).catch(() => {});

    const unlisten1 = tauriApi.onReminderTriggered((data) => {
      // Notification handled by Rust backend
      // Recurring reminders stay in list (backend resets trigger_at_secs),
      // one-time reminders are removed by backend, refresh list to sync.
      tauriApi.listReminders().then(setReminders).catch(() => {});
    });

    const unlisten2 = tauriApi.onRemindersChanged(() => {
      tauriApi.listReminders().then(setReminders).catch(() => {});
    });

    return () => {
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
    };
  }, [refreshKey]);

  const addReminder = useCallback(async (text: string, triggerInSecs: number, recurIntervalSecs?: number) => {
    const reminder = await tauriApi.addReminder(text, triggerInSecs, recurIntervalSecs);
    setReminders((prev) => [...prev, reminder].sort((a, b) => a.trigger_at_secs - b.trigger_at_secs));
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    await tauriApi.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    reminders,
    addReminder,
    deleteReminder,
  };
}
