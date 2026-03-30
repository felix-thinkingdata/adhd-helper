# Focus — ADHD Helper 架构文档

## 1. 产品定位

**Focus** 是一款面向 ADHD（注意力缺陷多动障碍）人群的 macOS 菜单栏常驻工具。它通过外部结构化手段（而非依赖内部意志力）来弥补 ADHD 大脑在执行功能上的不足。

### 设计理念

| ADHD 痛点 | 对应功能 | 设计原理 |
|-----------|---------|---------|
| 时间感知差 (Time Blindness) | 可视化番茄钟 + 托盘时间 | 将抽象的时间具象化，托盘图标实时显示剩余时间 |
| 任务瘫痪 (Task Paralysis) | "只看一个"任务聚焦 | 隐藏任务队列，只展示当前一个任务，消除决策压力 |
| 注意力漂移 (Distraction) | 定期专注检查 | 每隔 N 分钟系统通知提醒"你还在做这件事吗？" |
| 工作记忆缺陷 (Working Memory) | 快速提醒 | 一键设置 5/10/30/60 分钟后提醒，弥补遗忘 |

---

## 2. 技术栈

```
┌─────────────────────────────────────┐
│          macOS Desktop App          │
├──────────────┬──────────────────────┤
│   Frontend   │      Backend         │
│              │                      │
│  React 18    │  Tauri 2.x (Rust)    │
│  TypeScript  │  tokio (async)       │
│  Vite 5      │  serde (JSON)        │
│  CSS (dark)  │  std::sync (Mutex)   │
├──────────────┴──────────────────────┤
│           Tauri Plugins             │
│  store | notification | positioner  │
├─────────────────────────────────────┤
│              macOS                  │
│  Menu Bar (Accessory) | Darwin      │
└─────────────────────────────────────┘
```

| 依赖 | 版本 | 用途 |
|------|-----|------|
| tauri | 2.x | 跨平台桌面框架，Rust 核心 |
| tauri-plugin-store | 2 | 本地 JSON 持久化 |
| tauri-plugin-notification | 2 | macOS 系统通知 |
| tauri-plugin-positioner | 2 | 窗口定位到托盘下方 |
| serde / serde_json | 1 | Rust 序列化 |
| uuid | 1 | 提醒 ID 生成 |
| react / react-dom | 18 | UI 框架 |
| vite | 5 | 构建工具 + HMR |
| typescript | 5 | 类型安全 |

---

## 3. 项目结构

```
adhd-helper/
├── docs/                              # 文档
├── src/                               # React 前端
│   ├── main.tsx                       # React 入口
│   ├── App.tsx                        # 根组件
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PopupShell.tsx         # 弹窗框架 + 拖拽区
│   │   │   └── TabBar.tsx             # 底部 4-Tab 导航
│   │   ├── timer/
│   │   │   ├── TimerView.tsx          # 计时器页面
│   │   │   ├── CircularProgress.tsx   # SVG 圆环倒计时
│   │   │   └── TimerControls.tsx      # 开始/暂停/停止按钮
│   │   ├── tasks/
│   │   │   ├── TaskFocusPage.tsx      # 任务页面
│   │   │   ├── TaskFocus.tsx          # 单任务展示
│   │   │   └── TaskInput.tsx          # 添加任务输入框
│   │   ├── reminders/
│   │   │   ├── ReminderPage.tsx       # 提醒页面
│   │   │   ├── ReminderInput.tsx      # 添加 + 快捷按钮
│   │   │   └── ReminderList.tsx       # 提醒列表
│   │   └── settings/
│   │       └── SettingsPanel.tsx       # 设置面板
│   ├── hooks/
│   │   ├── useTimer.ts                # 计时器状态 + Tauri 事件订阅
│   │   ├── useTasks.ts                # 任务队列 CRUD + 持久化
│   │   └── useReminders.ts            # 提醒 CRUD + 触发监听
│   ├── lib/
│   │   ├── tauri-api.ts               # 所有 Tauri invoke 的类型化封装
│   │   ├── store.ts                   # plugin-store 封装
│   │   └── notifications.ts           # 通知权限 + 发送
│   ├── types/
│   │   └── index.ts                   # 全局类型定义
│   └── styles/
│       └── global.css                 # 暗色主题 + 全部样式
├── src-tauri/                         # Rust 后端
│   ├── Cargo.toml                     # Rust 依赖
│   ├── tauri.conf.json                # Tauri 窗口/构建配置
│   ├── capabilities/
│   │   └── default.json               # Tauri 2.x 权限声明
│   ├── icons/                         # 应用图标
│   └── src/
│       ├── main.rs                    # 入口：Builder + 插件 + 托盘 + setup
│       ├── state.rs                   # AppState / InnerState / TimerPhase / Reminder
│       ├── background.rs              # 后台线程：计时器 tick / 检查 / 提醒
│       └── commands/
│           ├── mod.rs                 # 模块导出
│           ├── timer.rs               # start/pause/resume/stop/get_state/update_settings
│           ├── tasks.rs               # set_current_task / get_current_task
│           └── reminders.rs           # add / list / delete
├── index.html                         # HTML shell
├── vite.config.ts                     # Vite 配置
├── tsconfig.json                      # TypeScript 配置
└── package.json                       # Node 依赖
```

---

## 4. 架构设计

### 4.1 核心架构决策：计时器在 Rust 后端运行

**为什么不在前端用 `setInterval`？**

当用户关闭弹窗（popup）时，WebView 会被隐藏，JavaScript 执行可能被暂停。这会导致计时器停止。因此所有定时逻辑必须在 Rust 后台线程中运行，前端仅作为**响应式展示层**。

```
                    ┌──────────────────────┐
                    │   Rust Backend       │
                    │                      │
 用户点击 Start ──► │  start_timer 命令    │
                    │       │              │
                    │  Background Thread   │── 每秒 tick ──► emit("timer-tick")
                    │  (独立线程)           │                  │
                    │                      │              emit("timer-complete")
                    │                      │              emit("check-in")
                    │                      │              emit("reminder-triggered")
                    └──────────────────────┘
                                │
                    Tauri Event Bus (跨线程)
                                │
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │                      │
                    │  useTimer() hook     │── listen("timer-tick") ──► 更新 UI
                    │  useReminders() hook │── listen("reminder-triggered")
                    │                      │
                    │  CircularProgress    │── SVG 动画渲染
                    └──────────────────────┘
```

### 4.2 状态所有权

| 状态 | 归属 | 持久化 | 说明 |
|------|------|--------|------|
| 计时器 (remaining_secs, phase, ...) | Rust `InnerState` | 无 | 重启后重置为 Idle |
| 当前任务名 | Rust `InnerState` | 无 | 仅用于检查通知 |
| 任务队列 | React `useTasks` | plugin-store (`app-store.json`) | 持久化保存 |
| 设置 (时长/间隔/声音) | React `SettingsPanel` | plugin-store (`app-store.json`) | 持久化保存 |
| 提醒列表 | Rust `InnerState` | 无 | 触发后自动删除 |

### 4.3 后台线程工作流

`background.rs` 启动一个独立线程，每秒执行一次循环：

```
loop {
    sleep(1s)
    lock(state)
    │
    ├─ 计时器运行中？
    │   ├─ remaining > 0 ?
    │   │   ├─ remaining -= 1
    │   │   ├─ 检查 check-in 间隔是否到达 → emit("check-in")
    │   │   └─ emit("timer-tick") + 更新托盘标题
    │   │
    │   └─ remaining == 0 ? (计时结束)
    │       ├─ Focus 结束 → 自动启动 Break
    │       └─ Break 结束 → 回到 Idle
    │
    ├─ 检查提醒列表
    │   └─ now >= trigger_at → emit("reminder-triggered")
    │
    drop(lock)
}
```

**关键设计**：在 `lock()` 内收集所有待发出的动作，释放锁后再 emit，避免死锁。

### 4.4 托盘图标交互

```
用户左键点击托盘图标
    │
    ├─ 弹窗可见？→ 隐藏弹窗
    │
    └─ 弹窗隐藏？→ 定位到托盘正下方 → 显示 → 聚焦

用户右键点击托盘图标
    │
    └─ 弹出上下文菜单
        ├─ 开始专注 / 暂停 / 继续 / 停止
        ├─ 快速提醒 (5/10/30 分钟)
        └─ 退出

弹窗失焦 (点击面板外)
    │
    └─ 自动隐藏弹窗
```

- 使用 `tauri-plugin-positioner` 的 `Position::TrayCenter` 确保弹窗出现在托盘图标正下方。
- 右键菜单项通过 `MenuItem::set_enabled()` 在后台线程中动态更新状态。
- 失焦隐藏通过 `popup.on_window_event(WindowEvent::Focused(false))` 实现。

### 4.5 数据流：启动专注会话

```
[用户] 点击 "Start Focus"
  │
  ▼
TimerControls.tsx  →  timer.startFocus()
  │
  ▼
useTimer hook      →  tauriApi.startTimer(1500, "focus")
  │
  ▼
Rust start_timer   →  设置 InnerState { phase: Focus, remaining: 1500 }
  │
  ▼
Background Thread  →  每秒 emit("timer-tick", { remaining_secs, ... })
  │
  ▼
useTimer hook      →  listen("timer-tick") → setTimerState(payload)
  │
  ▼
CircularProgress   →  SVG stroke-dashoffset 动画更新
TimerView          →  MM:SS 文本更新
托盘图标            →  标题显示 "25:00" → "24:59" → ...
```

---

## 5. Tauri 命令清单

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `start_timer` | `duration_secs: u64, phase: TimerPhase` | `TimerStateResponse` | 启动计时器 |
| `pause_timer` | — | `TimerStateResponse` | 暂停 |
| `resume_timer` | — | `TimerStateResponse` | 恢复 |
| `stop_timer` | — | `TimerStateResponse` | 停止并重置 |
| `get_timer_state` | — | `TimerStateResponse` | 查询当前状态 |
| `update_settings` | `focus/break/checkin/audio` | `TimerStateResponse` | 更新设置 |
| `set_current_task` | `task_name: Option<String>` | `()` | 设置当前任务名 |
| `get_current_task` | — | `Option<String>` | 获取当前任务名 |
| `add_reminder` | `text: String, trigger_in_secs: u64, recur_interval_secs: Option<u64>` | `Reminder` | 添加提醒（支持周期提醒） |
| `list_reminders` | — | `Vec<Reminder>` | 列出未触发提醒 |
| `delete_reminder` | `id: String` | `()` | 删除提醒 |

---

## 6. Tauri 事件清单

| 事件名 | Payload | 触发时机 |
|--------|---------|---------|
| `timer-tick` | `TimerStateResponse` | 计时器每秒 tick |
| `timer-complete` | `TimerPhase` | 专注/休息阶段结束 |
| `check-in` | `Option<String>` | 检查间隔到达（含当前任务名） |
| `reminder-triggered` | `{ id, text }` | 提醒时间到达 |
| `reminders-changed` | `()` | 提醒列表变更（右键添加后通知前端刷新） |

---

## 7. 安全模型

Tauri 2.x 采用 **capabilities** 权限模型。所有权限在 `src-tauri/capabilities/default.json` 中显式声明：

- **最小权限原则**：仅声明应用实际需要的权限
- **窗口隔离**：权限仅应用于 `popup` 窗口
- **CSP**：`default-src 'self'; style-src 'self' 'unsafe-inline'`，禁止加载外部资源

---

## 8. 构建产物

| 命令 | 产物路径 |
|------|---------|
| `npm run tauri dev` | 开发模式，Vite HMR + Rust 热重载 |
| `npm run tauri build` | `src-tauri/target/release/bundle/macos/Focus.app` |
| `npm run tauri build` | `src-tauri/target/release/bundle/dmg/Focus_0.1.0_aarch64.dmg` |

---

## 9. 已知限制

| 限制 | 说明 | 计划 |
|------|------|------|
| DMG 签名 | 未配置 Apple Developer 签名，DMM 打包可能失败 | 需要 Apple Developer ID |
| 应用重启丢失计时器状态 | 计时器状态不持久化 | 可接受，重启后重新开始 |
| 无声音提醒 | 未集成音频播放 | 可通过 `tauri-plugin-notification` 原生通知声音 |
| 提醒不持久化 | 应用重启后提醒丢失 | 可添加 store 持久化 |
| 无网站/应用屏蔽 | 未实现干扰源屏蔽 | 可通过 macOS Screen Time API 或网络层实现 |
