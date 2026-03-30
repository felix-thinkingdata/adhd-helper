import { useState, useEffect, useCallback } from 'react';
import { tauriApi } from '../lib/tauri-api';
import { loadTasks, saveTasks } from '../lib/store';
import type { Task } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadTasks().then((loaded) => {
      setTasks(loaded);
      setCurrentIndex(0);
      if (loaded.length > 0) {
        const firstActive = loaded.find((t) => !t.completedAt);
        if (firstActive) {
          tauriApi.setCurrentTask(firstActive.title).catch(() => {});
        }
      }
    });
  }, []);

  const persistTasks = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    await saveTasks(newTasks);
  }, []);

  const addTask = useCallback(async (title: string) => {
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: Date.now(),
      completedAt: null,
      skipped: false,
    };
    const newTasks = [...tasks, task];
    await persistTasks(newTasks);
    const activeBeforeAdd = tasks.filter((t) => !t.completedAt);
    if (activeBeforeAdd.length === 0) {
      setCurrentIndex(0);
      await tauriApi.setCurrentTask(task.title);
    }
  }, [tasks, persistTasks]);

  const completeCurrentTask = useCallback(async () => {
    const activeTasks = tasks.filter((t) => !t.completedAt);
    const task = activeTasks[currentIndex];
    if (!task) return;
    try {
      const newTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, completedAt: Date.now() } : t
      );
      const remaining = newTasks.filter((t) => t.completedAt === null);
      await persistTasks(newTasks);

      const nextIndex = currentIndex < remaining.length ? currentIndex : Math.max(0, remaining.length - 1);
      setCurrentIndex(nextIndex);

      if (remaining.length > 0) {
        await tauriApi.setCurrentTask(remaining[nextIndex]?.title ?? null);
      } else {
        await tauriApi.setCurrentTask(null);
      }
    } catch (e) {
      alert('完成任务失败: ' + String(e));
    }
  }, [tasks, currentIndex, persistTasks]);

  const skipCurrentTask = useCallback(async () => {
    const activeTasks = tasks.filter((t) => !t.completedAt);
    if (activeTasks.length <= 1) return;
    const nextIndex = (currentIndex + 1) % activeTasks.length;
    setCurrentIndex(nextIndex);
    const nextTask = activeTasks[nextIndex];
    if (nextTask) {
      await tauriApi.setCurrentTask(nextTask.title);
    }
  }, [tasks, currentIndex]);

  const currentTask = tasks.filter((t) => !t.completedAt)[currentIndex] ?? null;
  const remainingCount = tasks.filter((t) => !t.completedAt).length;

  return {
    currentTask,
    remainingCount,
    addTask,
    completeCurrentTask,
    skipCurrentTask,
  };
}
