import React from 'react';
import type { Task } from '../../types';

interface TaskFocusProps {
  task: Task;
  remainingCount: number;
  onDone: () => void;
  onSkip: () => void;
}

export function TaskFocus({ task, remainingCount, onDone, onSkip }: TaskFocusProps) {
  return (
    <div className="task-focus mainline-layout">
      <div className="mainline-rail" aria-hidden="true">
        <span className="mainline-node active" />
      </div>
      <div className="mainline-content">
        <p className="mainline-kicker">只做这一件</p>
        <div className="task-title-large">{task.title}</div>
        <div className="task-actions">
          <button className="btn btn-success" onClick={onDone}>
            完成
          </button>
          <button
            className="btn btn-secondary"
            onClick={onSkip}
            disabled={remainingCount <= 1}
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  );
}
