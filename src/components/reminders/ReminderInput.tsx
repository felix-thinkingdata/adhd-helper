import React, { useState } from 'react';

interface ReminderInputProps {
  onAdd: (text: string, triggerInSecs: number, recurIntervalSecs?: number) => Promise<void>;
}

const ONCE_PRESETS = [
  { label: '5分钟', secs: 300 },
  { label: '10分钟', secs: 600 },
  { label: '30分钟', secs: 1800 },
  { label: '1小时', secs: 3600 },
];

const RECUR_PRESETS = [
  { label: '每15分钟', secs: 900 },
  { label: '每30分钟', secs: 1800 },
  { label: '每1小时', secs: 3600 },
];

export function ReminderInput({ onAdd }: ReminderInputProps) {
  const [text, setText] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const handlePreset = async (secs: number) => {
    const reminderText = text.trim() || '提醒！';
    if (isRecurring) {
      await onAdd(reminderText, secs, secs);
    } else {
      await onAdd(reminderText, secs);
    }
    setText('');
  };

  const handleCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (isRecurring) {
      await onAdd(text.trim(), 900, 900); // default every 15 min
    } else {
      await onAdd(text.trim(), 300); // default 5 min
    }
    setText('');
  };

  const presets = isRecurring ? RECUR_PRESETS : ONCE_PRESETS;

  return (
    <div className="reminder-input">
      <form onSubmit={handleCustom}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="提醒我..."
          className="input"
        />
      </form>
      <div className="reminder-mode-toggle">
        <button
          className={`btn btn-toggle ${!isRecurring ? 'active' : ''}`}
          onClick={() => setIsRecurring(false)}
        >
          一次
        </button>
        <button
          className={`btn btn-toggle ${isRecurring ? 'active' : ''}`}
          onClick={() => setIsRecurring(true)}
        >
          周期
        </button>
      </div>
      <div className="reminder-presets">
        {presets.map((p) => (
          <button
            key={p.label}
            className="btn btn-preset"
            onClick={() => handlePreset(p.secs)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
