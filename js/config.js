// ============================================
// 全部游戏参数（来自 design/core-mechanics.md）
// 单位：px = 像素, f = 帧 @60fps
// ============================================

const CONFIG = {
  // ---- 主角尺寸 ----
  player: {
    width: 10,
    height: 10,
    color: '#FF8800',
  },

  // ---- 屏幕 ----
  screen: {
    width: 320,
    height: 240,
    tileSize: 16,
    scale: 5,
    platformThickness: 6,
  },

  // ---- 地面移动 ----
  ground: {
    maxSpeed: 1.5,        // px/f
    acceleration: 0.2,    // px/f²
    friction: 0.15,       // px/f²
    turnSpeed: 0.25,      // px/f²（瞬时转向）
  },

  // ---- 跳跃 ----
  jump: {
    height: 120,          // px（8×主角高度）【临时翻倍测试二段跳】
    apexFrames: 16,       // 到顶点帧数
    shortJumpRatio: 0.7,  // 短按到达全高70%
    landingRetain: 0.3,   // 落地惯性保留比例
    coyoteFrames: 5,      // 离地后宽恕帧
    bufferFrames: 5,      // 落地前缓冲帧
    airJumps: 1,          // 空中跳跃次数（1 = 二段跳）
    fallGravityRatio: 0.6, // 下落重力倍率（小于1更慢）
  },

  // ---- 冲刺 ----
  dash: {
    distance: 40,         // px（4×主角宽度）
    durationFrames: 8,    // 冲刺持续帧
    endlagFrames: 4,      // 后摇帧
    charges: 1,           // 每段跳跃冲刺次数
    bufferFrames: 5,      // 冲刺缓冲帧
    directions: ['up', 'down', 'left', 'right'],
    curve: 'fast-to-slow',
  },

  // ---- 攀墙 ----
  wallGrab: {
    maxSeconds: 4,        // 耐力上限
    wallJumpHeight: 30,   // px（3×主角高度）
    wallJumpWidth: 30,    // px（3×主角宽度）
    wallJumpAngle: 45,    // 度
    slideSpeed: 2,        // px/f（滑墙）
    canRegrabSame: false, // 不可再抓同面墙
  },

  // ---- 死亡 ----
  death: {
    respawnDelay: 800,    // ms
  },

  // ---- 关卡 ----
  level: {
    roomsPerLevel: 15,
    targetMinutes: 2.5,
  },
};
