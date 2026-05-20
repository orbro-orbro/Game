// ============================================
// InputManager — 键盘输入 + Jump Buffer + Coyote Timer
// ============================================

(() => {
  const ACTION_KEYS = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'KeyZ'],
    dash: ['KeyX', 'KeyC', 'ShiftLeft', 'ShiftRight'],
  };

  class InputManager {
    constructor() {
      this.keyStates = {};
      this.prevDown = { jump: false, dash: false };
      this.justPressedMap = { jump: false, dash: false };
      this.jumpBuffer = 0;
      this.dashBuffer = 0;
      this.jumpQueuedCount = 0;
      this.dashQueued = false;
      this.coyoteTimer = 0;

      window.addEventListener('keydown', (e) => {
        if (this._isTrackedKey(e.code)) e.preventDefault();
        const wasDown = this.keyStates[e.code];
        this.keyStates[e.code] = true;
        if (!wasDown) {
          if (ACTION_KEYS.jump.includes(e.code)) this.jumpQueuedCount += 1;
          if (ACTION_KEYS.dash.includes(e.code)) this.dashQueued = true;
        }
      });
      window.addEventListener('keyup', (e) => {
        if (this._isTrackedKey(e.code)) e.preventDefault();
        this.keyStates[e.code] = false;
      });
    }

    _isTrackedKey(code) {
      return Object.values(ACTION_KEYS).some((keys) => keys.includes(code));
    }

    _isDown(action) {
      const codes = ACTION_KEYS[action] || [];
      return codes.some((code) => this.keyStates[code]);
    }

    update(isGrounded) {
      const jumpDown = this._isDown('jump');
      const dashDown = this._isDown('dash');

      this.justPressedMap.jump = jumpDown && !this.prevDown.jump;
      this.justPressedMap.dash = dashDown && !this.prevDown.dash;

      if (this.justPressedMap.jump || this.jumpQueuedCount > 0) {
        this.jumpBuffer = CONFIG.jump.bufferFrames;
        if (this.justPressedMap.jump) console.log('INPUT: jump buffer set (justPressed)');
        if (this.jumpQueuedCount > 0) console.log('INPUT: jump buffer set (queued, count=' + this.jumpQueuedCount + ')');
        if (this.jumpQueuedCount > 0) this.jumpQueuedCount -= 1;
      }

      if (this.justPressedMap.dash || this.dashQueued) {
        this.dashBuffer = CONFIG.dash.bufferFrames;
        this.dashQueued = false;
      }

      if (this.jumpBuffer > 0) {
        this.jumpBuffer -= 1;
      }

      if (this.dashBuffer > 0) {
        this.dashBuffer -= 1;
      }

      if (isGrounded) {
        this.coyoteTimer = CONFIG.jump.coyoteFrames;
      } else if (this.coyoteTimer > 0) {
        this.coyoteTimer -= 1;
      }

      this.prevDown.jump = jumpDown;
      this.prevDown.dash = dashDown;
    }

    isDown(action) {
      return this._isDown(action);
    }

    justPressed(action) {
      return this.justPressedMap[action] || false;
    }

    hasJumpBuffered() {
      return this.jumpBuffer > 0;
    }

    consumeJumpBuffer() {
      this.jumpBuffer = 0;
    }

    hasDashBuffered() {
      return this.dashBuffer > 0;
    }

    consumeDashBuffer() {
      this.dashBuffer = 0;
    }

    canCoyoteJump() {
      return this.coyoteTimer > 0;
    }

    clearCoyote() {
      this.coyoteTimer = 0;
    }

    getMoveAxis() {
      const x = (this._isDown('right') ? 1 : 0) - (this._isDown('left') ? 1 : 0);
      const y = (this._isDown('down') ? 1 : 0) - (this._isDown('up') ? 1 : 0);
      return { x, y };
    }

    getDashDirection() {
      if (this._isDown('up')) return { x: 0, y: -1 };
      if (this._isDown('down')) return { x: 0, y: 1 };
      if (this._isDown('left')) return { x: -1, y: 0 };
      if (this._isDown('right')) return { x: 1, y: 0 };
      return null;
    }
  }

  window.InputManager = InputManager;
})();
