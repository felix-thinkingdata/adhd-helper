import React from 'react';
import type { TimerStateResponse } from '../../types';

interface CircularProgressProps {
  timerState: TimerStateResponse;
}

const RADIUS = 70;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgress({ timerState }: CircularProgressProps) {
  const { remaining_secs, total_secs, phase } = timerState;
  const progress = total_secs > 0 ? remaining_secs / total_secs : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const mins = Math.floor(remaining_secs / 60);
  const secs = remaining_secs % 60;
  const timeText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const colorClass = phase === 'focus' ? 'ring-focus' : phase === 'break' ? 'ring-break' : 'ring-idle';

  return (
    <div className="circular-progress">
      <svg viewBox="0 0 160 160" className="progress-svg">
        <circle
          className="progress-bg"
          cx="80" cy="80" r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <circle
          className={`progress-ring ${colorClass}`}
          cx="80" cy="80" r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="progress-text">
        <span className="progress-time">{timeText}</span>
      </div>
    </div>
  );
}
