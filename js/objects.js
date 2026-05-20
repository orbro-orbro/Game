// ============================================
// 交互物体 — GreenCrystal / MovingPlatform / CrumblingPlatform / Spike
// ============================================

(() => {
  const rectsOverlap = (ax, ay, aw, ah, rect) => {
    return (
      ax < rect.x + rect.w &&
      ax + aw > rect.x &&
      ay < rect.y + rect.h &&
      ay + ah > rect.y
    );
  };

  const isStandingOn = (player, rect) => {
    const playerBottom = player.y + player.height;
    const nearTop = Math.abs(playerBottom - rect.y) <= 1;
    const overlapX = player.x + player.width > rect.x && player.x < rect.x + rect.w;
    return nearTop && overlapX && player.vy >= 0;
  };

  class GreenCrystal {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 10;
      this.h = 10;
      this.active = true;
    }

    reset() {
      this.active = true;
    }

    checkCollect(player) {
      if (!this.active) return false;
      if (rectsOverlap(player.x, player.y, player.width, player.height, this)) {
        this.active = false;
        return true;
      }
      return false;
    }

    draw(ctx) {
      if (!this.active) return;
      ctx.fillStyle = '#1EDC6C';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  class MovingPlatform {
    constructor(x, y, path, speed) {
      this.x = x;
      this.y = y;
      this.w = 32;
      this.h = 8;
      this.path = path && path.length > 0 ? path : [{ x, y }];
      this.speed = speed || 1;
      this.targetIndex = 1 % this.path.length;
      this.forward = true;
      this.delta = { x: 0, y: 0 };
    }

    update() {
      this.delta = { x: 0, y: 0 };
      if (this.path.length < 2) return this.delta;

      const target = this.path[this.targetIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= this.speed) {
        this.delta = { x: dx, y: dy };
        this.x = target.x;
        this.y = target.y;
        if (this.forward) {
          this.targetIndex += 1;
          if (this.targetIndex >= this.path.length) {
            this.targetIndex = this.path.length - 2;
            this.forward = false;
          }
        } else {
          this.targetIndex -= 1;
          if (this.targetIndex < 0) {
            this.targetIndex = 1;
            this.forward = true;
          }
        }
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        const stepX = nx * this.speed;
        const stepY = ny * this.speed;
        this.x += stepX;
        this.y += stepY;
        this.delta = { x: stepX, y: stepY };
      }

      return this.delta;
    }

    draw(ctx) {
      ctx.fillStyle = '#8A8A8A';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  class CrumblingPlatform {
    constructor(x, y, delaySeconds, respawnSeconds) {
      this.x = x;
      this.y = y;
      this.w = 32;
      this.h = 8;
      this.delayFrames = Math.max(1, Math.round(delaySeconds * 60));
      this.respawnFrames = Math.max(1, Math.round(respawnSeconds * 60));
      this.state = 'stable';
      this.timer = 0;
    }

    update(player) {
      if (this.state === 'stable') {
        if (isStandingOn(player, this)) {
          this.state = 'crumbling';
          this.timer = this.delayFrames;
        }
      } else if (this.state === 'crumbling') {
        this.timer -= 1;
        if (this.timer <= 0) {
          this.state = 'gone';
          this.timer = this.respawnFrames;
        }
      } else if (this.state === 'gone') {
        this.timer -= 1;
        if (this.timer <= 0) {
          this.state = 'stable';
        }
      }
    }

    isActive() {
      return this.state !== 'gone';
    }

    draw(ctx) {
      if (!this.isActive()) return;
      ctx.fillStyle = this.state === 'crumbling' ? '#D1A36A' : '#C7A46B';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  class ObjectsManager {
    constructor() {
      this.crystals = [];
      this.movingPlatforms = [];
      this.crumblingPlatforms = [];
      this.platformDeltas = new Map();
    }

    loadRoom(roomData) {
      this.crystals = (roomData.crystals || []).map(
        (c) => new GreenCrystal(c.x, c.y)
      );
      this.movingPlatforms = (roomData.movingPlatforms || []).map(
        (p) => new MovingPlatform(p.x, p.y, p.path, p.speed)
      );
      this.crumblingPlatforms = (roomData.crumblingPlatforms || []).map(
        (p) => new CrumblingPlatform(p.x, p.y, p.delay, p.respawn)
      );
      this.platformDeltas = new Map();
    }

    preUpdate() {
      this.platformDeltas.clear();
      for (const platform of this.movingPlatforms) {
        const delta = platform.update();
        this.platformDeltas.set(platform, delta);
      }
    }

    postUpdate(player) {
      for (const platform of this.movingPlatforms) {
        const delta = this.platformDeltas.get(platform);
        if (delta && (delta.x !== 0 || delta.y !== 0) && isStandingOn(player, platform)) {
          player.x += delta.x;
          player.y += delta.y;
        }
      }

      for (const platform of this.crumblingPlatforms) {
        platform.update(player);
      }

      for (const crystal of this.crystals) {
        if (crystal.checkCollect(player)) {
          player.restoreDash();
        }
      }
    }

    getSolidRects() {
      const solids = [];
      for (const platform of this.movingPlatforms) {
        solids.push(platform);
      }
      for (const platform of this.crumblingPlatforms) {
        if (platform.isActive()) solids.push(platform);
      }
      return solids;
    }

    draw(ctx) {
      for (const platform of this.movingPlatforms) {
        platform.draw(ctx);
      }
      for (const platform of this.crumblingPlatforms) {
        platform.draw(ctx);
      }
      for (const crystal of this.crystals) {
        crystal.draw(ctx);
      }
    }
  }

  window.ObjectsManager = ObjectsManager;
})();
