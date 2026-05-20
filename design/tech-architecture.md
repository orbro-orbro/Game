# 技术架构设计文档

> 平台：Web | 语言：JavaScript | 渲染：Canvas 2D | 目标：纯线性 2D 平台跳跃

---

## 1. 平台与运行环境

| 项目 | 你的选择 | 备注 |
|------|----------|------|
| 运行环境 | 浏览器（Web） | 无需安装，URL 即玩 |
| 语言 | JavaScript（Vanilla） | 零依赖，零编译 |
| 渲染 | Canvas 2D API | 像素渲染，`image-rendering: pixelated` |
| 输入 | `keydown` / `keyup` 事件 | 原生 DOM 事件 |
| 物理 | 自定义 Raycast 移动 | 帧精确，手写碰撞 |
| 关卡数据 | JS 对象（二维数组） | 每关一个 JS 文件 |
| 部署 | 静态文件服务器 | GitHub Pages / Vercel / 双击 index.html |
| 目标帧率 | 60fps | `requestAnimationFrame` |

---

## 2. 项目目录结构

```
game/
├── index.html              # 入口：Canvas 元素 + 加载所有 JS
├── css/
│   └── style.css           # 居中 Canvas，深色背景，像素渲染
├── js/
│   ├── config.js           # 全部参数常量（CONFIG 对象）
│   ├── input.js            # InputManager（键盘 + Buffer + Coyote）
│   ├── physics.js          # PhysicsIntegrator（Raycast 碰撞 + 速度积分）
│   ├── player.js           # PlayerController（状态机 + 子模块）
│   ├── objects.js          # GreenCrystal / MovingPlatform / CrumblingPlatform / Spike
│   ├── collectibles.js     # CollectibleManager + RedDot
│   ├── ui.js               # StaminaBar / DeathOverlay / CollectibleCounter
│   ├── level.js            # LevelManager（房间管理 + 复活 + 关卡加载）
│   ├── camera.js           # CameraAnchor（固定镜头，房间瞬切）
│   └── main.js             # 游戏入口 + gameLoop（requestAnimationFrame）
├── levels/
│   ├── level_01.js         # 草原（教学关）15 间
│   ├── level_02.js         # 森林
│   ├── ...
│   └── level_08.js         # 虚空
├── art/                    # 像素 sprite（如果不代码绘制）
└── design/                 # 设计文档（不参与运行）
    ├── core-mechanics.md
    ├── tech-architecture.md
    ├── level-design-grammar.md
    └── project-plan.md
```

### 2.1 各目录职责

| 路径 | 职责 | 加载时机 |
|------|------|----------|
| `index.html` | Canvas 入口，按顺序 `<script>` 加载所有 JS | 浏览器打开 |
| `css/style.css` | 页面布局 + Canvas 像素渲染模式 | 页面加载 |
| `js/config.js` | 全部参数常量（CONFIG 对象），唯一调参入口 | 最先加载 |
| `js/input.js` | 键盘事件 → 抽象动作 + Buffer/Coyote Timer | 每帧 input.update() |
| `js/physics.js` | Raycast 碰撞检测 + 位置修正 | 每帧 physics.resolve() |
| `js/player.js` | 5 状态状态机 + Ground/Jump/Dash/WallGrab 子模块 | 每帧 player.update() |
| `js/objects.js` | 动态物体逻辑（水晶/平台/尖刺） | 每帧 objects.update() |
| `js/collectibles.js` | 红点收集 + 跨房间持久 + 死亡回退 | 收集/死亡事件触发 |
| `js/ui.js` | HUD：耐力条 + 死亡过渡 + 红点计数 | 每帧 UI.draw() |
| `js/level.js` | 关卡加载 + 房间切换 + 复活 + 碰撞网格提供 | 场景切换事件 |
| `js/camera.js` | 世界坐标→屏幕坐标偏移 | 每帧 camera.update() |
| `js/main.js` | 初始化 + requestAnimationFrame 主循环 | 最后执行 |
| `levels/level_XX.js` | 每关 15 间房间数据（tiles + spikes + dots + entry/exit） | LevelManager 加载关卡时 |
| `art/` | 美术资源（如不使用代码绘制） | 预加载 |

### 2.2 config.js 参数结构

```js
const CONFIG = {
  player: { width, height, color },
  screen: { width, height, tileSize },
  ground: { maxSpeed, acceleration, friction, turnSpeed },
  jump: { height, apexFrames, shortJumpRatio, coyoteFrames, bufferFrames },
  dash: { distance, durationFrames, endlagFrames, charges, directions, curve },
  wallGrab: { maxSeconds, wallJumpHeight, wallJumpWidth, wallJumpAngle, slideSpeed, canRegrabSame },
  death: { respawnDelay },
  level: { roomsPerLevel, targetMinutes },
};
```

> 所有参数来自 `design/core-mechanics.md`。这是唯一的调参入口——改一个值，刷新浏览器即生效。

---

## 3. 核心模块划分

```
┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  input.js    │───▶│  player.js   │───▶│ physics.js  │
│  (缓冲/映射)  │    │  (状态机)     │    │  (碰撞/速度) │
└──────────────┘    └──────┬───────┘    └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                   ▼
   ┌──────────┐     ┌──────────┐      ┌──────────┐
   │WallGrab  │     │  Dash    │      │  Jump    │
   │(player中) │     │  (player中)│     │  (player中)│
   └──────────┘     └──────────┘      └──────────┘
```

| 模块 | 文件 | 职责 |
|------|------|------|
| **InputManager** | `input.js` | 键盘事件→抽象动作，维护 Jump Buffer (5f) 和 Coyote Timer (5f) |
| **PlayerController** | `player.js` | 5 状态状态机，调度子模块（Ground/Jump/Dash/WallGrab） |
| **PhysicsIntegrator** | `physics.js` | Raycast 四向碰撞检测 + 速度积分 + 位置修正 |
| **LevelManager** | `level.js` | 加载关卡数据、房间切换、死亡复活 |
| **Objects** | `objects.js` | 动态物体：水晶（恢复冲刺）、移动平台、碎落平台、尖刺 |
| **CollectibleManager** | `collectibles.js` | 红点收集状态、跨房间持久、死亡丢失本间红点 |
| **CameraAnchor** | `camera.js` | 固定镜头、房间瞬切 |
| **UI** | `ui.js` | 耐力条、死亡过渡 (800ms)、红点计数 |

---

## 4. 玩家状态机

```
                    ┌─────────┐
          ┌────────│  Dead   │◀─────────────── 触碰致死物
          │        └─────────┘
          │             │ 复活 (800ms 后)
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
| Grounded | 移动、跳跃、冲刺 | 起跳 / 冲刺 / 离开平台 |
| Airborne | 移动 (90%)、冲刺 (未使用)、跳跃 (若落地前缓冲) | 落地 / 冲刺 / 碰墙 |
| Dashing | 不可操作 | 8 帧结束 → Airborne |
| WallGrab | 滑墙、弹墙跳、冲刺 (未使用) | 耐力耗尽 / 弹墙跳 / 冲刺 / 松键 |
| Dead | 不可操作 | 800ms → 复活 |

---

## 5. 物理方案

选定方案：**自定义 Raycast 移动**

Canvas 下没有物理引擎，直接手写：

| 组件 | 实现 |
|------|------|
| 水平碰撞 | 角色左右边缘各发一条水平射线，检测 tile 碰撞 |
| 垂直碰撞 | 角色下边缘发垂直射线（地面检测），上边缘发垂直射线（天花板检测） |
| 单向平台 | 仅当角色 `vy >= 0`（向下）且脚底穿过平台表面时触发碰撞 |
| 位置修正 | 碰撞后推离到最近非穿透位置 |
| 尖刺检测 | 角色包围盒与尖刺区域重叠 → 死亡 |
| 深渊检测 | 角色 y 坐标超出屏幕底部 → 死亡 |

> 与之前 Unity 方案 B 逻辑完全一致，只是从 C# Raycast 换成 JS 手写网格检测。

---

## 6. 关卡数据方案

> 核心约束：固定镜头（一屏一房间），纯线性推进，房间级重生。

### 6.1 房间架构

每关一个 JS 文件，输出长度为 15 的数组：

```js
// levels/level_01.js — 示例结构
const LEVEL_01 = [
  { // 房间 0
    tiles: [
      // 二维数组，0=空, 1=实心砖, 2=单向平台, 3=冰面
    ],
    spikes: [
      { x: 100, y: 220, w: 32, h: 8 },  // 地面尖刺
    ],
    dots: [
      { x: 160, y: 100 },                 // 红点
    ],
    crystals: [
      { x: 200, y: 150 },                 // 绿色水晶
    ],
    movingPlatforms: [
      { x: 80, y: 180, path: [{x:80,y:180}, {x:200,y:180}], speed: 1.5 },
    ],
    crumblingPlatforms: [
      { x: 120, y: 200, delay: 0.3, respawn: 3.0 },
    ],
    entry: { x: 20, y: 200 },             // 玩家出生点
    exit:  { x: 300, y: 200 },            // 房间出口 Trigger
  },
  { // 房间 1
    // ...
  },
  // ...共 15 间
];
```

### 6.2 房间切换

```
玩家触碰 exit 区域
  → LevelManager.currentRoom++
  → player 瞬移到新房间 entry 坐标
  → camera 瞬切（偏移到新房间在关卡中的位置）
  → 重置本房间状态（碎落平台、红点）
```

### 6.3 复活逻辑

```
死亡
  → 800ms deathOverlay
  → player 瞬移回 currentRoom.entry
  → 丢失本房间内已收集的红点
  → 冲刺次数重置
```

### 6.4 屏幕与 Tile 规格

| 参数 | 值 | 备注 |
|------|-----|------|
| 屏幕分辨率 | 320 × 240 px | 经典像素游戏分辨率 |
| Tile 尺寸 | 16 × 16 px | 20×15 格 = 一屏 |
| 主角大小 | 10 × 10 px | 橙色圆点，略小于 1 tile |

---

## 7. 主循环：一帧内发生了什么

```
function gameLoop(timestamp) {

  1. input.poll()
     ├─ 读取当前按键状态
     ├─ 更新 jumpBuffer（记录按键时机，5f 有效期）
     └─ 更新 coyoteTimer（记录离地时机，5f 有效期）

  2. player.update()
     ├─ 从 input 读取抽象动作
     ├─ 状态转换判断
     ├─ 调用当前状态的子模块（Ground/Jump/Dash/WallGrab）
     └─ 输出目标速度 (vx, vy)

  3. physics.resolve()
     ├─ 根据 vx, vy 步进位置
     ├─ 检测 tile 碰撞（四向射线）
     ├─ 推离重叠
     ├─ 检测尖刺/深渊 → 触发死亡
     └─ 更新最终位置

  4. objects.update()
     ├─ movingPlatforms：沿路径移动
     └─ crumblingPlatforms：计时碎裂/重生

  5. level.checkTriggers()
     ├─ 检测 exit 触碰 → 房间+1
     └─ 检测 death → 复活

  6. camera.update()
     └─ 计算当前房间的屏幕偏移

  7. render()
     ├─ 清屏
     ├─ 画 tile 背景
     ├─ 画 objects（水晶/平台/尖刺）
     ├─ 画 dots（红点）
     ├─ 画 player（橙色圆点）
     └─ 画 UI（耐力条/计数/死亡遮罩）

  8. requestAnimationFrame(gameLoop)
}
```

---

## 8. 已确定的架构决策

| # | 决策 | 结论 |
|---|------|------|
| 1 | 平台 | Web 浏览器 |
| 2 | 语言 | JavaScript (Vanilla) |
| 3 | 渲染 | Canvas 2D (`image-rendering: pixelated`) |
| 4 | 输入 | DOM keydown/keyup 事件 |
| 5 | 物理 | 自定义 Raycast 网格碰撞 |
| 6 | 关卡数据 | JS 对象（二维数组），每关一个文件 |
| 7 | 房间架构 | 一关 15 间数组，Trigger 检测切换 |
| 8 | 帧率 | 60fps（requestAnimationFrame） |
| 9 | 依赖 | 零外部依赖，无 npm/webpack/build 步骤 |
