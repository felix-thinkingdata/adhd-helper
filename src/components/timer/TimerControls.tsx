import React from 'react';
import type { TimerPhase } from '../../types';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  phase: TimerPhase;
  onStartFocus: () => void;
  onStartBreak: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TimerControls({
  isRunning, isPaused, phase,
  onStartFocus, onStartBreak, onPause, onResume, onStop,
}: TimerControlsProps) {
  if (!isRunning) {
    return (
      <div className="timer-controls">
        <button className="btn btn-primary" onClick={onStartFocus}>
          开始专注
        </button>
        {phase === 'idle' && (
          <button className="btn btn-secondary" onClick={onStartBreak}>
            开始休息
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="timer-controls">
      {isPaused ? (
        <button className="btn btn-primary" onClick={onResume}>
          继续
        </button>
      ) : (
        <button className="btn btn-secondary" onClick={onPause}>
          暂停
        </button>
      )}
      <button className="btn btn-danger" onClick={onStop}>
        停止
      </button>
    </div>
  );
}
