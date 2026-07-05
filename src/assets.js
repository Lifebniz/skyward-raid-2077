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
    background: {
      // 1: {
      //   base: "assets/images/backgrounds/world-01-base.png",
      //   mid: "assets/images/backgrounds/world-01-mid.png",
      //   fg: "assets/images/backgrounds/world-01-fg.png",
      // },
    },
  },
  cache: {},
  sources(value, out = []) {
    if (!value) return out;
    if (typeof value === "string") out.push(value);
    else if (typeof value === "object") for (const v of Object.values(value)) this.sources(v, out);
    return out;
  },
  load() {
    if (typeof Image === "undefined") return;
    for (const src of this.sources(this.manifest)) {
      if (!src || this.cache[src]) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      this.cache[src] = img;
    }
  },
  ready(src) {
    const img = src && this.cache[src];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  },
  player(key) { return this.ready(this.manifest.player[key]); },
  enemy(type) { return this.ready(this.manifest.enemy[type]); },
  boss(index) { return this.ready(this.manifest.boss[index]); },
  background(world, layer) {
    const bg = this.manifest.background[world];
    return this.ready(bg && bg[layer]);
  },
  draw(ctx, img, x, y, size, rotation = 0) {
    if (!img) return false;
    const scale = size / Math.max(img.naturalWidth, img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.save(); ctx.translate(x, y); if (rotation) ctx.rotate(rotation);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  },
  drawScrolling(ctx, img, scroll, alpha = 1) {
    if (!img) return false;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale, x = (W - w) / 2;
    let y0 = -(scroll % h);
    if (y0 > 0) y0 -= h;
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let y = y0; y < H; y += h) ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    return true;
  },
};
