// ============================================
// LevelManager — 房间管理 + 复活 + 关卡加载
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

  class LevelManager {
    constructor() {
      this.rooms = [];
      this.currentRoomIndex = 0;
      this.deathFramesLeft = 0;
      this.respawnFrames = Math.max(1, Math.round((CONFIG.death.respawnDelay / 1000) * 60));
      this.roomChanged = false;
    }

    load(levelData, objects, collectibles) {
      this.rooms = levelData;
      this.currentRoomIndex = 0;
      this.deathFramesLeft = 0;
      this.roomChanged = true;
      objects.loadRoom(this.getCurrentRoom());
      collectibles.loadRooms(this.rooms);
    }

    getCurrentRoom() {
      return this.rooms[this.currentRoomIndex];
    }

    getCollisionGrid() {
      return this.getCurrentRoom().tiles;
    }

    getTileAtPixel(px, py) {
      const tileSize = CONFIG.screen.tileSize;
      const col = Math.floor(px / tileSize);
      const row = Math.floor(py / tileSize);
      const grid = this.getCollisionGrid();
      if (row < 0 || row >= grid.length) return 0;
      if (col < 0 || col >= grid[0].length) return 0;
      return grid[row][col];
    }

    getRoomWidth() {
      return CONFIG.screen.width;
    }

    getRoomHeight() {
      return CONFIG.screen.height;
    }

    getExitRect() {
      const room = this.getCurrentRoom();
      return room.exit;
    }

    startDeath(player, collectibles) {
      if (this.deathFramesLeft > 0) return;
      this.deathFramesLeft = this.respawnFrames;
      collectibles.onRoomDeath(this.currentRoomIndex);
      player.onDeath();
    }

    updateDeath(player, objects) {
      if (this.deathFramesLeft <= 0) return;
      this.deathFramesLeft -= 1;
      if (this.deathFramesLeft <= 0) {
        const entry = this.getCurrentRoom().entry;
        player.respawn(entry);
        objects.loadRoom(this.getCurrentRoom());
      }
    }

    getDeathOverlayAlpha() {
      if (this.deathFramesLeft <= 0) return 0;
      const progress = 1 - this.deathFramesLeft / this.respawnFrames;
      return progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    }

    checkExit(player, objects, collectibles) {
      if (this.currentRoomIndex >= this.rooms.length - 1) return;
      const exit = this.getExitRect();
      const room = this.getCurrentRoom();
      const totalDots = (room.dots || []).length;
      const collectedDots = collectibles
        ? collectibles.getRoomCount(this.currentRoomIndex)
        : totalDots;
      if (totalDots > 0 && collectedDots < totalDots) return;
      if (rectsOverlap(player.x, player.y, player.width, player.height, exit)) {
        this.currentRoomIndex += 1;
        this.roomChanged = true;
        const entry = this.getCurrentRoom().entry;
        player.respawn(entry);
        objects.loadRoom(this.getCurrentRoom());
      }
    }

    drawTiles(ctx) {
      const tiles = this.getCollisionGrid();
      const tileSize = CONFIG.screen.tileSize;
      const floorRow = tiles.length - 1;
      const platformThickness = Math.min(CONFIG.screen.platformThickness, tileSize);
      for (let r = 0; r < tiles.length; r += 1) {
        for (let c = 0; c < tiles[r].length; c += 1) {
          const tile = tiles[r][c];
          if (tile === 0) continue;
          if (tile === 1) ctx.fillStyle = '#2C2C2C';
          if (tile === 2) ctx.fillStyle = '#6C6C6C';
          if (tile === 3) ctx.fillStyle = '#4A7FA7';
          const height = r === floorRow ? tileSize : platformThickness;
          ctx.fillRect(c * tileSize, r * tileSize, tileSize, height);
        }
      }
    }

    drawSpikes(ctx) {
      const spikes = this.getCurrentRoom().spikes || [];
      ctx.fillStyle = '#E53935';
      for (const spike of spikes) {
        ctx.fillRect(spike.x, spike.y, spike.w, spike.h);
      }
    }

    drawExit(ctx) {
      const exit = this.getExitRect();
      if (!exit) return;
      ctx.strokeStyle = '#FFD166';
      ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
    }
  }

  window.LevelManager = LevelManager;
})();
