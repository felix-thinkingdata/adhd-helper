import React from 'react';
import type { TimerStateResponse } from '../../types';
import { tauriApi } from '../../lib/tauri-api';
import { loadSettings, saveSettings } from '../../lib/store';
import type { Settings } from '../../types';

interface SettingsPanelProps {
  timer: {
    timerState: TimerStateResponse;
    focusDuration: number;
    breakDuration: number;
    setFocusDuration: (v: number) => void;
    setBreakDuration: (v: number) => void;
  };
}

const FOCUS_OPTIONS = [15, 20, 25, 30, 45];
const BREAK_OPTIONS = [3, 5, 10, 15];
const CHECKIN_OPTIONS = [5, 10, 15, 20];

export function SettingsPanel({ timer }: SettingsPanelProps) {
  const [settings, setSettings] = React.useState<Settings | null>(null);

  React.useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      timer.setFocusDuration(s.focusDurationMinutes * 60);
      timer.setBreakDuration(s.breakDurationMinutes * 60);
    });
  }, []);

  const updateSetting = async (key: keyof Settings, value: number | boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);

    if (key === 'focusDurationMinutes') {
      timer.setFocusDuration((value as number) * 60);
      await tauriApi.updateSettings({ focusDurationSecs: (value as number) * 60 });
    } else if (key === 'breakDurationMinutes') {
      timer.setBreakDuration((value as number) * 60);
      await tauriApi.updateSettings({ breakDurationSecs: (value as number) * 60 });
    } else if (key === 'checkInIntervalMinutes') {
      await tauriApi.updateSettings({ checkInIntervalSecs: (value as number) * 60 });
    } else if (key === 'audioEnabled') {
      await tauriApi.updateSettings({ audioEnabled: value as boolean });
    }
  };

  if (!settings) return null;

  return (
    <div className="settings-panel">
      <div className="setting-group">
        <label className="setting-label">专注时长</label>
        <div className="setting-options">
          {FOCUS_OPTIONS.map((v) => (
            <button
              key={v}
              className={`btn btn-option ${settings.focusDurationMinutes === v ? 'active' : ''}`}
              onClick={() => updateSetting('focusDurationMinutes', v)}
            >
              {v}分钟
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">休息时长</label>
        <div className="setting-options">
          {BREAK_OPTIONS.map((v) => (
            <button
              key={v}
              className={`btn btn-option ${settings.breakDurationMinutes === v ? 'active' : ''}`}
              onClick={() => updateSetting('breakDurationMinutes', v)}
            >
              {v}分钟
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">检查间隔</label>
        <div className="setting-options">
          {CHECKIN_OPTIONS.map((v) => (
            <button
              key={v}
              className={`btn btn-option ${settings.checkInIntervalMinutes === v ? 'active' : ''}`}
              onClick={() => updateSetting('checkInIntervalMinutes', v)}
            >
              {v}分钟
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">声音通知</label>
        <button
          className={`btn btn-toggle ${settings.audioEnabled ? 'active' : ''}`}
          onClick={() => updateSetting('audioEnabled', !settings.audioEnabled)}
        >
          {settings.audioEnabled ? '开启' : '关闭'}
        </button>
      </div>
    </div>
  );
}
