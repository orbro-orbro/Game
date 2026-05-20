// ============================================
// UI — StaminaBar / DeathOverlay / CollectibleCounter
// ============================================

(() => {
  class UI {
    draw(ctx, player, level, collectibles) {
      ctx.save();
      this._drawCollectibleCounter(ctx, collectibles);
      this._drawStaminaBar(ctx, player);
      this._drawDeathOverlay(ctx, level);
      ctx.restore();
    }

    _drawStaminaBar(ctx, player) {
      if (player.state !== 'wallgrab') return;
      const ratio = player.getStaminaRatio();
      const x = 8;
      const y = 8;
      const w = 60;
      const h = 6;
      ctx.fillStyle = '#222';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#35C7A4';
      ctx.fillRect(x, y, w * ratio, h);
    }

    _drawDeathOverlay(ctx, level) {
      const alpha = level.getDeathOverlayAlpha();
      if (alpha <= 0) return;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, 0, CONFIG.screen.width, CONFIG.screen.height);
    }

    _drawCollectibleCounter(ctx, collectibles) {
      ctx.fillStyle = '#111';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      const base = `${collectibles.getCount()}/${collectibles.totalDots}`;
      const text = collectibles.isPerfect() ? `${base} ★` : base;
      ctx.fillText(text, CONFIG.screen.width - 6, 12);
    }
  }

  window.UI = UI;
})();
