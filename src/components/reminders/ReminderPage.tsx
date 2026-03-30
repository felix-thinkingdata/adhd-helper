import React from 'react';
import type { Reminder } from '../../types';
import { ReminderInput } from './ReminderInput';
import { ReminderList } from './ReminderList';

interface ReminderPageProps {
  reminders: {
    reminders: Reminder[];
    addReminder: (text: string, triggerInSecs: number, recurIntervalSecs?: number) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;
  };
}

export function ReminderPage({ reminders: reminderApi }: ReminderPageProps) {
  return (
    <div className="reminder-page">
      <ReminderInput onAdd={reminderApi.addReminder} />
      <ReminderList
        reminders={reminderApi.reminders}
        onDelete={reminderApi.deleteReminder}
      />
    </div>
  );
}
