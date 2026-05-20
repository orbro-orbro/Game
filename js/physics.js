// ============================================
// PhysicsIntegrator — 自定义 Raycast 碰撞 + 速度积分
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

  class PhysicsIntegrator {
    constructor(config) {
      this.tileSize = config.screen.tileSize;
      this.screenWidth = config.screen.width;
      this.screenHeight = config.screen.height;
    }

    _isSolidTile(tile, movingDown, prevBottom, tileTop) {
      if (tile === 1 || tile === 3) return true;
      if (tile === 2) {
        return movingDown && prevBottom <= tileTop;
      }
      return false;
    }

    move(entity, vx, vy, level, extraSolids = []) {
      const width = entity.width;
      const height = entity.height;
      const tileSize = this.tileSize;
      const grid = level.getCollisionGrid();
      const rows = grid.length;
      const cols = grid[0]?.length || 0;

      let x = entity.x;
      let y = entity.y;
      let hitLeft = false;
      let hitRight = false;
      let hitTop = false;
      let hitBottom = false;

      if (vx !== 0) {
        let newX = x + vx;
        if (vx > 0) {
          let minX = newX;
          const col = Math.floor((newX + width - 1) / tileSize);
          const startRow = Math.floor(y / tileSize);
          const endRow = Math.floor((y + height - 1) / tileSize);

          if (col >= 0 && col < cols) {
            for (let row = startRow; row <= endRow; row += 1) {
              if (row < 0 || row >= rows) continue;
              const tile = grid[row][col];
              if (this._isSolidTile(tile, false, 0, 0)) {
                const tileLeft = col * tileSize;
                minX = Math.min(minX, tileLeft - width);
              }
            }
          } else if (col >= cols) {
            minX = Math.min(minX, cols * tileSize - width);
          }

          for (const rect of extraSolids) {
            if (rectsOverlap(newX, y, width, height, rect)) {
              minX = Math.min(minX, rect.x - width);
            }
          }

          if (minX !== newX) {
            newX = minX;
            vx = 0;
            hitRight = true;
          }
        } else {
          let maxX = newX;
          const col = Math.floor(newX / tileSize);
          const startRow = Math.floor(y / tileSize);
          const endRow = Math.floor((y + height - 1) / tileSize);

          if (col >= 0 && col < cols) {
            for (let row = startRow; row <= endRow; row += 1) {
              if (row < 0 || row >= rows) continue;
              const tile = grid[row][col];
              if (this._isSolidTile(tile, false, 0, 0)) {
                const tileRight = (col + 1) * tileSize;
                maxX = Math.max(maxX, tileRight);
              }
            }
          } else if (col < 0) {
            maxX = Math.max(maxX, 0);
          }

          for (const rect of extraSolids) {
            if (rectsOverlap(newX, y, width, height, rect)) {
              maxX = Math.max(maxX, rect.x + rect.w);
            }
          }

          if (maxX !== newX) {
            newX = maxX;
            vx = 0;
            hitLeft = true;
          }
        }
        x = newX;
      }

      if (vy !== 0) {
        let newY = y + vy;
        if (vy > 0) {
          let minY = newY;
          const row = Math.floor((newY + height - 1) / tileSize);
          const startCol = Math.floor(x / tileSize);
          const endCol = Math.floor((x + width - 1) / tileSize);

          if (row >= 0 && row < rows) {
            for (let col = startCol; col <= endCol; col += 1) {
              if (col < 0 || col >= cols) continue;
              const tileTop = row * tileSize;
              const tile = grid[row][col];
              const prevBottom = y + height;
              if (this._isSolidTile(tile, true, prevBottom, tileTop)) {
                minY = Math.min(minY, tileTop - height);
              }
            }
          }

          for (const rect of extraSolids) {
            if (rectsOverlap(x, newY, width, height, rect)) {
              minY = Math.min(minY, rect.y - height);
            }
          }

          if (minY !== newY) {
            newY = minY;
            vy = 0;
            hitBottom = true;
          }
        } else {
          let maxY = newY;
          const row = Math.floor(newY / tileSize);
          const startCol = Math.floor(x / tileSize);
          const endCol = Math.floor((x + width - 1) / tileSize);

          if (row >= 0 && row < rows) {
            for (let col = startCol; col <= endCol; col += 1) {
              if (col < 0 || col >= cols) continue;
              const tile = grid[row][col];
              if (this._isSolidTile(tile, false, 0, 0)) {
                const tileBottom = (row + 1) * tileSize;
                maxY = Math.max(maxY, tileBottom);
              }
            }
          } else if (row < 0) {
            maxY = Math.max(maxY, 0);
          }

          for (const rect of extraSolids) {
            if (rectsOverlap(x, newY, width, height, rect)) {
              maxY = Math.max(maxY, rect.y + rect.h);
            }
          }

          if (maxY !== newY) {
            newY = maxY;
            vy = 0;
            hitTop = true;
          }
        }
        y = newY;
      }

      return {
        x,
        y,
        vx,
        vy,
        hitTop,
        hitBottom,
        hitLeft,
        hitRight,
      };
    }

    checkSpike(entity, spikes = []) {
      for (const spike of spikes) {
        if (rectsOverlap(entity.x, entity.y, entity.width, entity.height, spike)) {
          return true;
        }
      }
      return false;
    }

    checkPit(entity, level) {
      return entity.y > level.getRoomHeight();
    }
  }

  window.PhysicsIntegrator = PhysicsIntegrator;
})();
