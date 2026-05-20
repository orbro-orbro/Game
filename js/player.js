// ============================================
// PlayerController — 玩家状态机 + 子模块调度
// ============================================

(() => {
  const approach = (value, target, delta) => {
    if (value < target) return Math.min(value + delta, target);
    if (value > target) return Math.max(value - delta, target);
    return value;
  };

  class PlayerController {
    constructor() {
      this.width = CONFIG.player.width;
      this.height = CONFIG.player.height;
      this.color = CONFIG.player.color;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.facing = 1;
      this.state = 'airborne';
      this.grounded = false;
      this.dashCharges = CONFIG.dash.charges;
      this.dashTimer = 0;
      this.dashFrame = 0;
      this.dashEndlag = 0;
      this.dashDir = { x: 0, y: 0 };
      this.wallSide = null;
      this.lastWallSide = null;
      this.wallStaminaMax = Math.round(CONFIG.wallGrab.maxSeconds * 60);
      this.wallStamina = this.wallStaminaMax;
      this.airJumpsMax = CONFIG.jump.airJumps;
      this.airJumps = this.airJumpsMax;

      this.gravity = (2 * CONFIG.jump.height) / (CONFIG.jump.apexFrames * CONFIG.jump.apexFrames);
      this.jumpVelocity = -this.gravity * CONFIG.jump.apexFrames;
      this.shortJumpVelocity = this.jumpVelocity * CONFIG.jump.shortJumpRatio;
    }

    respawn(entry) {
      this.x = entry.x;
      this.y = entry.y;
      this.vx = 0;
      this.vy = 0;
      this.state = 'airborne';
      this.grounded = false;
      this.dashCharges = CONFIG.dash.charges;
      this.dashTimer = 0;
      this.dashFrame = 0;
      this.dashEndlag = 0;
      this.dashDir = { x: 0, y: 0 };
      this.wallSide = null;
      this.lastWallSide = null;
      this.wallStamina = this.wallStaminaMax;
      this.airJumps = this.airJumpsMax;
    }

    onDeath() {
      this.state = 'dead';
      this.vx = 0;
      this.vy = 0;
    }

    restoreDash() {
      this.dashCharges = CONFIG.dash.charges;
    }

    isGrounded() {
      return this.grounded;
    }

    getStaminaRatio() {
      return Math.max(0, Math.min(1, this.wallStamina / this.wallStaminaMax));
    }

    startDash(direction) {
      if (!direction) return;
      this.dashCharges -= 1;
      this.state = 'dashing';
      this.dashTimer = CONFIG.dash.durationFrames;
      this.dashFrame = 0;
      this.dashDir = direction;
      this.vx = 0;
      this.vy = 0;
      this.wallSide = null;
      this.lastWallSide = null;
    }

    startWallGrab(side) {
      if (!CONFIG.wallGrab.canRegrabSame && this.lastWallSide === side) return;
      this.state = 'wallgrab';
      this.wallSide = side;
      this.wallStamina = this.wallStaminaMax;
      this.vx = 0;
      this.vy = CONFIG.wallGrab.slideSpeed;
    }

    update(input, level, physics, objects) {
      if (this.state === 'dead') return;

      const move = input.getMoveAxis();
      const wasGrounded = this.grounded;
      if (move.x !== 0) this.facing = move.x;

      if (this.state === 'dashing') {
        const duration = CONFIG.dash.durationFrames;
        const baseSpeed = CONFIG.dash.distance / duration;
        const t = duration > 1 ? this.dashFrame / (duration - 1) : 1;
        const speedFactor = 1.4 - 0.8 * t;
        const speed = baseSpeed * speedFactor;
        this.vx = this.dashDir.x * speed;
        this.vy = this.dashDir.y * speed;
        this.dashFrame += 1;
        this.dashTimer -= 1;

        if (this.dashTimer <= 0) {
          this.state = 'airborne';
          this.dashEndlag = CONFIG.dash.endlagFrames;
        }
      } else if (this.state === 'wallgrab') {
        const holdWall =
          (this.wallSide === 'left' && input.isDown('left')) ||
          (this.wallSide === 'right' && input.isDown('right'));

        if (!holdWall) {
          this.state = 'airborne';
          this.lastWallSide = this.wallSide;
          this.wallSide = null;
        } else {
          this.wallStamina -= 1;
          if (this.wallStamina <= 0) {
            this.state = 'airborne';
            this.lastWallSide = this.wallSide;
            this.wallSide = null;
          } else {
            this.vx = 0;
            this.vy = CONFIG.wallGrab.slideSpeed;
          }

          if (input.justPressed('jump')) {
            const jumpHeight = CONFIG.wallGrab.wallJumpHeight;
            const jumpWidth = CONFIG.wallGrab.wallJumpWidth;
            const vy = -Math.sqrt(2 * this.gravity * jumpHeight);
            const timeToApex = Math.abs(vy) / this.gravity;
            const vx = (jumpWidth / timeToApex) * (this.wallSide === 'left' ? 1 : -1);
            this.vx = vx;
            this.vy = vy;
            this.state = 'airborne';
            this.lastWallSide = this.wallSide;
            this.wallSide = null;
          } else if (input.hasDashBuffered() && this.dashCharges > 0) {
            const dir = input.getDashDirection() || { x: this.facing, y: 0 };
            this.startDash(dir);
            input.consumeDashBuffer();
          }
        }
      } else {
        const grounded = this.grounded;
        const tileUnder = grounded
          ? level.getTileAtPixel(this.x + this.width / 2, this.y + this.height + 1)
          : 0;
        const friction =
          tileUnder === 3 ? CONFIG.ground.friction * 0.5 : CONFIG.ground.friction;
        const maxSpeed = grounded ? CONFIG.ground.maxSpeed : CONFIG.ground.maxSpeed * 0.9;
        const baseAccel = grounded ? CONFIG.ground.acceleration : CONFIG.ground.acceleration * 0.7;

        if (this.dashEndlag > 0) {
          this.dashEndlag -= 1;
        } else {
          if (move.x !== 0) {
            const reversing = Math.sign(this.vx) !== 0 && Math.sign(this.vx) !== Math.sign(move.x);
            const accel = reversing ? CONFIG.ground.turnSpeed : baseAccel;
            this.vx = approach(this.vx, move.x * maxSpeed, accel);
          } else if (grounded) {
            this.vx = approach(this.vx, 0, friction);
          }

          if (input.hasJumpBuffered()) {
            console.log('[JUMP] buffer active, state=' + this.state, 'grounded(local)=' + grounded, 'this.grounded=' + this.grounded, 'coyote=' + input.canCoyoteJump(), 'airJumps=' + this.airJumps, 'endlag=' + this.dashEndlag);
            if (grounded || input.canCoyoteJump()) {
              console.log('[JUMP] → ground/coyote');
              this.vy = this.jumpVelocity;
              this.state = 'airborne';
              this.grounded = false;
              input.consumeJumpBuffer();
              input.clearCoyote();
            } else if (this.state === 'airborne' && this.airJumps > 0) {
              console.log('[JUMP] → AIR JUMP !!!');
              this.vy = this.jumpVelocity;
              this.state = 'airborne';
              this.grounded = false;
              this.airJumps -= 1;
              input.consumeJumpBuffer();
              input.clearCoyote();
            } else {
              console.log('[JUMP] → BLOCKED (state=' + this.state + ', airJumps=' + this.airJumps + ')');
            }
          }

          if (input.hasDashBuffered() && this.dashCharges > 0) {
            const dir = input.getDashDirection() || { x: this.facing, y: 0 };
            this.startDash(dir);
            input.consumeDashBuffer();
          }
        }

        if (!this.grounded) {
          const gravity =
            this.vy > 0 ? this.gravity * CONFIG.jump.fallGravityRatio : this.gravity;
          this.vy += gravity;
        } else if (this.vy > 0) {
          this.vy = 0;
        }

        if (!input.isDown('jump') && this.vy < this.shortJumpVelocity) {
          this.vy = this.shortJumpVelocity;
        }
      }

      const result = physics.move(this, this.vx, this.vy, level, objects.getSolidRects());
      this.x = result.x;
      this.y = result.y;
      this.vx = result.vx;
      this.vy = result.vy;
      const groundCheck = physics.move(
        { x: this.x, y: this.y, width: this.width, height: this.height },
        0,
        1,
        level,
        objects.getSolidRects()
      );
      this.grounded = result.hitBottom || groundCheck.hitBottom;

      if (!wasGrounded && this.grounded && this.state !== 'dashing') {
        this.vx *= CONFIG.jump.landingRetain;
      }

        if (this.grounded) {
          if (this.state !== 'dashing') {
            this.state = 'grounded';
            this.dashCharges = CONFIG.dash.charges;
            this.wallStamina = this.wallStaminaMax;
            this.lastWallSide = null;
            this.airJumps = this.airJumpsMax;
          }
      } else if (this.state !== 'dashing' && this.state !== 'wallgrab') {
        this.state = 'airborne';
      }

      if (
        this.state === 'airborne' &&
        this.dashEndlag === 0 &&
        !this.grounded
      ) {
        if (result.hitLeft && input.isDown('left')) {
          this.startWallGrab('left');
        } else if (result.hitRight && input.isDown('right')) {
          this.startWallGrab('right');
        }
      }

    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  window.PlayerController = PlayerController;
})();
