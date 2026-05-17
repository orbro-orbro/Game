# 技术架构设计文档

> 引擎：Unity | 语言：C# | 目标：纯线性 2D 平台跳跃

---

## 1. Unity 项目配置

| 项目 | 你的选择 | 备注 |
|------|----------|------|
| Unity 版本 | 【 2023 LTS】 | 建议 2022 LTS 或 2023 LTS |
| 渲染管线 | 【Built-in 】 | 2D 像素游戏 Built-in 就够 |
| 2D Renderer | 【是】 | 使用 Unity 2D 项目模板 |
| 输入系统 | 【 】 | 见下方选项 |
| 目标帧率 | 【60】fps | 所有参数已按 60fps 基准设定 |

### 1.1 输入系统选择

- 【是 】**新版 Input System**（推荐）：事件驱动，Input Buffer 好实现，支持后期改键
- 【 】**旧版 Input Manager**：简单直接，但改键和扩展性差

---

## 2. 项目目录结构

```
Assets/
├── _Game/                    # 游戏主目录
│   ├── Scenes/               # 场景文件
│   ├── Prefabs/              # 预制体
│   ├── Scripts/              # 所有 C# 脚本
│   ├── Art/                  # 美术资源（像素图、材质）
│   ├── Audio/                # 音效和音乐
│   ├── Settings/             # ScriptableObject 配置
│   └── Resources/            # 动态加载资源
├── _Levels/                  # 关卡场景（可单独文件夹管理）
└── _ThirdParty/              # 第三方插件
```

是否接受此结构？ 【是 / 否 / 修改意见】

---

## 3. 核心模块划分

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  InputMgr   │───▶│ PlayerCtrl   │───▶│  Physics    │
│  (缓冲/映射) │    │  (状态机)     │    │  (碰撞/重力) │
└─────────────┘    └──────┬───────┘    └─────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │WallGrab  │   │  Dash    │   │  Jump    │
    │Module    │   │  Module  │   │  Module  │
    └──────────┘   └──────────┘   └──────────┘
```

| 模块 | 职责 | 依赖 |
|------|------|------|
| **InputManager** | 原始输入→抽象动作，维护 Input Buffer 和 Coyote Timer | 无 |
| **PlayerController** | 玩家状态机（Grounded/Air/Dash/WallGrab/Dead），调度子模块 | InputMgr, 各子模块 |
| **JumpModule** | 跳跃物理计算、短按/长按检测、变高处理 | 仅被 PlayerCtrl 调用 |
| **DashModule** | 冲刺方向/时间/冷却/后摇管理 | 仅被 PlayerCtrl 调用 |
| **WallGrabModule** | 攀墙触发、耐力消耗、滑墙、弹墙跳 | 仅被 PlayerCtrl 调用 |
| **PhysicsIntegrator** | 自定义重力、速度积分、碰撞检测（或交给 Rigidbody2D） | PlayerCtrl |
| **LevelManager** | 房间切换、死亡复活、关卡进度 | Scene/GameObject |
| **CollectibleManager** | 红点收集状态、跨房间持久 | LevelManager |
| **CameraAnchor** | 固定在关卡中央，零移动逻辑 | 无 |

---

## 4. 玩家状态机

```
                    ┌─────────┐
          ┌────────│  Dead   │◀─────────────── 触碰致死物
          │        └─────────┘
          │             │ 复活(800ms后)
          │             ▼
          │        ┌─────────┐
          │        │ Grounded│◀────────┐
          │        └────┬────┘         │
          │      跳跃键  │             │ 落地（恢复冲刺）
          │             ▼             │
          │        ┌─────────┐  冲刺键 │
          │        │ Airborne│───┐     │
          │        └───┬──┬──┘   │     │
          │   碰墙+方向│  │冲刺  │     │
          │           ▼  ▼      ▼     │
          │   ┌──────────┐ ┌────────┐ │
          │   │WallGrab  │ │Dashing │─┤
          │   └────┬─────┘ └───┬────┘ │
          │   弹墙跳│           │      │
          │        └───────────┘      │
          └───────────────────────────┘
```

**状态说明：**

| 状态 | 可用动作 | 退出条件 |
|------|----------|----------|
| Grounded | 移动、跳跃、冲刺 | 起跳/冲刺/离开平台 |
| Airborne | 移动(90%)、冲刺(未使用)、跳跃(若落地前缓冲) | 落地/冲刺/碰墙 |
| Dashing | 不可操作 | 8帧结束→Airborne |
| WallGrab | 滑墙、弹墙跳、冲刺(未使用) | 耐力耗尽/弹墙跳/冲刺/松键 |
| Dead | 不可操作 | 800ms→复活 |

---

## 5. 物理方案选择

Unity 2D 平台跳跃的物理有两种路线：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A. 使用 Rigidbody2D + 修改速度** | 内置碰撞，省代码 | 物理系统有微延迟，输入缓冲难精确 |
| **B. 自定义 CharacterController2D**（Raycast + 手动移动） | 帧精确，完全可控 | 需手写碰撞检测 |

你的选择：【B】

> Celeste 类游戏几乎都用 B 方案——需要帧级精确控制和确定性手感。但如果你不追求极致精确，A 方案开发速度快很多。

---

## 6. 关卡数据方案

> 核心约束：固定镜头（一屏一房间），纯线性推进，房间级重生。

### 6.1 场景与房间架构

选定方案：**【一关一 Scene，房间空间分区】**

```
一个 Level Scene
├── Camera (固定，全屏大小)
├── LevelManager (管理房间状态)
├── Player (橙色小点)
└── Rooms (15 个房间节点)
    ├── Room_01 (Transform + Tilemap + Spikes + RedDots)
    │   ├── EntryPoint
    │   └── ExitTrigger → Room_02
    ├── Room_02
    │   ├── EntryPoint
    │   └── ExitTrigger → Room_03
    ├── ...
    └── Room_15
        ├── EntryPoint
        └── ExitTrigger → 过关
```

| 要点 | 设计 |
|------|------|
| 房间空间排布 | 每间间隔一个屏幕宽度+缝隙，Camera 瞬切 |
| 房间边界 | BoxCollider2D Trigger 包裹整个屏幕 |
| 退出条件 | 玩家触碰 ExitTrigger → 切到下一房间 |
| 复活逻辑 | LevelManager 记录当前房间 ID，死亡→传送回该房间 EntryPoint |

> 选此方案的理由：单 Scene 加载快（玩家无等待），房间切换纯内存操作（瞬移 Camera+Player），Unity 编辑器内同一窗口即可管理整关，无需场景加载管线。

### 6.2 关卡制作方式

- 【是】**Unity Tilemap**（内置，手动摆放）
- 【 】Tiled 编辑器 + Tiled2Unity 导入
- 【 】纯代码生成（文本矩阵）

> Tilemap 的 TilemapCollider2D 可生成碰撞形状，配合 CompositeCollider2D 合并网格，直接供给 Raycast 物理方案使用。

---

## 7. 数据流：一帧内发生了什么

```
1. InputManager.Update()
   ├─ 读取原始输入
   ├─ 更新 Jump Buffer（记录按键时机）
   └─ 更新 Coyote Timer（记录离地时机）

2. PlayerController.Update()
   ├─ 读取 InputManager 的抽象动作
   ├─ 根据当前状态和输入决定状态转换
   └─ 调用对应子模块执行

3. 子模块执行（Jump/Dash/WallGrab）
   ├─ 计算新位置和速度
   └─ 调用 PhysicsIntegrator 应用

4. PhysicsIntegrator.LateUpdate()
   ├─ 碰撞检测
   ├─ 解析碰撞（推离重叠）
   └─ 更新 Transform

5. 事件通知
   ├─ 落地 → 重置冲刺次数、Coyote Timer
   ├─ 死亡 → LevelManager.Respawn()
   ├─ 收集红点 → CollectibleManager.Collect()
```

---

## 8. 已确定的架构决策

| # | 决策 | 结论 |
|---|------|------|
| 1 | 引擎版本 | Unity 2023 LTS, Built-in RP |
| 2 | 输入系统 | 新版 Input System |
| 3 | 物理方案 | **B：自定义 Raycast 移动** |
| 4 | 关卡制作 | Unity Tilemap |
| 5 | 房间架构 | 一关一 Scene，空间分区 + Trigger 切房 |
| 6 | 帧率 | 60fps 固定 |
