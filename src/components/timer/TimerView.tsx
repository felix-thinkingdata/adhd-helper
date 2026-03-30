import React from 'react';
import type { TimerStateResponse, Task } from '../../types';
import { CircularProgress } from './CircularProgress';
import { TimerControls } from './TimerControls';

interface TimerViewProps {
  timer: {
    timerState: TimerStateResponse;
    startFocus: () => Promise<void>;
    startBreak: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
  currentTask: Task | null;
}

export function TimerView({ timer, currentTask }: TimerViewProps) {
  const { timerState, startFocus, startBreak, pause, resume, stop } = timer;
  const { phase, is_running, is_paused } = timerState;

  const phaseLabel = phase === 'focus' ? '专注中' : phase === 'break' ? '休息中' : '准备就绪';

  return (
    <div className="timer-view">
      <CircularProgress timerState={timerState} />
      <div className="timer-phase-label">{phaseLabel}</div>
      <TimerControls
        isRunning={is_running}
        isPaused={is_paused}
        phase={phase}
        onStartFocus={startFocus}
        onStartBreak={startBreak}
        onPause={pause}
        onResume={resume}
        onStop={stop}
      />
      {currentTask && is_running && phase === 'focus' && (
        <div className="current-task-inline">
          <span className="current-task-label">正在做：</span>
          <span className="current-task-title">{currentTask.title}</span>
        </div>
      )}
    </div>
  );
}
