import React from 'react';
import type { Task } from '../../types';
import { TaskFocus } from './TaskFocus';
import { TaskInput } from './TaskInput';

interface TaskFocusPageProps {
  tasks: {
    currentTask: Task | null;
    remainingCount: number;
    addTask: (title: string) => Promise<void>;
    completeCurrentTask: () => Promise<void>;
    skipCurrentTask: () => Promise<void>;
  };
}

export function TaskFocusPage({ tasks }: TaskFocusPageProps) {
  const { currentTask, remainingCount, addTask, completeCurrentTask, skipCurrentTask } = tasks;

  return (
    <div className="task-page">
      <TaskInput onAdd={addTask} />
      {currentTask ? (
        <>
          <TaskFocus
            task={currentTask}
            remainingCount={remainingCount}
            onDone={completeCurrentTask}
            onSkip={skipCurrentTask}
          />
          {remainingCount > 1 && (
            <p className="task-remaining">还有 {remainingCount - 1} 个任务已隐藏</p>
          )}
        </>
      ) : (
        <div className="task-empty">
          <p>全部完成！添加一个任务开始吧。</p>
        </div>
      )}
    </div>
  );
}
