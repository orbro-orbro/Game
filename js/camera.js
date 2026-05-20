// ============================================
// CameraAnchor — 固定镜头，一屏一房间
// ============================================

(() => {
  class CameraAnchor {
    constructor() {
      this.roomIndex = 0;
    }

    setRoom(roomIndex) {
      this.roomIndex = roomIndex;
    }

    getScreenPos(worldX, worldY) {
      return { x: worldX, y: worldY };
    }
  }

  window.CameraAnchor = CameraAnchor;
})();
