// ============================================
// CollectibleManager + RedDot — 红点收集系统
// ============================================

(() => {
  class CollectibleManager {
    constructor() {
      this.roomDots = [];
      this.collected = new Set();
      this.roomCollected = new Map();
      this.totalDots = 0;
    }

    loadRooms(rooms) {
      this.roomDots = rooms.map((room) => room.dots || []);
      this.collected.clear();
      this.roomCollected.clear();
      this.totalDots = this.roomDots.reduce((sum, dots) => sum + dots.length, 0);
    }

    _key(roomIndex, dotIndex) {
      return `${roomIndex}-${dotIndex}`;
    }

    isCollected(roomIndex, dotIndex) {
      return this.collected.has(this._key(roomIndex, dotIndex));
    }

    collect(roomIndex, dotIndex) {
      const key = this._key(roomIndex, dotIndex);
      if (this.collected.has(key)) return;
      this.collected.add(key);
      if (!this.roomCollected.has(roomIndex)) {
        this.roomCollected.set(roomIndex, new Set());
      }
      this.roomCollected.get(roomIndex).add(key);
    }

    onRoomDeath(roomIndex) {
      const roomSet = this.roomCollected.get(roomIndex);
      if (!roomSet) return;
      for (const key of roomSet) {
        this.collected.delete(key);
      }
      roomSet.clear();
    }

    getCount() {
      return this.collected.size;
    }

    getRoomCount(roomIndex) {
      const roomSet = this.roomCollected.get(roomIndex);
      return roomSet ? roomSet.size : 0;
    }

    isPerfect() {
      return this.collected.size === this.totalDots;
    }

    update(player, roomIndex) {
      const dots = this.roomDots[roomIndex] || [];
      for (let i = 0; i < dots.length; i += 1) {
        if (this.isCollected(roomIndex, i)) continue;
        const dot = dots[i];
        const radius = 4;
        const dotRect = { x: dot.x - radius, y: dot.y - radius, w: radius * 2, h: radius * 2 };
        const overlap =
          player.x < dotRect.x + dotRect.w &&
          player.x + player.width > dotRect.x &&
          player.y < dotRect.y + dotRect.h &&
          player.y + player.height > dotRect.y;
        if (overlap) {
          this.collect(roomIndex, i);
        }
      }
    }

    draw(ctx, roomIndex) {
      const dots = this.roomDots[roomIndex] || [];
      ctx.fillStyle = '#FF2E63';
      for (let i = 0; i < dots.length; i += 1) {
        if (this.isCollected(roomIndex, i)) continue;
        const dot = dots[i];
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  window.CollectibleManager = CollectibleManager;
})();
