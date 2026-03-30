import React from 'react';
import type { Reminder } from '../../types';

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => Promise<void>;
}

function formatInterval(secs: number): string {
  const mins = secs / 60;
  if (mins < 60) return `每${mins}分钟`;
  const hours = mins / 60;
  if (hours === Math.floor(hours)) return `每${hours}小时`;
  return `每${Math.floor(hours)}小时${mins % 60}分钟`;
}

function formatTime(secs: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, secs - now);
  const mins = Math.floor(diff / 60);
  if (mins < 1) return '不到1分钟';
  if (mins < 60) return `${mins}分钟后`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (remainMins === 0) return `${hours}小时后`;
  return `${hours}小时${remainMins}分钟后`;
}

export function ReminderList({ reminders, onDelete }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <div className="reminder-empty">
        <p>暂无提醒</p>
      </div>
    );
  }

  return (
    <ul className="reminder-list">
      {reminders.map((r) => (
        <li key={r.id} className="reminder-item">
          <div className="reminder-content">
            <span className="reminder-text">{r.text}</span>
            <span className="reminder-time">
              {r.recur_interval_secs
                ? `${formatInterval(r.recur_interval_secs)} · ${formatTime(r.trigger_at_secs)}`
                : formatTime(r.trigger_at_secs)}
            </span>
          </div>
          <button className="btn-icon" onClick={() => onDelete(r.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}
