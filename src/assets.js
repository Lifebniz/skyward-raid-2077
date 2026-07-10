"use strict";

/* =====================================================================
 * 3.5) 可选图片素材
 * ===================================================================== */
const ImageAssets = {
  manifest: {
    player: {
      balanced: "assets/images/ships/player-balanced.png",
      attacker: "assets/images/ships/player-attacker.png",
      defender: "assets/images/ships/player-defender.png",
      scout: "assets/images/ships/player-scout.png",
      morph: "assets/images/ships/player-morph.png",
      "morph-cannon": "assets/images/ships/player-morph-cannon.png",   // MO:双形态机的大炮形态机身(切形态时替换普通形态图)
    },
    wingman: {
      balanced: "assets/images/ships/player-wingman-balanced.png",
      attacker: "assets/images/ships/player-wingman-attacker.png",
      defender: "assets/images/ships/player-wingman-defender.png",
      scout: "assets/images/ships/player-wingman-scout.png",
    },
    enemy: {
      small: "assets/images/enemies/enemy-small.png",
      medium: "assets/images/enemies/enemy-medium.png",
      large: "assets/images/enemies/enemy-large.png",
      gunner: "assets/images/enemies/enemy-gunner.png",
      splitter: "assets/images/enemies/enemy-splitter.png",
      sniper: "assets/images/enemies/enemy-sniper.png",
      detonator: "assets/images/enemies/enemy-detonator.png",
      phantom: "assets/images/enemies/enemy-phantom.png",
      carrier: "assets/images/enemies/enemy-carrier.png",
      shieldCarrier: "assets/images/enemies/enemy-shield-carrier.png",
      jammer: "assets/images/enemies/enemy-jammer.png",
      support: "assets/images/enemies/enemy-support.png",
      kamikaze: "assets/images/enemies/enemy-kamikaze.png",
      beacon: "assets/images/enemies/enemy-beacon.png",
      mineLayer: "assets/images/enemies/enemy-mine-layer.png",
      phaseWing: "assets/images/enemies/enemy-phase-wing.png",
      mirrorDrone: "assets/images/enemies/enemy-mirror-drone.png",
      tether: "assets/images/enemies/enemy-tether.png",
      warden: "assets/images/enemies/enemy-warden.png",
      harvester: "assets/images/enemies/enemy-harvester.png",
    },
    boss: {
      0: "assets/images/bosses/boss-01-guard.png",
      1: "assets/images/bosses/boss-02-rotorblade.png",
      2: "assets/images/bosses/boss-03-bomber.png",
      3: "assets/images/bosses/boss-04-twin-core-fortress.png",
      4: "assets/images/bosses/boss-05-sky-fortress.png",
      5: "assets/images/bosses/boss-06-abyss-king.png",
      6: "assets/images/bosses/boss-07-void-devourer.png",
      7: "assets/images/bosses/boss-08-prism-judge.png",
      8: "assets/images/bosses/boss-09-iron-carrier.png",
      9: "assets/images/bosses/boss-10-tide-core.png",
      10: "assets/images/bosses/boss-11-unstable-prototype.png",
    },
    background: {
      1: {
        base: "assets/images/backgrounds/world-01-base.png",
        mid: "assets/images/backgrounds/world-01-mid.png",
        fg: "assets/images/backgrounds/world-01-fg.png",
      },
      2: {
        base: "assets/images/backgrounds/world-02-base.png",
        mid: "assets/images/backgrounds/world-02-mid.png",
        fg: "assets/images/backgrounds/world-02-fg.png",
      },
      3: {
        base: "assets/images/backgrounds/world-03-base.png",
        mid: "assets/images/backgrounds/world-03-mid.png",
        fg: "assets/images/backgrounds/world-03-fg.png",
      },
      4: {
        base: "assets/images/backgrounds/world-04-base.png",
        mid: "assets/images/backgrounds/world-04-mid.png",
        fg: "assets/images/backgrounds/world-04-fg.png",
      },
      5: {
        base: "assets/images/backgrounds/world-05-base.png",
        mid: "assets/images/backgrounds/world-05-mid.png",
        fg: "assets/images/backgrounds/world-05-fg.png",
      },
      6: {
        base: "assets/images/backgrounds/world-06-base.png",
        mid: "assets/images/backgrounds/world-06-mid.png",
        fg: "assets/images/backgrounds/world-06-fg.png",
      },
      7: {
        base: "assets/images/backgrounds/world-07-base.png",
        mid: "assets/images/backgrounds/world-07-mid.png",
        fg: "assets/images/backgrounds/world-07-fg.png",
      },
      8: {
        base: "assets/images/backgrounds/world-08-base.png",
        mid: "assets/images/backgrounds/world-08-mid.png",
        fg: "assets/images/backgrounds/world-08-fg.png",
      },
    },
  },
  cache: {},
  decodeCache: {},
  boundsCache: {},
  preload: {
    effects: "chain-spark shield-break repair-pulse weakpoint-marker shield-hit hit-spark mine-warning-pulse mine-armed floating-mine fire-zone ice-zone powerup-glow gravity-ring warning-laser-lane".split(" "),
    uiIcons: "bomb charge-shot heal power-upgrade secondary-homing secondary-laser secondary-missile skill-fire skill-ice special-nuke special-shield special-stealth special-wave".split(" "),
    chips: "capacitor charge-core homing-swarm laser-focus missile-barrage side-guns volatile-core".split(" "),
    powerups: "bomb chip heal power wing".split(" "),
    bonuses: "damage fire-rate range max-hp reinforced-hull armor-plating field-repair repair-loop repair-pulse leech living-armor medical-reservoir pain-converter missile-rack pierce chain-spark salvage shield-amplifier shield-breaker kinetic-ammo heavy-rounds armor-piercer armor-caliber stable-fire perfect-line side-cannons laser-lens laser-splitter swarm-core homing-shards signal-filter explosive-payload cluster-warheads missile-interceptor magnet-core combo-battery combo-barrage combo-surge charge-amp executioner elite-hunter reactive-armor last-stand emergency-barrier".split(" "),
  },
  missingBonusIcons: {
    "vital-reactor": true,
    "glass-cannon": true,
    "boss-hunter": true,
    "weak-scanner": true,
    "adrenaline": true,
    "overdrive": true,
  },
  slug(key) {
    return String(key || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  },
  ensure(src) {
    if (!src || typeof Image === "undefined") return null;
    if (!this.cache[src]) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      this.cache[src] = img;
    }
    return this.cache[src];
  },
  sources(value, out = []) {
    if (!value) return out;
    if (typeof value === "string") out.push(value);
    else if (typeof value === "object") for (const v of Object.values(value)) this.sources(v, out);
    return out;
  },
  dynamicSources() {
    const srcs = [];
    const cfg = typeof CONFIG !== "undefined" ? CONFIG : null;
    const addKeys = (prefix, keys) => {
      for (const key of keys || []) srcs.push(prefix + this.slug(key) + ".png");
    };
    if (cfg && cfg.shipOrder) addKeys("assets/images/ships/player-wingman-", cfg.shipOrder);
    addKeys("assets/images/effects/effect-", this.preload.effects);
    addKeys("assets/images/ui/icons/icon-", this.preload.uiIcons);
    const powerupKeys = cfg && cfg.powerup
      ? Object.keys(Object.assign({}, cfg.powerup.weights || {}, cfg.powerup.endlessWeights || {}))
      : this.preload.powerups;
    addKeys("assets/images/ui/powerups/icon-powerup-", powerupKeys);
    addKeys("assets/images/ui/chips/icon-chip-", cfg && cfg.chipOrder || this.preload.chips);
    const bonusKeys = (cfg && cfg.bonusOrder || this.preload.bonuses).filter(key => !this.missingBonusIcons[this.slug(key)]);
    addKeys("assets/images/ui/bonuses/icon-bonus-", bonusKeys);
    return srcs;
  },
  allSources() {
    return Array.from(new Set(this.sources(this.manifest).concat(this.dynamicSources()))).filter(Boolean);
  },
  // GG15:加载优先级分层——一次性发起全部素材请求会让"常用的"和"很少用到的"抢同一份带宽,
  //   拆成两层:①"常用" = 所有机型/僚机贴图(展柜一进就要看全部机型) + HUD 图标/道具/芯片/强化/特效(第一关就用得到) +
  //   首页贴图,开屏页会等这一层加载完才结束(见 main.js loadTiered);②"长尾" = 全部敌机/BOSS立绘/其余世界背景,
  //   这些要么出现得晚(BOSS/后期世界)要么本来就有矢量兜底(敌机),不值得让玩家多等,开屏页结束后继续在后台悄悄加载。
  commonSources() {
    const srcs = this.dynamicSources().concat(this.sources(this.manifest.player), this.sources(this.manifest.wingman));
    const titleKeys = ["button-map", "button-challenge", "button-rival", "button-ship", "wordmark", "vignette", "logo-glow", "subtitle", "footer-glow"];
    for (const k of titleKeys) srcs.push("assets/images/ui/title/title-" + this.slug(k) + ".png");
    return Array.from(new Set(srcs)).filter(Boolean);
  },
  longTailSources() {
    const common = new Set(this.commonSources());
    return this.allSources().filter(src => !common.has(src));
  },
  // GG18:开屏页改为"全部贴图加载完才自动进入",需要真实的加载进度供进度条展示——
  //   loadProgress 记录 已完成/总数,每张图 decode 落定(成功或走完重试彻底失败)都记一次 done;
  //   加载顺序仍保持分层:先常用层(首页/机型/HUD)后长尾层(BOSS/敌机/后期背景),返回的 Promise 在"全部"落定后才 resolve。
  loadProgress: { done: 0, total: 0 },
  _trackList(list) {
    return Promise.all(list.map(src => this.decode(this.ensure(src)).then(ok => { this.loadProgress.done++; return ok; })));
  },
  loadAllTiered() {
    const common = this.commonSources(), tail = this.longTailSources();
    this.loadProgress.done = 0; this.loadProgress.total = common.length + tail.length;
    return this._trackList(common).then(() => this._trackList(tail)).then(() => true, () => true);
  },
  // GG14:静默重试——弱网/瞬时抖动导致的单张贴图加载失败,不该让这张图永久兜底成矢量图形。
  //   失败后间隔 retryDelay 重新赋值 img.src(强制浏览器重新发起请求)再试,最多 maxRetries 次,
  //   全程不打断/不提示玩家,成功了就正常继续,试完还失败才走原有的矢量兜底,行为对调用方完全透明
  waitImageSettle(img) {
    return new Promise(resolve => {
      if (img.complete) { resolve(img.naturalWidth > 0); return; }
      const done = (ok) => { img.removeEventListener("load", onLoad); img.removeEventListener("error", onError); resolve(ok); };
      const onLoad = () => done(true);
      const onError = () => done(false);
      img.addEventListener("load", onLoad);
      img.addEventListener("error", onError);
    });
  },
  decode(img, maxRetries = 2, retryDelay = 650) {
    if (!img) return Promise.resolve(false);
    const key = img.src || "";
    if (key && this.decodeCache[key]) return this.decodeCache[key];
    const attempt = (n) => this.waitImageSettle(img).then(ok => {
      if (ok) return true;
      if (n >= maxRetries) return false;
      return new Promise(r => setTimeout(r, retryDelay)).then(() => { img.src = key; return attempt(n + 1); });
    });
    const promise = attempt(0).then(ok => {
      if (!ok) return false;
      if (!img.decode) return true;
      return img.decode().then(() => true, () => true);
    });
    if (key) this.decodeCache[key] = promise;
    return promise;
  },
  preloadSources(srcs, timeoutMs = 0) {
    if (typeof Image === "undefined") return Promise.resolve(false);
    const list = Array.from(new Set(srcs || [])).filter(Boolean);
    const work = Promise.all(list.map(src => this.decode(this.ensure(src)))).then(() => true, () => false);
    if (!timeoutMs) return work;
    return Promise.race([work, new Promise(resolve => setTimeout(() => resolve(false), timeoutMs))]);
  },
  load() {
    return this.preloadSources(this.allSources());
  },
  criticalSources(opts = {}) {
    const cfg = typeof CONFIG !== "undefined" ? CONFIG : null;
    const shipKey = opts.shipKey || (cfg && cfg.shipOrder && cfg.shipOrder[0]) || "balanced";
    const ship = cfg && cfg.ships && cfg.ships[shipKey];
    const bg = this.manifest.background[opts.world || 1] || {};
    return [
      bg.base, bg.mid, bg.fg,
      this.manifest.player[shipKey] || this.manifest.player.balanced,
      this.manifest.wingman[shipKey] || this.manifest.wingman.balanced,
      "assets/images/ui/icons/icon-bomb.png",
      "assets/images/ui/icons/icon-special-" + this.slug(ship && ship.specialType || "nuke") + ".png",
      "assets/images/ui/icons/icon-power-upgrade.png",
      "assets/images/ui/powerups/icon-powerup-power.png",
      "assets/images/ui/powerups/icon-powerup-heal.png",
    ];
  },
  loadCritical(opts = {}) {
    return this.preloadSources(this.criticalSources(opts), opts.timeoutMs || 900);
  },
  ready(src) {
    const img = typeof src === "string" ? this.ensure(src) : src;
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  },
  bounds(img) {
    const key = img && img.src;
    if (!img) return null;
    if (key && this.boundsCache[key]) return this.boundsCache[key];
    const full = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    if (typeof document === "undefined") return full;
    try {
      // GG11:性能——大图(如 2848px 宽的标题 logo)逐像素扫透明边界会卡一帧,先等比缩到 ≤256px 的小画布上扫,
      //   结果按比例放大回原图坐标;边界精度损失几个像素,对"裁掉大片透明边"这个目的毫无影响
      const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const bctx = canvas.getContext("2d", { willReadFrequently: true });
      bctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = bctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (data[(y * canvas.width + x) * 4 + 3] <= 16) continue;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (maxX < 0) return full;
      const inv = 1 / scale;
      const pad = Math.ceil(Math.max(maxX - minX + 1, maxY - minY + 1) * 0.08);
      const x = Math.max(0, Math.floor((minX - pad) * inv)), y = Math.max(0, Math.floor((minY - pad) * inv));
      const x2 = Math.min(img.naturalWidth, Math.ceil((maxX + pad + 1) * inv)), y2 = Math.min(img.naturalHeight, Math.ceil((maxY + pad + 1) * inv));
      const box = { x, y, w: x2 - x, h: y2 - y };
      if (key) this.boundsCache[key] = box;
      return box;
    } catch (err) {
      if (key) this.boundsCache[key] = full;
      return full;
    }
  },
  player(key) { return this.ready(this.manifest.player[key]); },
  wingman(key) {
    const src = this.manifest.wingman[key] || (key ? "assets/images/ships/player-wingman-" + this.slug(key) + ".png" : null);
    return this.ready(src) || this.ready(this.manifest.wingman.balanced);
  },
  enemy(type) { return this.ready(this.manifest.enemy[type]); },
  boss(index) { return this.ready(this.manifest.boss[index]); },
  background(world, layer) {
    const bg = this.manifest.background[world];
    return this.ready(bg && bg[layer]);
  },
  effect(key) { return this.ready("assets/images/effects/effect-" + this.slug(key) + ".png"); },
  title(key) { return this.ready("assets/images/ui/title/title-" + this.slug(key) + ".png"); },
  uiIcon(key) { return this.ready("assets/images/ui/icons/icon-" + this.slug(key) + ".png"); },
  uiPowerup(key) { return this.ready("assets/images/ui/powerups/icon-powerup-" + this.slug(key) + ".png"); },
  uiChip(key) { return this.ready("assets/images/ui/chips/icon-chip-" + this.slug(key) + ".png"); },
  uiBonus(key) { return this.ready("assets/images/ui/bonuses/icon-bonus-" + this.slug(key) + ".png"); },
  uiEvent(key) { return this.ready("assets/images/ui/events/icon-event-" + this.slug(key) + ".png"); },
  draw(ctx, img, x, y, size, rotation = 0) {
    if (!img) return false;
    const box = this.bounds(img) || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const scale = size / Math.max(box.w, box.h);
    const w = box.w * scale, h = box.h * scale;
    ctx.save(); ctx.translate(x, y); if (rotation) ctx.rotate(rotation);
    ctx.drawImage(img, box.x, box.y, box.w, box.h, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  },
  drawRect(ctx, img, x, y, w, h, rotation = 0) {
    if (!img) return false;
    const box = this.bounds(img) || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    ctx.save(); ctx.translate(x, y); if (rotation) ctx.rotate(rotation);
    ctx.drawImage(img, box.x, box.y, box.w, box.h, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  },
  // GG:等比"contain"绘制——图片按最长边缩放塞进 maxW×maxH 的框内,不拉伸变形(区别于 drawRect 的拉伸铺满)
  drawContain(ctx, img, x, y, maxW, maxH) {
    if (!img) return false;
    const box = this.bounds(img) || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const scale = Math.min(maxW / box.w, maxH / box.h);
    const w = box.w * scale, h = box.h * scale;
    ctx.drawImage(img, box.x, box.y, box.w, box.h, x - w / 2, y - h / 2, w, h);
    return true;
  },
  // GG6:按统一目标宽度绘制(不看各图自身高宽比)——几张 logo 素材裁完透明边后的"内容高度"并不一样,
  //   之前用 drawContain 会让矮图形先撑满高度再决定宽度,同一批按钮里视觉宽度各不相同(无尽挑战偏大/好友挑战偏小)。
  //   统一按目标宽度缩放才能让"这一排按钮里的图看起来一样大",maxH 只是兜底防止极端比例的图撑爆版面。
  drawFitWidth(ctx, img, x, y, targetW, maxH) {
    if (!img) return false;
    const box = this.bounds(img) || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    let scale = targetW / box.w;
    if (maxH) scale = Math.min(scale, maxH / box.h);
    const w = box.w * scale, h = box.h * scale;
    ctx.drawImage(img, box.x, box.y, box.w, box.h, x - w / 2, y - h / 2, w, h);
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
