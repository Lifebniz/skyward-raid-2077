"use strict";

/* =====================================================================
 * 3.5) 可选图片素材
 * ===================================================================== */
const ImageAssets = {
  manifest: {
    player: {
      // balanced: "assets/images/ships/player-balanced.png",
    },
    enemy: {
      // small: "assets/images/enemies/enemy-small.png",
    },
    boss: {
      // 0: "assets/images/bosses/boss-01-guard.png",
    },
  },
  cache: {},
  load() {
    if (typeof Image === "undefined") return;
    for (const group of Object.values(this.manifest)) {
      for (const src of Object.values(group)) {
        if (!src || this.cache[src]) continue;
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        this.cache[src] = img;
      }
    }
  },
  ready(src) {
    const img = src && this.cache[src];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  },
  player(key) { return this.ready(this.manifest.player[key]); },
  enemy(type) { return this.ready(this.manifest.enemy[type]); },
  boss(index) { return this.ready(this.manifest.boss[index]); },
  draw(ctx, img, x, y, size, rotation = 0) {
    if (!img) return false;
    const scale = size / Math.max(img.naturalWidth, img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.save(); ctx.translate(x, y); if (rotation) ctx.rotate(rotation);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  },
};
