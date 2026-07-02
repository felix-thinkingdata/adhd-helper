# Focus Mainline Anchor UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Focus popup UI around the approved "mainline anchor" direction without changing app behavior.

**Architecture:** Keep the existing React/Tauri structure. Add the smallest JSX wrappers needed for the timer and current-task areas, then implement the visual system in `src/styles/global.css`. Reminders and settings keep their markup and inherit the new shared tokens and controls.

**Tech Stack:** React 18, TypeScript, CSS, Vite, Tauri 2.

---

## File Structure

- Modify `src/styles/global.css`: replace the warm dark theme tokens, add shared mainline rail classes, and polish existing controls/lists/tabs.
- Modify `src/components/timer/TimerView.tsx`: wrap timer content in a `mainline-layout` so the rail can connect status, task, timer, and actions.
- Modify `src/components/tasks/TaskFocus.tsx`: wrap the current task display in the same `mainline-layout`.
- Do not modify hooks, Rust, Tauri API wrappers, persistence, or notification files.

## Task 1: Shared Visual Tokens And Controls

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace the `:root` token block**

Replace the existing `:root { ... }` block at the top of `src/styles/global.css` with:

```css
:root {
  --bg-0: #111719;
  --bg-1: #172023;
  --bg-2: #1d292d;
  --bg-3: #263438;

  --border: #26383d;
  --border-hover: #375057;

  --text-0: #e7f0ef;
  --text-1: #a9b8bb;
  --text-2: #7e8d91;

  --accent: #8ecad7;
  --accent-hover: #a6d7e0;
  --accent-dim: rgba(142, 202, 215, 0.12);
  --accent-glow: rgba(142, 202, 215, 0.28);

  --focus: #8ecad7;
  --focus-dim: rgba(142, 202, 215, 0.12);
  --focus-glow: rgba(142, 202, 215, 0.28);

  --break: #9bc6a6;
  --break-dim: rgba(155, 198, 166, 0.12);
  --break-glow: rgba(155, 198, 166, 0.24);

  --danger: #d4867e;
  --danger-dim: rgba(212, 134, 126, 0.10);
  --idle: #425055;

  --r-sm: 6px;
  --r-md: 8px;

  --font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 2: Update shell ambient styling**

Replace `.popup-shell::before` with a subtler mainline-themed glow:

```css
.popup-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 170px;
  background: radial-gradient(ellipse at 48% -42%, var(--accent-dim) 0%, transparent 68%);
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 3: Update buttons and active option colors**

In `src/styles/global.css`, keep existing class names but make these focused replacements:

```css
.btn-primary {
  background: var(--accent);
  color: #0f1719;
  border-color: var(--accent);
}

.btn-primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn-success {
  background: transparent;
  color: var(--break);
  border-color: rgba(155, 198, 166, 0.45);
}

.btn-success:hover {
  background: var(--break-dim);
}

.btn-danger {
  background: transparent;
  color: var(--danger);
  border-color: rgba(212, 134, 126, 0.38);
}

.btn-danger:hover {
  background: var(--danger-dim);
  border-color: var(--danger);
}

.btn-option.active,
.reminder-mode-toggle .btn-toggle.active {
  background: var(--accent);
  color: #0f1719;
  border-color: var(--accent);
  font-weight: 650;
}
```

- [ ] **Step 4: Run the build check**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 5: Commit shared visual token work**

Run:

```bash
git add src/styles/global.css
git commit -m "style: refresh Focus visual tokens"
```

## Task 2: Timer Mainline Layout

**Files:**
- Modify: `src/components/timer/TimerView.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace `TimerView` return markup**

In `src/components/timer/TimerView.tsx`, replace the current `return (...)` block with:

```tsx
  return (
    <div className={`timer-view timer-view-${phase}`}>
      <div className="mainline-layout">
        <div className="mainline-rail" aria-hidden="true">
          <span className={`mainline-node ${is_running && phase === 'focus' ? 'active' : ''}`} />
        </div>
        <div className="mainline-content">
          <p className="mainline-kicker">现在回到这一件事</p>
          {currentTask && is_running && phase === 'focus' && (
            <div className="current-task-inline">
              <span className="current-task-label">正在做</span>
              <span className="current-task-title">{currentTask.title}</span>
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 2: Add shared mainline CSS**

Add this block above the `/* ===== Timer ===== */` section in `src/styles/global.css`:

```css
/* ===== Mainline ===== */
.mainline-layout {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.mainline-rail {
  position: relative;
}

.mainline-rail::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 8px;
  left: 10px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--accent), rgba(142, 202, 215, 0.12));
}

.mainline-node {
  position: absolute;
  top: 46px;
  left: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 16px var(--accent-glow);
}

.mainline-node.active {
  animation: node-pulse 3s ease-in-out infinite;
}

@keyframes node-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(142, 202, 215, 0.22); }
  50% { box-shadow: 0 0 20px rgba(142, 202, 215, 0.42); }
}

.mainline-content {
  min-width: 0;
}

.mainline-kicker {
  margin-bottom: 14px;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
}
```

- [ ] **Step 3: Replace timer layout CSS**

Replace `.timer-view`, `.current-task-inline`, `.current-task-label`, and `.current-task-title` with:

```css
.timer-view {
  padding-top: 6px;
}

.timer-view .mainline-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.timer-view .mainline-kicker {
  align-self: stretch;
}

.current-task-inline {
  text-align: left;
  padding: 10px 12px;
  background: var(--bg-1);
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  width: 100%;
}

.current-task-label {
  display: block;
  font-size: 11px;
  color: var(--text-2);
  margin-bottom: 4px;
}

.current-task-title {
  display: block;
  font-size: 14px;
  color: var(--text-0);
  font-weight: 700;
  line-height: 1.35;
}
```

- [ ] **Step 4: Extend reduced-motion handling**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add `.mainline-node.active` to the no-animation selector:

```css
  .ring-focus, .ring-break, .mainline-node.active {
    animation: none !important;
  }
```

- [ ] **Step 5: Run the build check**

Run:

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit timer mainline work**

Run:

```bash
git add src/components/timer/TimerView.tsx src/styles/global.css
git commit -m "style: add mainline timer layout"
```

## Task 3: Task Page Mainline And Final Verification

**Files:**
- Modify: `src/components/tasks/TaskFocus.tsx`
- Modify: `src/components/tasks/TaskFocusPage.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace `TaskFocus` return markup**

In `src/components/tasks/TaskFocus.tsx`, replace the current `return (...)` block with:

```tsx
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
```

- [ ] **Step 2: Keep hidden task count adjacent to the current task**

In `src/components/tasks/TaskFocusPage.tsx`, keep the same conditional logic but move the remaining count directly after `TaskFocus`:

```tsx
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
```

Expected: this matches the current codebase shape. If `git diff` shows no change for this file, do not edit it.

- [ ] **Step 3: Replace task focus CSS**

Replace `.task-focus`, `.task-title-large`, `.task-actions`, `.task-remaining`, and `.task-empty` in `src/styles/global.css` with:

```css
.task-focus {
  padding: 18px 0;
}

.task-focus .mainline-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.task-title-large {
  font-size: 18px;
  font-weight: 750;
  color: var(--text-0);
  line-height: 1.35;
  word-break: break-word;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.task-remaining {
  margin-left: 32px;
  font-size: 11px;
  color: var(--text-2);
}

.task-empty {
  padding: 34px 16px;
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-1);
}
```

- [ ] **Step 4: Verify no disallowed files changed**

Run:

```bash
git diff --name-only
```

Expected output contains only these paths:

```text
src/components/tasks/TaskFocus.tsx
src/components/tasks/TaskFocusPage.tsx
src/components/timer/TimerView.tsx
src/styles/global.css
```

If `TaskFocusPage.tsx` was unchanged, it will not appear.

- [ ] **Step 5: Run final build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Manual visual check**

Open the app or Vite preview at the popup width and check:

```text
Timer idle: rail visible, 00:00 centered, buttons fit.
Timer focus with a current task: task text, timer, and controls fit without overlap.
Task page with a long task title: title wraps within the panel.
Task empty state: message remains centered and readable.
Reminder and settings tabs: existing controls inherit the new palette and do not overflow.
Reduced motion: active rail marker stops animating when reduced motion is enabled.
```

- [ ] **Step 7: Commit task page and final UI work**

Run:

```bash
git add src/components/tasks/TaskFocus.tsx src/components/tasks/TaskFocusPage.tsx src/components/timer/TimerView.tsx src/styles/global.css
git commit -m "style: add mainline task layout"
```

## Self-Review

- Spec coverage: visual tokens, mainline signature, timer/task hierarchy, inherited reminder/settings styling, accessibility, reduced motion, and build verification are covered.
- Scope check: no task changes hooks, Rust, storage, notifications, or Tauri commands.
- Red-flag scan: no incomplete implementation markers or deferred-detail steps.
- Type consistency: class names used in JSX are defined in the CSS tasks.
