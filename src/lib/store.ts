import { load, type Store } from '@tauri-apps/plugin-store';
import type { Settings, Task } from '../types';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await load('app-store.json', {
      autoSave: 100,
      defaults: {},
    });
  }
  return store;
}

export async function loadTasks(): Promise<Task[]> {
  const s = await getStore();
  return (await s.get<Task[]>('tasks')) ?? [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const s = await getStore();
  await s.set('tasks', tasks);
}

export async function loadSettings(): Promise<Settings> {
  const s = await getStore();
  return (await s.get<Settings>('settings')) ?? {
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    checkInIntervalMinutes: 10,
    audioEnabled: true,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const s = await getStore();
  await s.set('settings', settings);
}
