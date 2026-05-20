// ============================================
// Main — 游戏入口 + 游戏主循环
// ============================================

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = CONFIG.screen.width;
  canvas.height = CONFIG.screen.height;
  ctx.imageSmoothingEnabled = false;
  const resizeCanvas = () => {
    const baseWidth = CONFIG.screen.width;
    const baseHeight = CONFIG.screen.height;
    const desiredScale = CONFIG.screen.scale || 1;
    const maxScaleX = Math.floor(window.innerWidth / baseWidth);
    const maxScaleY = Math.floor(window.innerHeight / baseHeight);
    const scale = Math.max(1, Math.min(desiredScale, maxScaleX, maxScaleY));
    canvas.style.width = `${baseWidth * scale}px`;
    canvas.style.height = `${baseHeight * scale}px`;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const input = new InputManager();
  const physics = new PhysicsIntegrator(CONFIG);
  const objects = new ObjectsManager();
  const collectibles = new CollectibleManager();
  const level = new LevelManager();
  const camera = new CameraAnchor();
  const ui = new UI();
  const player = new PlayerController();

  level.load(LEVEL_01, objects, collectibles);
  player.respawn(level.getCurrentRoom().entry);

  function update() {
    input.update(player.isGrounded());
    objects.preUpdate();

    if (level.deathFramesLeft > 0) {
      level.updateDeath(player, objects);
      return;
    }

    player.update(input, level, physics, objects);
    objects.postUpdate(player);
    collectibles.update(player, level.currentRoomIndex);
    level.checkExit(player, objects, collectibles);

    const room = level.getCurrentRoom();
    if (physics.checkSpike(player, room.spikes) || physics.checkPit(player, level)) {
      level.startDeath(player, collectibles);
    }
  }

  function render() {
    ctx.clearRect(0, 0, CONFIG.screen.width, CONFIG.screen.height);
    level.drawTiles(ctx);
    level.drawSpikes(ctx);
    collectibles.draw(ctx, level.currentRoomIndex);
    objects.draw(ctx);
    player.draw(ctx);
    level.drawExit(ctx);
    ui.draw(ctx, player, level, collectibles);
  }

  function gameLoop() {
    update();
    render();
    if (level.roomChanged) {
      camera.setRoom(level.currentRoomIndex);
      level.roomChanged = false;
    }
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
