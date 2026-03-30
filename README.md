<div align="center">

# Focus

**ADHD 专注助手 · macOS 菜单栏工具**

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![macOS](https://img.shields.io/badge/platform-macOS%2012%2B-black?logo=apple)](https://github.com)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-blue?logo=tauri)](https://tauri.app)
[![React 18](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-stable-orange?logo=rust)](https://www.rust-lang.org)

[English](#english) · [功能特色](#功能特色) · [安装](#安装) · [从源码构建](#从源码构建) · [使用文档](docs/USER_GUIDE.md) · [架构文档](docs/ARCHITECTURE.md)

</div>

---

## 你是不是也这样？

AI 时代，每个人都在同时做很多事——让 AI 写代码、查资料、生成方案、回消息……看似效率爆表，实际上：

- **主线任务经常丢失** — 开着三个 AI 窗口，聊着两个群，写着一份文档，最后发现主线任务一点没推进
- **思绪不停漂移** — 本来在写报告，突然想到去查个数据，查着查着又打开了别的页面
- **不知道时间花哪了** — 沉浸在 AI 对话中，一抬头两小时过去了
- **任务越积越多，越积越不想做** — 待办列表越来越长，看着就焦虑

如果你有这些感受，**不是你的问题，是工具的问题**。

Focus 用**外部结构代替意志力**，帮你把注意力锁定在当前最重要的一件事上。

---

## 功能特色

### 只看一个任务

不是又一个大而全的待办清单。Focus **故意只显示一个任务**。每次只有一个选择：**做完，还是跳过？** 减少决策负担，对抗任务瘫痪。

### 「你还在做主线任务吗？」

专注期间定时弹出通知，一句话把你拽回来。专门针对思绪漂移——你以为自己还在专注，其实大脑早就飘走了。

### 番茄钟

25 分钟专注 + 5 分钟休息，圆环倒计时直观感受时间流逝。托盘图标实时显示剩余时间。

### 周期提醒

每 15/30/60 分钟提醒喝水、站起来活动，防止过度专注忽略身体需求。

### 菜单栏快捷操作

右键托盘图标即可：开始专注 / 暂停 / 继续 / 停止 / 快速添加提醒，不用打开面板。

### 轻量安静

没有社交功能、没有统计报表、没有成就系统。常驻菜单栏，点击外部自动收起，专注运行时不打扰。

---

## 截图

> TODO: 添加应用截图

---

## 安装

1. 从 [Releases](../../releases) 下载最新 `Focus_x.x.x_universal.dmg`
2. 双击打开 DMG，将 **Focus** 拖入 Applications 文件夹
3. 首次打开如提示"无法验证开发者"：**系统设置 → 隐私与安全性 → 仍然允许**
4. 或终端执行：`xattr -cr /Applications/Focus.app`

支持 Apple Silicon (M1/M2/M3/M4) 和 Intel Mac。

---

## 从源码构建

**前置条件**：

- macOS 12+
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) 工具链 (stable)

```bash
git clone https://github.com/felix-thinkingdata/adhd-helper.git
cd adhd-helper
npm install
npm run tauri dev      # 开发模式
npm run tauri build    # 生产构建 → src-tauri/target/release/bundle/dmg/
```

构建 Universal Binary（同时支持 Intel + Apple Silicon）：

```bash
npm run tauri build -- --target universal-apple-darwin
```

---

## 基本操作

| 操作 | 说明 |
|------|------|
| 左键点击托盘图标 | 打开 / 关闭操作面板 |
| 右键点击托盘图标 | 快捷菜单（开始专注、提醒、退出） |
| 点击面板外区域 | 自动收起面板 |
| 关闭面板后 | 计时器、提醒在后台继续运行 |

详细使用说明请参阅 [使用手册](docs/USER_GUIDE.md)。

---

## 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 18 + TypeScript | 响应式 UI，仅作展示层 |
| 构建 | Vite 5 | 快速 HMR + 生产构建 |
| 后端 | Tauri 2.x (Rust) | 计时器、提醒、通知在后端线程运行 |
| 插件 | tauri-plugin-store / notification / positioner | 持久化、系统通知、窗口定位 |

计时器核心逻辑运行在 Rust 后台线程，即使面板关闭也不会停止。

技术细节请参阅 [架构文档](docs/ARCHITECTURE.md)。

---

## 项目结构

```
adhd-helper/
├── src/                    # React 前端
│   ├── components/         # UI 组件 (Timer / Tasks / Reminders / Settings)
│   ├── hooks/              # 自定义 Hook (useTimer / useTasks / useReminders)
│   ├── lib/                # Tauri API 封装、存储、通知
│   └── styles/             # 暗色主题 CSS
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs         # 入口：托盘、插件、命令注册
│   │   ├── state.rs        # 应用状态 (计时器、提醒、设置)
│   │   ├── background.rs   # 后台线程 (tick、检查、通知)
│   │   └── commands/       # Tauri 命令 (timer / tasks / reminders)
│   └── tauri.conf.json     # Tauri 配置
└── docs/                   # 文档
```

---

## 适用人群

- 有 ADHD 倾向或确诊的人
- 在 AI/Vibecoding 时代容易同时做太多事的人
- 经常忘记喝水、站起来活动的程序员
- 待办清单很长但总是不知从何下手的人

---

## Roadmap

- [ ] 键盘快捷键支持
- [ ] 应用内声音提醒
- [ ] 提醒数据持久化（重启不丢失）
- [ ] 专注统计（每日/每周专注时长）
- [ ] 国际化（英文 / 中文）
- [ ] 自动启动（Login Item）

---

## License

Copyright (c) 2025 Focus Contributors

本作品采用 [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。

-你可以自由分享和修改本作品，但**不得用于商业用途**，且衍生作品必须采用相同许可协议。+

---

<div align="center">

如果这个工具帮到了你，欢迎给个 Star ⭐

</div>
