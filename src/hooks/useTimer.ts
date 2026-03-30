import { useState, useEffect, useCallback } from 'react';
import { tauriApi } from '../lib/tauri-api';
import type { TimerStateResponse, TimerPhase } from '../types';

const INITIAL_STATE: TimerStateResponse = {
  remaining_secs: 0,
  total_secs: 0,
  phase: 'idle',
  is_running: false,
  is_paused: false,
  current_task_name: null,
};

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerStateResponse>(INITIAL_STATE);
  const [focusDuration, setFocusDuration] = useState(1500);
  const [breakDuration, setBreakDuration] = useState(300);

  useEffect(() => {
    const unlisteners: Promise<(() => void)>[] = [];

    unlisteners.push(
      tauriApi.onTimerTick((state) => {
        setTimerState(state);
      })
    );

    unlisteners.push(
      tauriApi.onTimerComplete((phase: TimerPhase) => {
        // Notification handled by Rust backend
      })
    );

    unlisteners.push(
      tauriApi.onCheckIn((taskName) => {
        // Notification handled by Rust backend
      })
    );

    // Load initial state
    tauriApi.getTimerState().then(setTimerState).catch(() => {});

    return () => {
      Promise.all(unlisteners).then((funcs) => {
        funcs.forEach((fn) => fn());
      });
    };
  }, []);

  const startFocus = useCallback(async () => {
    try {
      const state = await tauriApi.startTimer(focusDuration, 'focus');
      setTimerState(state);
    } catch (e) {
      alert('启动专注失败: ' + String(e));
    }
  }, [focusDuration]);

  const startBreak = useCallback(async () => {
    try {
      const state = await tauriApi.startTimer(breakDuration, 'break');
      setTimerState(state);
    } catch (e) {
      alert('启动休息失败: ' + String(e));
    }
  }, [breakDuration]);

  const pause = useCallback(async () => {
    const state = await tauriApi.pauseTimer();
    setTimerState(state);
  }, []);

  const resume = useCallback(async () => {
    const state = await tauriApi.resumeTimer();
    setTimerState(state);
  }, []);

  const stop = useCallback(async () => {
    const state = await tauriApi.stopTimer();
    setTimerState(state);
  }, []);

  return {
    timerState,
    focusDuration,
    breakDuration,
    setFocusDuration,
    setBreakDuration,
    startFocus,
    startBreak,
    pause,
    resume,
    stop,
  };
}
