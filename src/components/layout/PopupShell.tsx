import React from 'react';
import type { ActiveTab } from '../../types';
import { TabBar } from './TabBar';
import { TimerView } from '../timer/TimerView';
import { TaskFocusPage } from '../tasks/TaskFocusPage';
import { ReminderPage } from '../reminders/ReminderPage';
import { SettingsPanel } from '../settings/SettingsPanel';
import { useTimer } from '../../hooks/useTimer';
import { useTasks } from '../../hooks/useTasks';
import { useReminders } from '../../hooks/useReminders';
import { initNotifications } from '../../lib/notifications';

export function PopupShell() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('timer');
  const timer = useTimer();
  const tasks = useTasks();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const reminders = useReminders(refreshKey);

  React.useEffect(() => {
    initNotifications().catch(() => {});
  }, []);

  // Refresh reminders when popup becomes visible
  React.useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <div className="popup-shell">
      <header className="popup-header" data-tauri-drag-region>
        <span className="app-title" data-tauri-drag-region>专注</span>
      </header>
      <main className="popup-content">
        {activeTab === 'timer' && (
          <TimerView timer={timer} currentTask={tasks.currentTask} />
        )}
        {activeTab === 'tasks' && (
          <TaskFocusPage tasks={tasks} />
        )}
        {activeTab === 'reminders' && (
          <ReminderPage reminders={reminders} />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel timer={timer} />
        )}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
