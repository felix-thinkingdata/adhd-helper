import React from 'react';
import type { ActiveTab } from '../../types';

interface TabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; icon: string; label: string }[] = [
  { id: 'timer', icon: '⏱', label: '计时' },
  { id: 'tasks', icon: '☐', label: '任务' },
  { id: 'reminders', icon: '🔔', label: '提醒' },
  { id: 'settings', icon: '⚙', label: '设置' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
