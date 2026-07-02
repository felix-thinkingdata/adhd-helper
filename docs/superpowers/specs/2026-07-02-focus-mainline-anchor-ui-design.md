# Focus Mainline Anchor UI Design

## Status

Approved direction: A. Mainline Anchor.

This spec covers a UI refresh for the existing Focus macOS menu bar popup. It does not change timer, task, reminder, settings, storage, notification, or Tauri behavior.

## Assumptions

- The product remains a 320px-wide macOS menu bar utility.
- The desired personality is a warm "external brain": calm, low-stimulus, and gently directive.
- The implementation should be a light visual and hierarchy pass, not a navigation or workflow redesign.
- New dependencies, icon libraries, custom fonts, telemetry, onboarding, and feature additions are out of scope.

## Success Criteria

- The timer and task pages make the current task, remaining time, and next action clearer at a glance.
- The UI no longer reads as a generic warm dark theme; it has one memorable visual signature.
- All four tabs remain usable in the 320px popup without overflow or text overlap.
- Build passes with `npm run build`.
- The implementation touches only UI presentation files unless a tiny markup change is needed to support the visual hierarchy.

## Design Direction

Focus will use a "mainline" visual structure: a thin vertical rail with a current-node marker. The rail represents returning to the one active thread of attention. It is a subject-specific signature for ADHD support, not a decorative divider.

The UI should feel like a quiet instrument: present, readable, and calm. It should avoid gamification, achievement language, busy cards, broad gradients, and high-stimulation effects.

## Visual Tokens

Colors:

- `main-bg`: `#111719` deep blue-green black for the popup background.
- `panel-bg`: `#172023` quiet raised surface.
- `panel-bg-soft`: `#1D292D` secondary surface.
- `mainline`: `#8ECAD7` soft cyan-blue for the focus rail and primary action.
- `rest`: `#9BC6A6` muted green for break state.
- `danger`: `#D4867E` low-saturation red for destructive stop/delete.
- `text-primary`: `#E7F0EF`.
- `text-muted`: `#7E8D91`.

Type:

- Use the existing system font stack.
- Use tabular numerals for timer digits.
- Keep labels compact and quiet; avoid uppercase where Chinese copy reads better without it.
- Preserve Chinese interface copy, but make action labels direct and consistent.

Shape and spacing:

- Keep compact macOS utility density.
- Use 8px or smaller radii for controls and framed repeated items.
- Use one main surface depth, not nested decorative cards.

Motion:

- Keep the existing timer ring motion restrained.
- The rail marker glows subtly only during active focus.
- Respect `prefers-reduced-motion`.

## Layout

Timer tab:

```text
header
content
  rail | status copy
       | current task when focusing
       | circular timer
       | phase label
       | primary/secondary actions
tabs
```

Task tab:

```text
input row
rail | "只做这一件"
     | current task title
     | complete / skip actions
     | hidden task count
empty state when no task
```

Reminders and settings tabs keep their current structure. They receive the same palette, button, input, list, and tab styling so the app feels cohesive.

## Components

Primary implementation target:

- `src/styles/global.css`: token refresh, mainline rail classes, button/input/list/tabs polish.

Allowed small markup changes:

- `src/components/timer/TimerView.tsx`: wrap timer content in a mainline layout and move current task into that structure if CSS alone cannot create the hierarchy.
- `src/components/tasks/TaskFocus.tsx` or `TaskFocusPage.tsx`: wrap current task block in the same mainline structure if CSS alone cannot create the hierarchy.

Do not change:

- Hooks.
- Tauri API wrappers.
- Rust backend.
- Timer state model.
- Task/reminder persistence behavior.

## Data Flow

No data flow changes. Existing React hooks continue to provide timer, task, reminder, and settings state. UI components only render the same values with improved hierarchy.

## Error And Empty States

- Keep current invalid-input behavior: empty task/reminder submit does nothing.
- Empty task state should remain direct and non-emotional.
- Empty reminder state should remain short.
- No new error handling is added because this is a UI-only change.

## Accessibility

- Preserve visible focus styles.
- Maintain color contrast for text and controls on the dark background.
- Do not rely on the rail color alone to communicate state; text labels remain visible.
- Keep reduced-motion behavior for active timer effects.

## Testing And Verification

- Run `npm run build`.
- Open the app or Vite preview at the 320px popup size.
- Check timer, task, reminder, and settings tabs for overflow and text overlap.
- Check active focus, idle, break, and empty task/reminder states where available.

## Skipped

- Custom font loading.
- Icon library installation.
- Full navigation redesign.
- New onboarding copy.
- New reminders/settings workflows.
- Screenshot automation unless implementation changes make visual regressions hard to judge manually.
