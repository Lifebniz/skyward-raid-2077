"use strict";

/* =====================================================================
 * 7) 游戏主体(状态:title | playing | gameover | win)
 * ===================================================================== */
const game = {
  state: "title", diff: CONFIG.difficulties.normal, ship: CONFIG.ships.balanced, currentLevel: 0, world: 1, player: null, boss: null,
  playerBullets: [], homingShots: [], missiles: [], playerLasers: [], enemyBullets: [], enemies: [], powerups: [], particles: [], floats: [], lasers: [], shockwaves: [], specialWaves: [],
  score: 0, combo: 0, comboTimer: 0, maxCombo: 0,
  threat: 0, chips: {}, _chipCursor: 0, _noHitT: 0,
  flashTimer: 0, bannerText: "", bannerSub: "", bannerTimer: 0, warningTimer: 0, titleT: 0, _sliderDrag: false,
  dlgName: "", dlgText: "", dlgTimer: 0,   // P:BOSS 台词
  topScores: [], _recorded: false,
  farming: false, _reached: false, _farmTimer: 0, _farmWaveN: 0, _clearScore: 0, settleResult: null, _resetArmed: false,
  _itemSpawnTimer: 0,   // Q:常规关卡(非无尽)每隔 CONFIG.powerup.autoInterval 秒自动刷新一个道具
  _bombsUsedThisLevel: 0,   // OO:本关用了几个炸弹(给"轻装上阵"成就用)
  _shipIdx: 0, _shipDragStartX: 0, _shipDragging: false,   // R:首页机型选择(左右滑动)
  _hpTrailRatio: 1,   // AA:血条"残影"—— 掉血后缓慢跟随下降,做视觉反馈
  _lastState: "title", _stateFadeT: 1,   // BB:菜单/覆盖层统一淡入(状态一变就重置为0,0.3秒淡到1)
  _settleAnimT: 0,   // BB:结算类数字滚动动画计时
  _codexBossIdx: 0, _codexDragStartX: 0, _codexDragging: false, _codexTab: "guide",   // Z:首页图鉴(关卡预览+BOSS轮播)+ OO:成就标签
  _tutorialPage: 0, _tutorialDragStartX: 0, _tutorialDragging: false,   // FF:新手引导翻页
  // MM:地图纵向滚动(为世界数超过一屏做准备)+ 拖动/点击手势区分
  _mapScrollY: 0, _mapDragStartX: 0, _mapDragStartY: 0, _mapDragStartScrollY: 0, _mapDragging: false, _mapDragMoved: false,
  _mapHighlightId: null, _mapHighlightT: 0,   // MM:从图鉴跳转过来时高亮提示的关卡
  _levelTransX: 0, _levelTransY: 0, _levelTransT: 0,   // NN:进入关卡的聚焦扩散过渡(从点击处展开)
  autoNext: true, endless: false, challengeSeed: "", challengeMode: false, challengeDaily: false, challengeTarget: null, challengeSplits: [], _rng: null, _endlessT: 0, _endlessSpawnT: 0, _endlessBossT: 0, _endlessBossN: 0,
  _shake: 0, _shakeT: 0, _hitStopT: 0,   // N:打击感
  // 触控按钮放大,便于拇指操作
  bombBtn: { x: 58, y: CONFIG.HEIGHT - 70, r: 42 },
  pauseBtn: { x: CONFIG.WIDTH - 58, y: CONFIG.HEIGHT - 70, r: 38 },
  settleBtn: { x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT - 70, r: 34 },
  specialBtn: { x: 150, y: CONFIG.HEIGHT - 70, r: 34 },

  // ── 流程 ──
  levelDef() { return LEVELS[this.currentLevel]; },
  // X3:BOSS 关卡(脚本里有 boss 步骤)自动掉落间隔按难度拉长,难度越高白捡的道具越少
  isBossLevel() { return this.levelDef().script.some(s => s.boss != null); },
  itemAutoInterval() { return CONFIG.powerup.autoInterval * (this.isBossLevel() ? this.activeDiff.itemDropMult : 1); },
  // T:无尽模式统一使用固定难度(不受地图选择影响);常规关卡仍用地图选的 this.diff
  get activeDiff() { return this.endless ? CONFIG.difficulties[CONFIG.endless.diffKey] : this.diff; },
  rng() { return this._rng ? this._rng() : Math.random(); },
  pick(list) { return list[(this.rng() * list.length) | 0]; },
  toTitle() { this.state = "title"; Music.play(); },
  toMap() { this.state = "map"; Music.play(); },
  // 某关是否解锁:首关或前一关已通关
  isUnlocked(i) { return i === 0 || Progress.isCleared(LEVELS[i - 1].id); },
  setDiff(diffKey) { this.diff = CONFIG.difficulties[diffKey]; Settings.set("diff", diffKey); },
  setShip(shipKey) { this.ship = CONFIG.ships[shipKey]; Settings.set("ship", shipKey); },
  // R:首页机型选择(左右滑动的卡片页,关卡地图的机型选项保留不变)
  shipSelectOrder() { return CONFIG.shipOrder; },
  toShipSelect() { this.state = "shipselect"; const order = this.shipSelectOrder(), i = order.indexOf(this.ship.key); this._shipIdx = i >= 0 ? i : 0; },
  shipSelectBackRect() { return { x: 20, y: 28, w: 90, h: 36 }; },
  shipSelectArrowRect(dir) { const y = 150 + 210 / 2 - 24; return dir < 0 ? { x: 26, y, w: 56, h: 48 } : { x: CONFIG.WIDTH - 82, y, w: 56, h: 48 }; },   // 与卡片(cardY150/cardH210)垂直居中对齐
  shipSelectConfirmRect() { return { x: CONFIG.WIDTH / 2 - 130, y: CONFIG.HEIGHT - 100, w: 260, h: 54 }; },
  shipSelectPointerDown(px, py) {
    const inR = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h, order = this.shipSelectOrder();
    if (inR(this.shipSelectBackRect())) { this.toTitle(); return; }
    if (inR(this.shipSelectArrowRect(-1))) { this._shipIdx = (this._shipIdx - 1 + order.length) % order.length; return; }
    if (inR(this.shipSelectArrowRect(1))) { this._shipIdx = (this._shipIdx + 1) % order.length; return; }
    if (inR(this.shipSelectConfirmRect())) { this.setShip(order[this._shipIdx]); return; }
    this._shipDragStartX = px; this._shipDragging = true;
  },
  // 松手时按滑动距离切换机型(左滑下一个 / 右滑上一个)
  shipSelectSwipe(px) {
    const order = this.shipSelectOrder(), dx = px - this._shipDragStartX;
    if (dx < -40) this._shipIdx = (this._shipIdx + 1) % order.length;
    else if (dx > 40) this._shipIdx = (this._shipIdx - 1 + order.length) % order.length;
  },

  // ── Z:首页图鉴(关卡预览网格 + BOSS轮播 + OO:成就标签页,独立于机型选择页的拖拽状态)──
  toCodex() { this.state = "codex"; this._codexBossIdx = 0; this._codexTab = "guide"; },
  codexBackRect() { return { x: 20, y: 28, w: 90, h: 36 }; },
  codexTabRect(i) { const w = 140, gap = 12, total = 2 * w + gap, x0 = (CONFIG.WIDTH - total) / 2; return { x: x0 + i * (w + gap), y: 70, w, h: 36 }; },
  // OO:加了标签页之后网格/BOSS卡片整体下移,这里是唯一算 BOSS 卡片顶部 y 的地方,箭头/点击区/drawCodex 都从这取,不要各自硬编数字
  // WW:行数原来硬编码成3(对应12关/4列正好3行),第5世界加进来后关卡数变15,网格变成4行,
  //   硬编码3还按老高度算的话 BOSS 区域会往上盖住网格第4行——改成按 LEVELS.length 动态算行数。
  codexLevelGridRows() { return Math.ceil(LEVELS.length / 4); },
  codexBossCardY() { return 138 + this.codexLevelGridRows() * 64 + (this.codexLevelGridRows() - 1) * 10 + 30; },
  // X6:卡片加了攻击图标行,cardH 从220涨到246,箭头垂直居中/"出场关卡"点击区跟着同步下移
  codexArrowRect(dir) { const y = this.codexBossCardY() + 246 / 2 - 24; return dir < 0 ? { x: 26, y, w: 56, h: 48 } : { x: CONFIG.WIDTH - 82, y, w: 56, h: 48 }; },
  // MM:"出场关卡"这行文字的点击区域(点了跳到地图并高亮第一个出场关卡)
  codexAppearRect() { const cx = CONFIG.WIDTH / 2, cardW = 320; return { x: cx - cardW / 2 + 10, y: this.codexBossCardY() + 169, w: cardW - 20, h: 20 }; },
  codexPointerDown(px, py) {
    const inR = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    if (inR(this.codexBackRect())) { this.toTitle(); return; }
    if (inR(this.codexTabRect(0))) { this._codexTab = "guide"; return; }
    if (inR(this.codexTabRect(1))) { this._codexTab = "achievements"; return; }
    if (this._codexTab !== "guide") return;   // OO:成就页没有左右滑动/箭头这些交互
    if (inR(this.codexArrowRect(-1))) { this._codexBossIdx = (this._codexBossIdx - 1 + CONFIG.bosses.length) % CONFIG.bosses.length; return; }
    if (inR(this.codexArrowRect(1))) { this._codexBossIdx = (this._codexBossIdx + 1) % CONFIG.bosses.length; return; }
    if (inR(this.codexAppearRect()) && bossLevelIds(this._codexBossIdx).length) { this.jumpToLevelFromCodex(this._codexBossIdx); return; }
    this._codexDragStartX = px; this._codexDragging = true;
  },
  codexSwipe(px) {
    if (this._codexTab !== "guide") return;
    const dx = px - this._codexDragStartX, n = CONFIG.bosses.length;
    if (dx < -40) this._codexBossIdx = (this._codexBossIdx + 1) % n;
    else if (dx > 40) this._codexBossIdx = (this._codexBossIdx - 1 + n) % n;
  },

  // ── FF:新手引导(首次启动自动展示,首页"？帮助"可重看;左右滑动/箭头翻页,同一套交互模式)──
  toTutorial() { this.state = "tutorial"; this._tutorialPage = 0; },
  closeTutorial() { Settings.set("seenTutorial", true); this.toTitle(); },
  tutorialSkipRect() { return { x: 20, y: 28, w: 100, h: 36 }; },
  tutorialArrowRect(dir) { const y = CONFIG.HEIGHT / 2 - 24; return dir < 0 ? { x: 26, y, w: 56, h: 48 } : { x: CONFIG.WIDTH - 82, y, w: 56, h: 48 }; },
  tutorialNextRect() { return { x: CONFIG.WIDTH / 2 - 130, y: CONFIG.HEIGHT - 100, w: 260, h: 54 }; },
  tutorialPointerDown(px, py) {
    const inR = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h, n = TUTORIAL_PAGES.length;
    if (inR(this.tutorialSkipRect())) { this.closeTutorial(); return; }
    if (inR(this.tutorialArrowRect(-1))) { this._tutorialPage = (this._tutorialPage - 1 + n) % n; return; }
    if (inR(this.tutorialArrowRect(1))) { this._tutorialPage = (this._tutorialPage + 1) % n; return; }
    if (inR(this.tutorialNextRect())) { if (this._tutorialPage >= n - 1) this.closeTutorial(); else this._tutorialPage++; return; }
    this._tutorialDragStartX = px; this._tutorialDragging = true;
  },
  tutorialSwipe(px) {
    const dx = px - this._tutorialDragStartX, n = TUTORIAL_PAGES.length;
    if (dx < -40) this._tutorialPage = (this._tutorialPage + 1) % n;
    else if (dx > 40) this._tutorialPage = (this._tutorialPage - 1 + n) % n;
  },

  pause()  { if (this.state === "playing") { this.state = "paused"; input.dragging = false; } },
  resume() { if (this.state === "paused") this.state = "playing"; },
  togglePause() { if (this.state === "playing") this.pause(); else if (this.state === "paused") this.resume(); },
  // 暂停菜单按钮:0=继续 1=返回首页
  pauseMenuRect(i) { const w = 240, h = 54, x = (CONFIG.WIDTH - w) / 2, y = 440 + i * 74; return { x, y, w, h }; },
  pauseMenuHit(px, py) { for (let i = 0; i < 2; i++) { const r = this.pauseMenuRect(i); if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i; } return -1; },
  pauseButtonHit(x, y) { const b = this.pauseBtn; return (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r; },
  // 开始某一关(索引)
  startLevel(i) {
    this.currentLevel = i; this.world = LEVELS[i].world; this.endless = false; this.challengeSeed = ""; this.challengeMode = false; this.challengeDaily = false; this.challengeTarget = null; this.challengeSplits = []; this._rng = null;
    this.state = "playing";
    this.player = new Player(); this.boss = null;
    this.playerBullets = []; this.homingShots = []; this.missiles = []; this.playerLasers = []; this.enemyBullets = []; this.enemies = []; this.powerups = []; this.particles = []; this.floats = []; this.lasers = []; this.shockwaves = []; this.specialWaves = [];
    this.score = 0; this.combo = 0; this.comboTimer = 0; this.maxCombo = 0;
    this.resetDepthSystems();
    this.flashTimer = 0; this.warningTimer = 0; this._recorded = false;
    this.farming = false; this._reached = false; this._farmTimer = 0; this._farmWaveN = 0; this.settleResult = null;
    this._itemSpawnTimer = this.itemAutoInterval(); this._hpTrailRatio = 1; this._bombsUsedThisLevel = 0;
    director.begin(LEVELS[i].script);
    input.targetX = CONFIG.player.startX; input.targetY = CONFIG.player.startY;
    Sound.start(); Music.play(); this.banner("STAGE " + LEVELS[i].id, CONFIG.worldIntro[(LEVELS[i].world - 1) % CONFIG.worldIntro.length]);
    this.dlgTimer = 0;
    Achievements.trackShipUse(this.ship.key);   // OO
  },
  // 达标(固定波次全灭 + 屏幕清空)→ 弹出「结算 / 继续刷分」
  reachTarget() {
    if (this._reached) return;
    this._reached = true; this._clearScore = this.score;   // 通关时得分 → 刷分上限基准
    this.state = "cleared"; this.flashTimer = 0.4; Sound.bossDefeat();
  },
  // 继续刷分:回到对局,开启受上限约束的额外波次
  startFarm() { this.farming = true; this.state = "playing"; this._farmTimer = 1.0; if (director.script) director.cursor = director.script.length; },

  // F:无尽生存模式
  startEndless(opts = {}) {
    if (opts.ship && CONFIG.ships[opts.ship]) this.setShip(opts.ship);
    this.endless = true; this.challengeSeed = opts.seed || Challenge.randomSeed(); this.challengeMode = !!opts.challenge; this.challengeDaily = !!opts.daily; this.challengeTarget = opts.target || null; this.challengeSplits = []; this._rng = Challenge.rng(this.challengeSeed);
    this.farming = false; this._reached = false; this.currentLevel = 0; this.world = 1;
    this.state = "playing";
    this.player = new Player(); this.boss = null;
    this.playerBullets = []; this.homingShots = []; this.missiles = []; this.playerLasers = []; this.enemyBullets = []; this.enemies = []; this.powerups = []; this.particles = []; this.floats = []; this.lasers = []; this.shockwaves = []; this.specialWaves = [];
    this.score = 0; this.combo = 0; this.comboTimer = 0; this.maxCombo = 0;
    this.resetDepthSystems();
    this.flashTimer = 0; this.warningTimer = 0; this._hpTrailRatio = 1;
    this._endlessT = 0; this._endlessSpawnT = 1.0; this._endlessBossT = 30; this._endlessBossN = 0;
    director.begin(null);
    input.targetX = CONFIG.player.startX; input.targetY = CONFIG.player.startY;
    Sound.start(); Music.play(); this.banner(this.challengeMode ? "挑战模式" : "无尽模式", this.challengeDaily ? "每日空域" : (this.challengeMode ? "同种子竞速" : ""));
    Achievements.trackShipUse(this.ship.key);   // OO
  },
  updateEndless(dt) {
    this._endlessT += dt;
    this.recordChallengeSplits();
    this.world = 1 + (Math.floor(this._endlessT / 40) % CONFIG.themes.length);   // 背景随时间轮换
    this._endlessSpawnT -= dt;
    if (this._endlessSpawnT <= 0 && this.enemies.length < CONFIG.endless.maxEnemies) {
      const t = this._endlessT;
      this._endlessSpawnT = Math.max(0.8, 1.8 - t * 0.008);
      const n = Math.min(2 + Math.min(5, Math.floor(t / 15)), CONFIG.endless.maxEnemies - this.enemies.length);   // 不超同屏上限
      // W2:t>=250 再加一档,carrier 权重继续往上提,长线存活的玩家会越来越常遇到"一炸一窝"的母舰,难度持续爬坡而不是160秒后封顶
      const pool = t < 20 ? ["small", "small", "medium"] : t < 50 ? ["small", "medium", "medium", "large", "gunner"] : t < 100 ? ["small", "medium", "large", "gunner", "splitter"] : t < 160 ? ["small", "medium", "large", "gunner", "splitter", "sniper", "detonator"] : t < 250 ? ["small", "medium", "large", "gunner", "splitter", "sniper", "detonator", "phantom", "phantom", "carrier"] : ["small", "medium", "large", "gunner", "splitter", "sniper", "detonator", "phantom", "phantom", "carrier", "carrier", "carrier"];
      const moves = ["sine", "zigzag", "dive", "straight", "swoop", "orbit"];
      for (let i = 0; i < n; i++) { const type = this.pick(pool), r = CONFIG.enemy[type].radius; this.enemies.push(pools.enemy.get(type, r + 20 + this.rng() * (CONFIG.WIDTH - 2 * (r + 20)), 0, this.pick(moves))); }
      if (this.rng() < 0.12) this.spawnPowerUp(30 + this.rng() * (CONFIG.WIDTH - 60), this.chooseDrop());
    }
    this._endlessBossT -= dt;
    if (this._endlessBossT <= 0 && !this.boss) { this._endlessBossT = 35; this.spawnBoss(this._endlessBossN % CONFIG.bosses.length); this._endlessBossN++; }
  },
  settleEndless() {
    const final = Math.round(this.score * this.activeDiff.scoreMult);
    const time = Math.floor(this._endlessT);
    const splits = this.challengeSplits.slice();
    const previousBest = ChallengeHistory.best(this.challengeSeed, this.ship.key);
    const challengeCode = Challenge.encode({ seed: this.challengeSeed, ship: this.ship.key, score: final, time, combo: this.maxCombo, splits });
    const best = ChallengeHistory.submit({ seed: this.challengeSeed, ship: this.ship.key, score: final, time, combo: this.maxCombo, splits, code: challengeCode, daily: this.challengeDaily });
    this.endlessResult = { base: this.score, diffFactor: this.activeDiff.scoreMult, time, final, maxCombo: this.maxCombo, splits, challengeCode, challengeSeed: this.challengeSeed, challengeMode: this.challengeMode, challengeDaily: this.challengeDaily, target: this.challengeTarget, best, newBest: !previousBest || final > previousBest.score };
    this.endlessTop = EndlessBoard.submit(final);
    this.state = "endlessover";
    Achievements.checkEndlessEnd({ time: this._endlessT, maxCombo: this.maxCombo });   // OO
  },
  openChallengePrompt() {
    this.showChallengeModal();
  },
  startDailyChallenge() { this.startEndless({ seed: Challenge.dailySeed(), challenge: true, daily: true }); },
  challengeSplitMarks() { return [30, 60, 120]; },
  recordChallengeSplits() {
    const marks = this.challengeSplitMarks();
    while (this.challengeSplits.length < marks.length && this._endlessT >= marks[this.challengeSplits.length]) {
      this.challengeSplits.push({ t: marks[this.challengeSplits.length], score: Math.round(this.score * this.activeDiff.scoreMult) });
    }
  },
  targetChallengeSplit() {
    const splits = this.challengeTarget && this.challengeTarget.splits;
    if (!Array.isArray(splits) || !splits.length) return null;
    let target = splits[0];
    for (const split of splits) { if (this._endlessT >= split.t) target = split; else break; }
    return target;
  },
  endlessChallengeRect() { return { x: CONFIG.WIDTH / 2 - 150, y: 650, w: 300, h: 48 }; },
  endlessChallengeHit(px, py) { const r = this.endlessChallengeRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  copyEndlessChallenge() {
    const r = this.endlessResult;
    if (!r || !r.challengeCode) return;
    this.showChallengeModal({ code: r.challengeCode, readonly: true });
  },
  showChallengeModal(opts = {}) {
    let old = document.getElementById("challenge-modal");
    if (old) old.remove();
    const overlay = document.createElement("div"), panel = document.createElement("div"), title = document.createElement("div"), hint = document.createElement("div");
    const input = document.createElement("textarea"), msg = document.createElement("div"), actions = document.createElement("div"), history = document.createElement("div");
    const style = (el, css) => Object.assign(el.style, css);
    style(overlay, { position: "fixed", inset: "0", zIndex: "50", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.55)", color: "#fff", fontFamily: "'Segoe UI', sans-serif" });
    style(panel, { width: "min(88vw, 380px)", maxHeight: "88vh", overflowY: "auto", background: "rgba(12,16,24,.96)", border: "1px solid rgba(255,255,255,.24)", borderRadius: "12px", boxShadow: "0 14px 40px rgba(0,0,0,.45)", padding: "18px" });
    style(title, { fontSize: "22px", fontWeight: "700", color: "#ffd43b", marginBottom: "8px" });
    style(hint, { fontSize: "13px", lineHeight: "1.45", color: "#ced4da", marginBottom: "10px" });
    style(input, { width: "100%", minHeight: opts.readonly ? "92px" : "118px", boxSizing: "border-box", resize: "vertical", borderRadius: "8px", border: "1px solid rgba(255,255,255,.24)", background: "rgba(0,0,0,.32)", color: "#fff", padding: "10px", fontSize: "13px", outline: "none" });
    style(msg, { minHeight: "20px", margin: "8px 0", color: "#ff8787", fontSize: "13px" });
    style(actions, { display: "grid", gridTemplateColumns: opts.readonly ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: "8px" });
    style(history, { marginTop: "14px", display: "grid", gap: "8px" });
    const button = (label, color, fn) => {
      const b = document.createElement("button");
      b.textContent = label;
      style(b, { border: "0", borderRadius: "8px", padding: "10px 8px", color: "#fff", background: color, fontWeight: "700", cursor: "pointer" });
      b.onclick = fn;
      return b;
    };
    const close = () => overlay.remove();
    const copyText = async (text) => {
      const legacyCopy = () => {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        style(el, { position: "fixed", left: "-9999px", top: "0", opacity: "0" });
        document.body.appendChild(el);
        el.focus(); el.select();
        const ok = document.execCommand && document.execCommand("copy");
        el.remove();
        return ok;
      };
      try {
        if (legacyCopy()) { msg.style.color = "#38d9a9"; msg.textContent = "已复制"; return; }
      } catch (e) {}
      try {
        await navigator.clipboard.writeText(text);
        msg.style.color = "#38d9a9"; msg.textContent = "已复制";
      } catch (e) {
        input.value = text; input.focus(); input.select();
        msg.style.color = "#ff8787"; msg.textContent = "请手动复制文本";
      }
    };
    const routeText = (payload) => {
      if (!payload || !Challenge.routeStatus) return "";
      const route = Challenge.routeStatus(payload);
      return "航线 " + route.code + (route.ok ? " · 已校验" : " · 规则可能变化");
    };
    const startCode = (raw) => {
      const payload = Challenge.decode(raw);
      if (!payload) { msg.style.color = "#ff8787"; msg.textContent = "挑战码无效"; return; }
      close(); this.startEndless({ seed: payload.seed, ship: payload.ship, challenge: true, target: payload });
    };
    const readonlyRoute = opts.code ? routeText(Challenge.decode(opts.code)) : "";
    title.textContent = opts.readonly ? "复制挑战码" : "挑战码 RIVAL";
    hint.textContent = (opts.readonly ? "复制后发给朋友，对方会进入同一种子、同机型的无尽局。" : "粘贴朋友发来的挑战码，或直接开始每日/新挑战。") + (readonlyRoute ? "\n" + readonlyRoute : "");
    input.value = opts.code || "";
    input.readOnly = !!opts.readonly;
    overlay.id = "challenge-modal";
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    panel.append(title, hint, input, msg, actions, history); overlay.append(panel); document.body.appendChild(overlay);
    if (opts.readonly) {
      actions.append(
        button("复制", "#f59f00", () => copyText(input.value)),
        button("关闭", "#495057", close)
      );
    } else {
      actions.append(
        button("开始", "#f59f00", () => {
          const raw = input.value.trim();
          if (!raw) { close(); this.startEndless({ seed: Challenge.randomSeed(), challenge: true }); return; }
          startCode(raw);
        }),
        button("每日", "#2f9e44", () => { close(); this.startDailyChallenge(); }),
        button("新挑战", "#1971c2", () => { close(); this.startEndless({ seed: Challenge.randomSeed(), challenge: true }); }),
        button("关闭", "#495057", close)
      );
      const records = ChallengeHistory.load().filter(r => r.code || r.lastCode).slice(0, 3);
      if (records.length) {
        const hTitle = document.createElement("div");
        hTitle.textContent = "最近挑战";
        style(hTitle, { color: "#adb5bd", fontSize: "13px", fontWeight: "700", marginTop: "2px" });
        history.appendChild(hTitle);
        records.forEach(r => {
          const row = document.createElement("div"), meta = document.createElement("div"), sub = document.createElement("div");
          const ship = CONFIG.ships[r.ship] ? CONFIG.ships[r.ship].name : r.ship;
          const code = r.code || r.lastCode, splits = Challenge.cleanSplits(r.splits || r.lastSplits);
          const route = routeText(Challenge.decode(code));
          meta.textContent = "最佳 " + (r.score || 0) + " · " + (r.time || 0) + "s · " + ship;
          sub.textContent = (r.daily ? "每日" : r.seed) + " · 尝试 " + (r.attempts || 1) + (splits.length ? " · 节点 " + splits.map(s => s.t + "s " + s.score).join(" / ") : "") + (route ? " · " + route : "");
          style(row, { display: "grid", gridTemplateColumns: "1fr 58px 58px", gap: "8px", alignItems: "center", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,.1)" });
          style(meta, { color: "#e9ecef", fontSize: "13px", lineHeight: "1.35" });
          style(sub, { color: "#868e96", fontSize: "12px", lineHeight: "1.35", marginTop: "2px" });
          meta.appendChild(sub);
          row.append(meta, button("复制", "#495057", () => copyText(code)), button("重打", "#343a40", () => startCode(code)));
          history.appendChild(row);
        });
      }
    }
    setTimeout(() => { input.focus(); if (opts.readonly) input.select(); }, 0);
  },
  // 结算:按血量系数 + 关卡难度系数算最终分,记录进度/排行
  computeFinal() {
    const s = CONFIG.scoring, hpRatio = this.player ? clamp(this.player.hp / this.player.maxHp, 0, 1) : 0;
    const hpFactor = 1 + hpRatio * s.hpCoeff;
    const diffFactor = this.diff.scoreMult;   // 难度系数分(简单0.5 / 普通1.0 / 困难3.0)
    return { base: this.score, hpRatio, hpFactor, diffName: this.diff.name.split(" ")[0], diffFactor, final: Math.round(this.score * hpFactor * diffFactor) };
  },
  settle(advance = false) {
    const r = this.computeFinal(); this.settleResult = r;
    Progress.record(this.levelDef().id, r.final, this.diff.key, this.diff.rank);
    this.topScores = Leaderboard.submit(this.levelDef().id, r.final);
    Achievements.checkLevelClear({ hpRatio: r.hpRatio, bombsUsed: this._bombsUsedThisLevel, maxCombo: this.maxCombo });   // OO
    this.farming = false;
    // ②勾选自动进入下一关:同难度、同机型、新初始配置直接开下一关
    if (advance && this.currentLevel < LEVELS.length - 1) this.startLevel(this.currentLevel + 1);
    else this.state = "settle";
  },
  spawnFarmWave() {
    this._farmWaveN++;
    const room = CONFIG.scoring.farmMaxEnemies - this.enemies.length;                   // 在场敌人上限内才补
    const n = Math.min(4 + Math.min(this._farmWaveN, 6), room);
    if (n <= 0) return;
    const types = ["small", "small", "medium", "large"], moves = ["sine", "zigzag", "dive", "straight"];
    for (let i = 0; i < n; i++) {
      const type = this.pick(types), r = CONFIG.enemy[type].radius;
      this.enemies.push(pools.enemy.get(type, r + 20 + this.rng() * (CONFIG.WIDTH - 2 * (r + 20)), 0, this.pick(moves)));
    }
  },
  settleButtonHit(x, y) { const b = this.settleBtn; return (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r; },
  clearedMenuRect(i) { const w = 240, h = 54, x = (CONFIG.WIDTH - w) / 2, y = 470 + i * 74; return { x, y, w, h }; },
  clearedMenuHit(px, py) { for (let i = 0; i < 2; i++) { const r = this.clearedMenuRect(i); if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i; } return -1; },
  clearedCheckRect() { return { x: CONFIG.WIDTH / 2 - 140, y: 410, w: 280, h: 36 }; },
  clearedCheckHit(px, py) { const r = this.clearedCheckRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  banner(text, sub) { this.bannerText = text; this.bannerSub = sub || ""; this.bannerTimer = 2.2; },
  showDialogue(name, text, dur) { this.dlgName = name; this.dlgText = text || ""; this.dlgTimer = dur || 3.5; },   // P
  addShake(mag, t) { this._shake = Math.max(this._shake, mag); this._shakeT = Math.max(this._shakeT, t); },   // N
  hitStop(t) { this._hitStopT = Math.max(this._hitStopT, t); },
  resetDepthSystems() { this.threat = 0; this.chips = {}; this._chipCursor = 0; this._noHitT = 0; },
  maxThreat() { return CONFIG.threat.maxLevel * CONFIG.threat.perLevel; },
  threatLevel() { return clamp(Math.floor(this.threat / CONFIG.threat.perLevel), 0, CONFIG.threat.maxLevel); },
  threatScoreMult() { return 1 + this.threatLevel() * CONFIG.threat.scoreStep; },
  threatDamageMult() { return 1 + this.threatLevel() * (CONFIG.threat.damageStep || 0); },
  addThreat(n) { this.threat = clamp(this.threat + n, 0, this.maxThreat()); },
  dropThreat(n) { this.threat = clamp(this.threat - n, 0, this.maxThreat()); },
  chipActive(key) { return (this.chips[key] || 0) > 0; },
  chipValue(key, prop, fallback) { const c = CONFIG.chips[key]; return this.chipActive(key) && c && c[prop] != null ? c[prop] : fallback; },
  activateChip(key, msg) {
    const c = CONFIG.chips[key]; if (!c) return;
    this.chips[key] = Math.max(this.chips[key] || 0, c.duration);
    this.floats.push(new FloatText(this.player.x, this.player.y - 48, msg || c.name, c.color));
    this.addThreat(CONFIG.threat.overflowGain);
  },
  activateNextChip() {
    const order = CONFIG.chipOrder, key = order[this._chipCursor++ % order.length];
    this.activateChip(key, "芯片 " + CONFIG.chips[key].name);
  },
  updateDepthSystems(dt) {
    for (const key of Object.keys(this.chips)) {
      this.chips[key] -= dt;
      if (this.chips[key] <= 0) delete this.chips[key];
    }
    if (!this.player) return;
    this._noHitT += dt;
    const t = CONFIG.threat;
    if (this.player.power >= CONFIG.player.maxPower && this.player.overcharge >= CONFIG.player.maxOvercharge) this.addThreat(t.fullPowerPerSec * dt);
    if (this.combo >= t.comboTrigger) this.addThreat(t.comboPerSec * dt);
    if (this._noHitT >= t.noHitDelay) this.addThreat(t.noHitPerSec * dt);
  },
  onPlayerHit(blocked = false) {
    this._noHitT = 0;
    this.dropThreat(blocked ? CONFIG.threat.blockedHitLoss : CONFIG.threat.hitLoss);
  },

  spawnPlayerBullet(x, y, vx, vy) { this.playerBullets.push(pools.playerBullet.get(x, y, vx, vy)); },
  spawnHomingShot(x, y, overcharge) { this.homingShots.push(pools.homingShot.get(x, y, overcharge)); },
  spawnMissile(x, y, overcharge) { this.missiles.push(pools.missile.get(x, y, overcharge)); },
  spawnPlayerLaser(x, y, overcharge) { this.playerLasers.push(pools.playerLaser.get(x, y, overcharge)); },
  spawnPowerUp(x, kind) { this.powerups.push(new PowerUp(x, -20, kind)); },
  nearestEnemy(x, y, maxDist = Infinity) {
    let best = null, bestD = maxDist * maxDist;
    for (const e of this.enemies) {
      if (e.dead || e.y < -e.radius) continue;
      const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  },
  // W2:无尽模式 BOSS 血量按已刷出过的 BOSS 场次数递增(每场 +8%,封顶12场即+96%),让长线存活不会一直打同样血量的 BOSS 车轮战
  spawnBoss(defIndex) {
    const b = new Boss(defIndex);
    if (this.endless) { const mult = 1 + Math.min(this._endlessBossN, 12) * 0.08; b.maxHp = Math.round(b.maxHp * mult); b.hp = b.maxHp; }
    this.enemies.push(b); this.boss = b; this.warningTimer = 2.2; this.showDialogue(b.def.name, b.def.taunt, 3.8); return b;
  },
  // Y:BOSS 狂暴触发提示(HP<=20% 时一次性)
  onBossEnrage(b) { this.showDialogue(b.def.name, "狂暴!攻击频率大幅提升!", 3.0); this.addShake(6, 0.28); Sound.hit(); Haptics.bomb(); },
  // Y:镭射攻击 —— warn 秒预警(半透明红条)后进入 dur 秒的伤害柱,期间站在范围内会持续受伤(复用玩家受击无敌帧天然限制伤害频率)
  spawnBossLaser(x, warn, dur, width, dmg) { this.lasers.push({ x, warn, dur, width, dmg, t: 0, phase: "warn", dead: false }); },
  updateLasers(dt) {
    for (const l of this.lasers) {
      l.t += dt;
      if (l.phase === "warn") { if (l.t >= l.warn) { l.phase = "fire"; l.t = 0; } }
      else {
        if (this.player && Math.abs(this.player.x - l.x) <= l.width / 2) this.player.takeDamage(l.dmg);
        if (l.t >= l.dur) l.dead = true;
      }
    }
    pruneDead(this.lasers);
  },
  drawLasers(ctx) {
    for (const l of this.lasers) {
      const half = l.width / 2;
      if (l.phase === "warn") {
        const a = 0.14 + 0.18 * Math.abs(Math.sin(l.t * 18));
        ctx.fillStyle = "rgba(255,50,50," + a + ")"; ctx.fillRect(l.x - half, 0, l.width, CONFIG.HEIGHT);
        ctx.strokeStyle = "rgba(255,180,180,.75)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(l.x - half, 0); ctx.lineTo(l.x - half, CONFIG.HEIGHT); ctx.moveTo(l.x + half, 0); ctx.lineTo(l.x + half, CONFIG.HEIGHT); ctx.stroke();
      } else {
        const g = ctx.createLinearGradient(l.x - half * 1.5, 0, l.x + half * 1.5, 0);
        g.addColorStop(0, "rgba(255,60,60,0)"); g.addColorStop(0.35, "rgba(255,60,60,.55)"); g.addColorStop(0.5, "rgba(255,255,255,.9)"); g.addColorStop(0.65, "rgba(255,60,60,.55)"); g.addColorStop(1, "rgba(255,60,60,0)");
        ctx.fillStyle = g; ctx.fillRect(l.x - half * 1.5, 0, l.width * 1.5, CONFIG.HEIGHT);
      }
    }
  },
  // 所有敌弹的唯一出口:统一按难度缩放伤害
  // W:无尽模式敌弹伤害随存活时间线性爬升,300 秒时封顶 3 倍(非无尽恒为 1)
  endlessBulletDmgMult() {
    if (!this.endless) return 1;
    const e = CONFIG.endless;
    return 1 + Math.min(this._endlessT / e.dmgRampTime, 1) * (e.dmgRampMult - 1);
  },
  spawnEnemyBullet(x, y, vx, vy, baseDamage) { this.enemyBullets.push(pools.enemyBullet.get(x, y, vx, vy, baseDamage * this.activeDiff.dmgMult * this.endlessBulletDmgMult() * this.threatDamageMult())); },
  fireFan(x, y, baseAngle, spread, count, speed, damage) { for (let i = 0; i < count; i++) { const a = count === 1 ? baseAngle : baseAngle - spread / 2 + spread * (i / (count - 1)); this.spawnEnemyBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, damage); } },
  fireRing(x, y, count, speed, damage) { for (let i = 0; i < count; i++) { const a = (i / count) * Math.PI * 2; this.spawnEnemyBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, damage); } },
  burst(x, y, color, count, speed) { for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7); this.particles.push(pools.particle.get(x, y, Math.cos(a) * s, Math.sin(a) * s, color)); } },
  // CC:打击感 —— 冲击波圆环(击杀反馈)+ 命中火花(不论是否致命,每次子弹命中都给一点回馈)
  spawnShockwave(x, y, maxR, color) { this.shockwaves.push(new Shockwave(x, y, maxR, color)); },
  spawnHitSpark(x, y) { for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 60; this.particles.push(pools.particle.get(x, y, Math.cos(a) * s, Math.sin(a) * s, "#fff9db")); } },
  // X4:护盾格挡反馈——比普通命中火花更"硬"、更冷色,提示"这下是盾挡的,不是肉扛的"
  spawnShieldHitSpark(x, y) { for (let i = 0; i < 5; i++) { const a = Math.random() * Math.PI * 2, s = 90 + Math.random() * 90; this.particles.push(pools.particle.get(x, y, Math.cos(a) * s, Math.sin(a) * s, "#99e9f2")); } },
  // RR:引擎尾焰拖尾粒子 —— 比爆炸粒子小、寿命短,从对象池取完后覆盖 life/size,做出持续喷射的拖尾感
  spawnEngineFlame(x, y) {
    const p = pools.particle.get(x + (Math.random() - 0.5) * 4, y, (Math.random() - 0.5) * 20, 60 + Math.random() * 50, Math.random() < 0.5 ? "#ffe066" : "#ff922b");
    p.life = 0.16 + Math.random() * 0.1; p.maxLife = p.life; p.size = 2 + Math.random() * 1.5;
    this.particles.push(p);
  },

  comboMult() { return clamp(1 + this.combo * CONFIG.combo.scoreStep, 1, CONFIG.combo.maxMult); },
  breakCombo() { if (this.combo >= CONFIG.threat.comboTrigger) this.dropThreat(CONFIG.threat.comboBreakLoss); this.combo = 0; this.comboTimer = 0; },

  bombButtonHit(x, y) { const b = this.bombBtn; return (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r; },
  useBomb() {
    if (!this.player || this.player.bombs <= 0) return;
    this.player.bombs--; this._bombsUsedThisLevel++; Sound.bomb(); Haptics.bomb(); this.addShake(6, 0.2); this.hitStop(0.04);
    this.dropThreat(CONFIG.threat.bombLoss);
    this.flashTimer = CONFIG.bomb.flash;
    this.player.invulnTimer = Math.max(this.player.invulnTimer, CONFIG.player.bombInvuln);
    for (const b of this.enemyBullets) { this.burst(b.x, b.y, "#ff8787", 3, 120); b.dead = true; }
    pruneDead(this.enemyBullets, releaseDead.enemyBullet);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.isBoss) { this.burst(e.x, e.y, "#fff", 24, 240); if (e.damage(CONFIG.bomb.bossDamage * (this.player.ship.bombDmgMult || 1))) this.onEnemyKilled(e, false, true); }
      else if (e.damage(9999)) this.onEnemyKilled(e, false, true);
    }
  },

  // B:必杀 —— 能量满 + 冷却结束才可释放。X4:效果按机型分派(specialType),不再是所有机型统一的全屏重伤:
  //   攻击型 nuke(全屏重伤+短暂无敌,原效果保留)/防御型 shield(回血+护盾)/侦查型 stealth(长时间隐身)/平衡型 wave(冲击波抵消弹幕)
  // YY:BUG修复——原来这里还判了"能量满+冷却好"才算命中,必杀没准备好时点按钮的坐标判定会直接落空,
  //   落空后 pointerdown 会继续往下走到"设置移动目标"那一步,飞机就被拖去了按钮所在位置。
  //   改成纯几何命中(和 bombButtonHit/pauseButtonHit 一致),是否真的能放交给 useSpecial() 内部自己判断并静默 no-op。
  specialButtonHit(x, y) { const b = this.specialBtn; return (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r; },
  useSpecial() {
    if (!this.player || this.player.energy < 100 || this.player.specialCooldown > 0) return;
    this.player.energy = 0; this.player.specialCooldown = CONFIG.special.cooldown * (this.player.ship.specialCooldownMult || 1); Sound.bomb(); Haptics.bomb(); this.addShake(8, 0.25); this.hitStop(0.06);
    this.flashTimer = 0.35;
    const type = this.player.ship.specialType || "nuke";
    if (type === "shield") this.useSpecialShield();
    else if (type === "stealth") this.useSpecialStealth();
    else if (type === "wave") this.useSpecialWave();
    else this.useSpecialNuke();
  },
  // 攻击型:原有的全屏重伤 + 短暂无敌,数值/行为完全不变
  useSpecialNuke() {
    this.flashTimer = 0.5; this.player.invulnTimer = Math.max(this.player.invulnTimer, CONFIG.special.invuln);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.isBoss) { this.burst(e.x, e.y, "#ffd43b", 30, 320); if (e.damage(CONFIG.special.bossDamage)) this.onEnemyKilled(e, false, true); }
      else if (e.damage(9999)) this.onEnemyKilled(e, false, true);
    }
  },
  // 防御型:立即回一部分血 + 展开吸收伤害的护盾(见 Player.takeDamage / Player._drawShield)
  useSpecialShield() {
    const s = CONFIG.special;
    this.player.heal(this.player.maxHp * s.healOnShield);
    this.player.shieldHp = s.shieldHp; this.player.shieldMax = s.shieldHp; this.player.shieldTimer = s.shieldDur;
    this.burst(this.player.x, this.player.y, "#38d9a9", 22, 220); this.spawnShockwave(this.player.x, this.player.y, this.player.radius * 2.4, "#38d9a9");
  },
  // 侦查型:长时间隐身免伤(见 Player.takeDamage / Player._drawStealthShimmer),不清场也不加防御,纯靠"躲开这一段"
  useSpecialStealth() {
    this.player.stealthTimer = CONFIG.special.stealthDur;
    this.burst(this.player.x, this.player.y, "#ffd43b", 18, 200);
  },
  // 平衡型:向前(向上)发射一道会变宽的能量波,抵消沿途弹幕并对扫到的敌机造成一次伤害(见 SpecialWave / resolveSpecialWaves)
  useSpecialWave() {
    this.specialWaves.push(new SpecialWave(this.player.x, this.player.y - this.player.radius, this.player.ship.color));
  },

  onEnemyKilled(e, allowDrop = true, byBomb = false) {
    let gained;
    if (byBomb) { gained = Math.round(e.score * CONFIG.scoring.bombKillMult); }              // 炸弹/必杀清兵:不涨连击、分数打折
    else { this.combo++; this.comboTimer = CONFIG.combo.timeout * (this.player ? this.player.ship.comboTimeoutMult : 1); this.maxCombo = Math.max(this.maxCombo, this.combo); gained = Math.round(e.score * this.comboMult() * this.threatScoreMult()); this.addThreat(e.isBoss ? CONFIG.threat.bossKillGain : CONFIG.threat.killGain); }
    this.score += gained;
    if (this.player && !byBomb) this.player.addEnergy(e.isBoss ? CONFIG.special.gainBossKill : CONFIG.special.gainPerKill);   // B:攒必杀能量(炸弹/必杀击杀不攒,防循环)
    this.floats.push(new FloatText(e.x, e.y - e.radius, "+" + gained, byBomb ? "#868e96" : (this.combo >= 5 ? "#ffd43b" : "#fff")));
    // D:splitter 死亡裂成小型机(在死亡位置)
    if (e.type === "splitter") { for (let k = 0; k < (e.cfg.splits || 3); k++) { const off = (k - (e.cfg.splits - 1) / 2) * 26, ne = pools.enemy.get("small", clamp(e.x + off, 20, CONFIG.WIDTH - 20), 0, "straight"); ne.y = e.y; this.enemies.push(ne); } }
    // Z:detonator(雷机)死亡炸出一圈弹幕,击杀时需留意走位;GG 加一声尖锐"哔"区别于普通爆炸
    if (e.type === "detonator") { this.fireRing(e.x, e.y, e.cfg.ringCount || 14, e.cfg.ringSpeed || 210, e.cfg.ringDamage || 9); Sound.tone(700, 0.12, "square", 0.15, 200); }
    // V:carrier(母舰机)死亡裂出 spawnCount 只 spawns 类型僚机(比 splitter 更硬更重的进阶版套路)
    // W2:裂解出的僚机加一圈紫色脉动环 + 一撮紫色粒子,让玩家能一眼看出"这只是母舰刚炸出来的",不然和场上正常刷新的同类型敌机分不清
    if (e.type === "carrier") {
      for (let k = 0; k < (e.cfg.spawnCount || 2); k++) {
        const off = (k - (e.cfg.spawnCount - 1) / 2) * 30, ne = pools.enemy.get(e.cfg.spawns || "medium", clamp(e.x + off, 20, CONFIG.WIDTH - 20), 0, "sine");
        ne.y = e.y; ne._carrierSpawn = 1.0; this.enemies.push(ne);
      }
      this.burst(e.x, e.y, "#9775fa", 10, 140);
    }
    if (e.isBoss) { for (let k = 0; k < 5; k++) this.burst(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, ["#ffd43b", "#ff922b", "#fff"][k % 3], 18, 260); this.spawnShockwave(e.x, e.y, e.radius * 3, "#ffd43b"); this.flashTimer = Math.max(this.flashTimer, 0.4); Sound.bossDefeat(); Haptics.bossDefeat(); this.addShake(9, 0.32); this.hitStop(0.08); Achievements.trackBossKill(e.defIndex); }
    else { this.burst(e.x, e.y, e.color, 14, 180); this.spawnShockwave(e.x, e.y, e.radius * 2.2, e.color); Sound.explosion(e.radius >= 30 ? "large" : e.radius >= 20 ? "medium" : "small"); if (allowDrop) this.maybeDrop(e.type, e.x, e.y); }
    // CC:连击每达 10 的倍数,弹一次居中大字里程碑特效
    if (!byBomb && this.combo > 0 && this.combo % 10 === 0) this.comboMilestone(this.combo);
  },
  comboMilestone(n) {
    // HH:按用户反馈取消了连击里程碑的震动(太频繁,叠加暂停期间的震动 BUG 感觉像屏幕一直在抖)
    this.bannerText = n + " COMBO!"; this.bannerSub = ""; this.bannerTimer = 1.1;
    Sound.powerup();
  },
  maybeDrop(type, x, y) { if (type === "small") return; if (this.rng() < CONFIG.powerup.dropChance) this.powerups.push(new PowerUp(x, y, this.chooseDrop())); },
  canDrop(kind) { return !!kind; },
  chooseDrop() {
    const w = this.endless ? CONFIG.powerup.endlessWeights : CONFIG.powerup.weights;
    const kinds = ["power", "heal", "bomb", "wing"].filter(k => this.canDrop(k));
    const total = kinds.reduce((s, k) => s + w[k], 0);
    if (total <= 0) return "heal";
    let r = this.rng() * total;
    for (const k of kinds) { if (r < w[k]) return k; r -= w[k]; }
    return kinds[kinds.length - 1];
  },
  collectPowerup(kind) {
    const p = this.player, o = CONFIG.overflow;
    if (kind === "power") {
      if (p.power >= CONFIG.player.maxPower && p.overcharge >= CONFIG.player.maxOvercharge) this.activateNextChip();
      else {
        const wasMax = p.power >= CONFIG.player.maxPower;
        p.addPower();
        this.floats.push(new FloatText(p.x, p.y - 34, wasMax ? "过载 +" + p.overcharge : "火力 +1", wasMax ? "#74c0fc" : "#38d9a9"));
      }
    } else if (kind === "bomb") {
      if (p.bombs >= CONFIG.player.maxBombs) { p.addEnergy(o.bombEnergy); this.floats.push(new FloatText(p.x, p.y - 34, "能量 +" + o.bombEnergy, "#ffd43b")); this.addThreat(o.threatGain); }
      else { p.addBomb(); this.floats.push(new FloatText(p.x, p.y - 34, "炸弹 +1", "#cc5de8")); }
    } else if (kind === "wing") {
      if (p.wings >= CONFIG.wingMax) this.activateChip(o.wingChip, "侧翼炮组");
      else { p.addWing(); this.floats.push(new FloatText(p.x, p.y - 34, "僚机 +1", "#dee2e6")); }
    } else {
      if (p.hp >= p.maxHp) { p.grantShield(o.healShield, o.healShieldDur); this.floats.push(new FloatText(p.x, p.y - 34, "临时护盾 +" + o.healShield, "#74c0fc")); this.addThreat(o.threatGain); }
      else { p.heal(CONFIG.powerup.healAmount); this.floats.push(new FloatText(p.x, p.y - 34, "HP +" + CONFIG.powerup.healAmount, "#ff8787")); }
    }
  },

  update(dt) {
    // BB:菜单/覆盖层统一淡入 —— 状态一变就从 0 开始,0.3 秒淡到 1(暂停态也照常推进,让暂停面板正常淡入)
    if (this.state !== this._lastState) { this._lastState = this.state; this._stateFadeT = 0; this._settleAnimT = 0; }
    this._stateFadeT += dt; this._settleAnimT += dt;
    if (this.state === "paused") return;          // 暂停:冻结一切(逻辑/粒子/计时器)
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.warningTimer > 0) this.warningTimer -= dt;
    if (this._shakeT > 0) this._shakeT -= dt;
    if (this.dlgTimer > 0) this.dlgTimer -= dt;
    if (this._mapHighlightT > 0) this._mapHighlightT -= dt;
    if (this._levelTransT > 0 && this._levelTransT < 0.45) this._levelTransT += dt;
    this.particles.forEach(o => o.update(dt));
    pruneDead(this.particles, releaseDead.particle);   // DD:粒子归还对象池
    this.floats.forEach(o => o.update(dt)); pruneDead(this.floats);
    this.shockwaves.forEach(o => o.update(dt)); pruneDead(this.shockwaves);
    this.specialWaves.forEach(o => o.update(dt)); pruneDead(this.specialWaves);

    if (this.state !== "playing") {
      if (this.state === "gameover" && !this._recorded) { this._recorded = true; this.topScores = Leaderboard.submit(this.levelDef().id, this.score); }
      return;
    }

    if (this.combo > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.breakCombo(); }
    this.updateDepthSystems(dt);

    director.update(dt);
    if (this.endless) this.updateEndless(dt);
    else {   // Q:常规关卡(含刷分续关)每隔固定秒数自动刷新一个道具;无尽模式不刷新(有自己的掉落节奏)
      this._itemSpawnTimer -= dt;
      if (this._itemSpawnTimer <= 0) { this._itemSpawnTimer = this.itemAutoInterval(); this.spawnPowerUp(30 + this.rng() * (CONFIG.WIDTH - 60), this.chooseDrop()); }
    }
    if (this.farming) {
      if (this.score >= this._clearScore * CONFIG.scoring.farmScoreCapMult) { this.settle(); }   // 达刷分总分上限 → 强制结算
      else { this._farmTimer -= dt; if (this._farmTimer <= 0 && this.enemies.length < CONFIG.scoring.farmMaxEnemies) { this._farmTimer = CONFIG.scoring.farmInterval; this.spawnFarmWave(); } }
    }
    this.player.update(dt);
    this.playerBullets.forEach(o => o.update(dt));
    this.homingShots.forEach(o => o.update(dt));
    this.missiles.forEach(o => o.update(dt));
    this.playerLasers.forEach(o => o.update(dt));
    this.enemyBullets.forEach(o => o.update(dt));
    this.enemies.forEach(o => o.update(dt));
    this.powerups.forEach(o => o.update(dt));
    this.updateLasers(dt);

    this.resolveCollisions();
    this.resolveSpecialWaves();

    // AA:血条残影 —— 掉血时缓慢跟随下降(0.5/秒),涨血瞬间跟上,营造"最近损失多少血"的反馈
    { const ratio = clamp(this.player.hp / this.player.maxHp, 0, 1); this._hpTrailRatio = this._hpTrailRatio > ratio ? Math.max(ratio, this._hpTrailRatio - dt * 0.5) : ratio; }

    // DD:死亡对象归还对象池(必须在 filter 丢弃引用之前 release,否则池子永远收不回来)
    pruneDead(this.playerBullets, releaseDead.playerBullet);
    pruneDead(this.homingShots, releaseDead.homingShot);
    pruneDead(this.missiles, releaseDead.missile);
    pruneDead(this.playerLasers, releaseDead.playerLaser);
    pruneDead(this.enemyBullets, releaseDead.enemyBullet);
    pruneDead(this.enemies, releaseDead.enemy);
    pruneDead(this.powerups);
    if (this.boss && this.boss.dead) this.boss = null;
    if (this.player.hp <= 0) { if (this.endless) this.settleEndless(); else if (this.farming) this.settle(); else this.state = "gameover"; }   // 刷分中阵亡也进结算
  },

  resolveCollisions() {
    for (const b of this.playerBullets) {
      if (b.dead) continue;
      for (const e of this.enemies) { if (e.dead) continue; if (hit(b, e)) { b.dead = true; this.spawnHitSpark(b.x, b.y); if (e.damage(CONFIG.bullet.damage)) this.onEnemyKilled(e); break; } }
    }
    for (const b of this.homingShots) {
      if (b.dead) continue;
      for (const e of this.enemies) { if (e.dead) continue; if (hit(b, e)) { b.dead = true; this.spawnHitSpark(b.x, b.y); if (e.damage(b.damage)) this.onEnemyKilled(e); break; } }
    }
    for (const m of this.missiles) {
      if (m.dead) continue;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (!hit(m, e)) continue;
        m.dead = true; this.burst(m.x, m.y, "#ff922b", 12, 190); this.spawnShockwave(m.x, m.y, m.splash, "#ff922b");
        Sound.missileHit();
        if (e.damage(m.damage)) this.onEnemyKilled(e);
        const splashDmg = Math.max(1, Math.round(m.damage * 0.45));
        for (const other of this.enemies) {
          if (other.dead || other === e) continue;
          const dx = other.x - m.x, dy = other.y - m.y, rr = m.splash + other.radius;
          if (dx * dx + dy * dy <= rr * rr && other.damage(splashDmg)) this.onEnemyKilled(other);
        }
        break;
      }
    }
    for (const l of this.playerLasers) {
      if (l.dead) continue;
      const half = l.width / 2;
      for (const e of this.enemies) {
        if (e.dead || l.hitEnemies.has(e)) continue;
        if (e.y <= l.y + e.radius && Math.abs(e.x - l.x) <= half + e.radius) {
          l.hitEnemies.add(e);
          this.spawnHitSpark(e.x, e.y);
          if (e.damage(l.damage)) this.onEnemyKilled(e);
        }
      }
    }
    for (const e of this.enemies) { if (e.dead) continue; if (hit(e, this.player)) { if (!e.isBoss) { e.dead = true; this.burst(e.x, e.y, e.color, 10, 160); } this.player.takeDamage(CONFIG.crashDamage * this.activeDiff.dmgMult * this.threatDamageMult()); } }
    for (const b of this.enemyBullets) { if (b.dead) continue; if (hit(b, this.player)) { b.dead = true; this.player.takeDamage(b.damage); } }
    for (const p of this.powerups) {
      if (p.dead) continue;
      if (hit(p, this.player)) {
        p.dead = true; Sound.powerup(); Haptics.powerup();
        this.collectPowerup(p.kind);
      }
    }
  },
  // X4:平衡型必杀"破阵冲击波"的判定——矩形band(宽 width、厚 thickness,随波前 y 平移)扫过的敌弹直接销毁,
  // 扫到的敌机只结算一次伤害(hitEnemies 去重,避免波前停留在慢速大型机身上时每帧重复打)
  resolveSpecialWaves() {
    for (const w of this.specialWaves) {
      if (w.dead) continue;
      const halfW = w.width / 2, halfT = w.thickness / 2;
      for (const b of this.enemyBullets) { if (b.dead) continue; if (Math.abs(b.x - w.x) <= halfW && Math.abs(b.y - w.y) <= halfT) { b.dead = true; this.spawnHitSpark(b.x, b.y); } }
      for (const e of this.enemies) {
        if (e.dead || w.hitEnemies.has(e)) continue;
        if (Math.abs(e.x - w.x) <= halfW + e.radius && Math.abs(e.y - w.y) <= halfT + e.radius) {
          w.hitEnemies.add(e);
          if (e.damage(CONFIG.special.waveDamage)) this.onEnemyKilled(e); else this.spawnHitSpark(e.x, e.y);
        }
      }
    }
  },

  // BB:结算类画面的数字滚动动画 —— 从 0 缓动(ease-out)滚到 target,约 dur 秒,配合 _settleAnimT(状态一变就重置)
  easedCount(target, dur = 1.0) {
    const f = clamp(this._settleAnimT / dur, 0, 1), eased = 1 - Math.pow(1 - f, 3);
    return Math.round(target * eased);
  },
  // BB:菜单/覆盖层统一淡入包装器 —— 状态刚切换的 0.3 秒内按 _stateFadeT 淡入,之后就是普通不透明绘制
  // SS:淡入的同时叠加一个轻微的缩放弹入(94%→100%,ease-out),比纯透明度淡入更有"现代APP"的弹性感
  _drawFaded(ctx, fn) {
    const t = clamp(this._stateFadeT / 0.3, 0, 1);
    if (t < 1) {
      const eased = 1 - Math.pow(1 - t, 3), scale = 0.94 + 0.06 * eased;
      ctx.save(); ctx.globalAlpha = eased;
      ctx.translate(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2); ctx.scale(scale, scale); ctx.translate(-CONFIG.WIDTH / 2, -CONFIG.HEIGHT / 2);
      fn(); ctx.restore();
    } else fn();
  },
  draw(ctx) {
    // N:屏幕震动(仅对局态;标题/地图/设置/机型选择/图鉴 sh=0 不会 save,故其提前 return 不失衡)
    // HH:paused 也要排除在外 —— 之前 _shakeT 在暂停时不递减(冻结),但这里没排除 paused,
    // 导致每帧仍用 Math.random() 重新算一次抖动偏移,暂停画面就变成没完没了的随机抖动。
    const inGame = this.state !== "title" && this.state !== "settings" && this.state !== "map" && this.state !== "shipselect" && this.state !== "codex" && this.state !== "tutorial" && this.state !== "paused";
    const sh = (this._shakeT > 0 && inGame) ? this._shake : 0;
    if (sh > 0) { ctx.save(); ctx.translate((Math.random() * 2 - 1) * sh, (Math.random() * 2 - 1) * sh); }
    background.draw(ctx, this.world); stars.draw(ctx);
    if (this.state === "title") { this._drawFaded(ctx, () => this.drawTitle(ctx)); return; }
    if (this.state === "settings") { this._drawFaded(ctx, () => this.drawSettings(ctx)); return; }
    if (this.state === "shipselect") { this._drawFaded(ctx, () => this.drawShipSelect(ctx)); return; }
    if (this.state === "codex") { this._drawFaded(ctx, () => this.drawCodex(ctx)); return; }
    if (this.state === "tutorial") { this._drawFaded(ctx, () => this.drawTutorial(ctx)); return; }
    if (this.state === "map") { this._drawFaded(ctx, () => this.drawMap(ctx)); return; }
    this.drawLasers(ctx);   // Y:镭射(危险柱)画在敌人/玩家之下,让玩家能看清自己是否站在范围内
    this.powerups.forEach(o => o.draw(ctx));
    this.enemies.forEach(o => o.draw(ctx));
    this.enemyBullets.forEach(o => o.draw(ctx));
    this.playerLasers.forEach(o => o.draw(ctx));
    this.playerBullets.forEach(o => o.draw(ctx));
    this.homingShots.forEach(o => o.draw(ctx));
    this.missiles.forEach(o => o.draw(ctx));
    this.particles.forEach(o => o.draw(ctx));
    this.shockwaves.forEach(o => o.draw(ctx));
    this.specialWaves.forEach(o => o.draw(ctx));
    this.floats.forEach(o => o.draw(ctx));
    if (this.player) this.player.draw(ctx);
    if (Settings.data.controlMode === "joystick" && this.state === "playing") this.drawJoystick(ctx);
    this.drawHUD(ctx);
    // NN:进入关卡的聚焦扩散过渡 —— 从地图上点击的位置展开一个圆形"洞",黑幕从这个洞外逐渐缩小到看不见
    if (this._levelTransT > 0 && this._levelTransT < 0.45) {
      const t = clamp(this._levelTransT / 0.45, 0, 1), r = t * Math.hypot(CONFIG.WIDTH, CONFIG.HEIGHT);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      ctx.moveTo(this._levelTransX + r, this._levelTransY); ctx.arc(this._levelTransX, this._levelTransY, r, 0, Math.PI * 2, true);
      ctx.fillStyle = "#000"; ctx.fill("evenodd");
      ctx.restore();
    }
    if (this.flashTimer > 0) { ctx.fillStyle = "rgba(255,255,255," + (this.flashTimer / CONFIG.bomb.flash * 0.6) + ")"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT); }
    if (this.bannerTimer > 0 && this.state === "playing") {
      ctx.globalAlpha = clamp(this.bannerTimer, 0, 1); ctx.textAlign = "center";
      ctx.fillStyle = "#ffd43b"; ctx.font = "bold 44px 'Segoe UI', sans-serif"; ctx.fillText(this.bannerText, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.4);
      if (this.bannerSub) { ctx.fillStyle = "#e9ecef"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText(this.bannerSub, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.4 + 34); }
      ctx.textAlign = "left"; ctx.globalAlpha = 1;
    }
    // P:BOSS 台词框
    if (this.dlgTimer > 0 && this.state === "playing") {
      const bx = 20, bw = CONFIG.WIDTH - 40, by = CONFIG.HEIGHT - 232, bh = 60;
      ctx.globalAlpha = clamp(this.dlgTimer, 0, 1);
      ctx.fillStyle = "rgba(10,14,20,.88)"; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "#f03e3e"; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.textAlign = "left"; ctx.fillStyle = "#ff6b6b"; ctx.font = "bold 15px 'Segoe UI', sans-serif"; ctx.fillText("◆ " + this.dlgName, bx + 14, by + 24);
      ctx.fillStyle = "#e9ecef"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText(this.dlgText, bx + 14, by + 48);
      ctx.globalAlpha = 1;
    }
    if (this.warningTimer > 0 && this.state === "playing") this.drawWarning(ctx);
    if (this.state === "paused") this._drawFaded(ctx, () => this.drawPause(ctx));
    if (this.state === "gameover") this._drawFaded(ctx, () => this.drawEndScreen(ctx, "战斗失败", "#ff6b6b"));
    if (this.state === "cleared") this._drawFaded(ctx, () => this.drawCleared(ctx));
    if (this.state === "settle") this._drawFaded(ctx, () => this.drawSettle(ctx));
    if (this.state === "endlessover") this._drawFaded(ctx, () => this.drawEndlessOver(ctx));
    if (sh > 0) ctx.restore();
  },

  // F:无尽结算界面
  drawEndlessOver(ctx) {
    const cx = CONFIG.WIDTH / 2, r = this.endlessResult || { base: this.score, diffFactor: this.activeDiff.scoreMult, time: 0, final: this.score, maxCombo: this.maxCombo };
    const top = this.endlessTop || EndlessBoard.load();
    const target = r.target || null, targetScore = target && target.score ? target.score : 0;
    const targetSplits = target ? Challenge.cleanSplits(target.splits) : [], ownSplits = Challenge.cleanSplits(r.splits);
    const signed = (n) => (n >= 0 ? "+" : "") + n;
    let infoY = 418;
    ctx.fillStyle = "rgba(0,0,0,.78)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff922b"; ctx.font = "bold 40px 'Segoe UI', sans-serif"; ctx.fillText("生存结束", cx, 250);
    ctx.fillStyle = "#fff"; ctx.font = "22px 'Segoe UI', sans-serif"; ctx.fillText("存活 " + r.time + " 秒   最高连击 " + r.maxCombo, cx, 300);
    ctx.fillStyle = "#dee2e6"; ctx.font = "20px 'Segoe UI', sans-serif"; ctx.fillText("得分 " + this.easedCount(r.base) + "  × 难度 " + r.diffFactor.toFixed(1), cx, 336);
    ctx.fillStyle = "#fff"; ctx.font = "bold 30px 'Segoe UI', sans-serif"; ctx.fillText("最终得分  " + this.easedCount(r.final, 1.3), cx, 384);
    if (target) {
      const ship = CONFIG.ships[target.ship] ? CONFIG.ships[target.ship].name : (target.ship || "未知机型");
      const route = Challenge.routeStatus ? Challenge.routeStatus(target) : null;
      const splitText = targetSplits.map(s => {
        const own = ownSplits.find(o => o.t === s.t);
        return s.t + "s " + (own ? signed(own.score - s.score) : "未到");
      }).join(" / ");
      const boxH = 50 + (splitText ? 20 : 0) + (route ? 20 : 0);
      ctx.fillStyle = "rgba(8,16,28,.72)"; UI.roundRect(ctx, cx - 178, infoY - 20, 356, boxH, 10); ctx.fill();
      ctx.strokeStyle = r.final >= targetScore ? "rgba(56,217,169,.72)" : "rgba(255,212,59,.72)"; ctx.lineWidth = 1.2; UI.roundRect(ctx, cx - 178, infoY - 20, 356, boxH, 10); ctx.stroke();
      ctx.fillStyle = r.final >= targetScore ? "#38d9a9" : "#ffd43b"; ctx.font = "bold 16px 'Segoe UI', sans-serif";
      ctx.fillText("对手 " + targetScore + " · " + (target.time || 0) + "s" + " · 连击 " + (target.combo || 0), cx, infoY);
      ctx.fillStyle = "#adb5bd"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText(ship + " · 最终差 " + signed(r.final - targetScore), cx, infoY + 20);
      let lineY = infoY + 40;
      if (splitText) { ctx.fillText("分段差 " + splitText, cx, lineY); lineY += 20; }
      if (route) ctx.fillText("航线 " + route.code + (route.ok ? " · 已校验" : " · 规则可能变化"), cx, lineY);
      infoY += boxH + 10;
    }
    if (r.best && r.best.score) { ctx.fillStyle = r.newBest ? "#38d9a9" : "#74c0fc"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("个人最佳 " + r.best.score + "  ·  " + (r.newBest ? "新纪录" : "差 " + Math.max(0, r.best.score - r.final)), cx, infoY); infoY += 24; }
    const boardY = infoY > 418 ? infoY + 16 : 434;
    ctx.fillStyle = "#adb5bd"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("── 无尽榜 ──", cx, boardY);
    let hl = false;
    top.forEach((e, i) => { const me = !hl && e.score === r.final; if (me) hl = true; ctx.fillStyle = me ? "#ffd43b" : "#dee2e6"; ctx.font = (me ? "bold " : "") + "17px 'Segoe UI', sans-serif"; ctx.fillText((i + 1) + ".   " + e.score + "   " + e.date + (me ? "  ◄" : ""), cx, boardY + 30 + i * 28); });
    if (r.challengeCode) UI.button(ctx, this.endlessChallengeRect(), { label: "复制挑战码 RIVAL", color: "#ffd43b", active: true, font: 20, radius: 14 });
    ctx.fillStyle = "#4a90d9"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("点击空白返回首页", cx, 724);
    ctx.textAlign = "left";
  },

  drawPause(ctx) {
    const cx = CONFIG.WIDTH / 2;
    ctx.fillStyle = "rgba(0,0,0,.66)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 48px 'Segoe UI', sans-serif"; ctx.fillText("暂停", cx, 340);
    ctx.fillStyle = "#adb5bd"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.fillText("P / Esc 键也可继续", cx, 380);
    UI.button(ctx, this.pauseMenuRect(0), { label: "继续 RESUME", color: "#38d9a9", active: true, font: 21 });
    UI.button(ctx, this.pauseMenuRect(1), { label: "返回首页 HOME", color: "#adb5bd", font: 21 });
    ctx.textAlign = "left";
  },

  // ── 标题界面 ──(S:开始/无尽/挑战码/机型四个大按钮同宽同高,竖向排列)
  titleStartRect() { const w = 300, h = 58, x = (CONFIG.WIDTH - w) / 2, y = 376; return { x, y, w, h }; },
  titleStartHit(px, py) { const r = this.titleStartRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  titleEndlessRect() { const w = 300, h = 58, x = (CONFIG.WIDTH - w) / 2, y = 448; return { x, y, w, h }; },
  titleEndlessHit(px, py) { const r = this.titleEndlessRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  titleChallengeRect() { const w = 300, h = 58, x = (CONFIG.WIDTH - w) / 2, y = 520; return { x, y, w, h }; },
  titleChallengeHit(px, py) { const r = this.titleChallengeRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  titleShipRect() { const w = 300, h = 58, x = (CONFIG.WIDTH - w) / 2, y = 592; return { x, y, w, h }; },
  titleShipHit(px, py) { const r = this.titleShipRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  titleSettingsRect() { return { x: CONFIG.WIDTH - 108, y: 30, w: 92, h: 40 }; },
  titleSettingsHit(px, py) { const r = this.titleSettingsRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  titleCodexRect() { return { x: 16, y: 30, w: 92, h: 40 }; },
  titleCodexHit(px, py) { const r = this.titleCodexRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  titleHelpRect() { return { x: 16, y: 76, w: 92, h: 40 }; },
  titleHelpHit(px, py) { const r = this.titleHelpRect(); return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
  drawTitle(ctx) {
    const cx = CONFIG.WIDTH / 2, t = this.titleT;
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    // 标题:轻微呼吸缩放
    const s = 1 + Math.sin(t * 2) * 0.03;
    ctx.save(); ctx.translate(cx, 175); ctx.scale(s, s);
    ctx.fillStyle = "#fff"; ctx.font = "bold 56px 'Segoe UI', sans-serif"; ctx.fillText("空中突袭", 0, 0); ctx.restore();
    ctx.fillStyle = "#4dabf7"; ctx.font = "26px 'Segoe UI', sans-serif"; ctx.fillText("2 0 7 7 · 原创空战", cx, 220);
    // 悬停的占位飞机(上下浮动)
    const py = 262 + Math.sin(t * 1.6) * 6;
    ctx.fillStyle = "#4dabf7"; ctx.beginPath(); ctx.moveTo(cx, py - 16); ctx.lineTo(cx - 13, py + 12); ctx.lineTo(cx + 13, py + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#a5d8ff"; ctx.fillRect(cx - 3, py - 5, 6, 13);
    // 设置(右上角)/ 图鉴(左上角)小图标按钮
    UI.button(ctx, this.titleSettingsRect(), { label: "⚙ 设置", color: "#adb5bd", font: 15, radius: 10 });
    UI.button(ctx, this.titleCodexRect(), { label: "📖 图鉴", color: "#adb5bd", font: 15, radius: 10 });
    UI.button(ctx, this.titleHelpRect(), { label: "？帮助", color: "#adb5bd", font: 15, radius: 10 });
    // S:四个同尺寸大按钮 —— 开始 / 无尽 / 挑战码 / 机型选择
    UI.button(ctx, this.titleStartRect(), { label: "关卡地图 MAP", color: "#38d9a9", active: true, font: 26, radius: 16 });
    UI.button(ctx, this.titleEndlessRect(), { label: "无尽模式 ENDLESS", sub: "难度固定 · 普通", color: "#ff922b", active: true, font: 26, radius: 16 });
    UI.button(ctx, this.titleChallengeRect(), { label: "挑战码 RIVAL", sub: "挑战码 / 每日", color: "#ffd43b", active: true, font: 25, radius: 16 });
    UI.button(ctx, this.titleShipRect(), { label: "机型选择 SHIP", sub: this.ship.name, color: "#4dabf7", active: true, font: 24, radius: 16 });
    // Q:排行榜按关卡区分,标题页无具体关卡上下文,故不再显示总榜;进入关卡结算/失败画面时显示该关排行
    ctx.fillStyle = "#868e96"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("排行榜 · 按关卡分别记录,通关或失败后可见", cx, 700);
    ctx.textAlign = "left";
  },

  // ── R:首页机型选择(左右滑动卡片;关卡地图里的机型选项仍保留,两处互相同步)──
  drawShipSelect(ctx) {
    const cx = CONFIG.WIDTH / 2, order = this.shipSelectOrder(), key = order[this._shipIdx], sp = CONFIG.ships[key], selected = this.ship.key === key;
    ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 30px 'Segoe UI', sans-serif"; ctx.fillText("选择机型", cx, 66);
    UI.button(ctx, this.shipSelectBackRect(), { label: "‹ 首页", color: "#adb5bd", font: 15, radius: 10 });
    UI.button(ctx, this.shipSelectArrowRect(-1), { label: "‹", color: "#495057", font: 26, radius: 12 });
    UI.button(ctx, this.shipSelectArrowRect(1), { label: "›", color: "#495057", font: 26, radius: 12 });

    // 机体卡片(QQ:玻璃质感面板 + 真实机身剪影,与游戏内造型一致)
    const cardW = 300, cardH = 210, cardX = cx - cardW / 2, cardY = 150;
    UI.panel(ctx, cardX, cardY, cardW, cardH, 18, { accent: sp.color, lineWidth: 2.5 });
    drawShipBody(ctx, cx, cardY + 92, sp);
    ctx.fillStyle = sp.color; ctx.font = "bold 26px 'Segoe UI', sans-serif"; ctx.fillText(sp.name, cx, cardY + 156);
    ctx.fillStyle = "#dee2e6"; ctx.font = "15px 'Segoe UI', sans-serif"; ctx.fillText(sp.desc, cx, cardY + 182);

    // 圆点指示器(对应机型颜色)
    order.forEach((k, i) => {
      const dx = cx + (i - (order.length - 1) / 2) * 22, dy = cardY + cardH + 26;
      ctx.beginPath(); ctx.arc(dx, dy, i === this._shipIdx ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i === this._shipIdx ? sp.color : "rgba(255,255,255,.3)"; ctx.fill();
    });

    // X6:性能改用直观的进度条(而不是裸数字),被动/机型技能各配一枚精致图案图标——整体向"现代游戏图鉴"风格靠拢
    const statX = cx - 150, statW = 300, statY = cardY + cardH + 56;
    ctx.textAlign = "left";
    ctx.fillStyle = "#868e96"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("性能", statX, statY);
    // 三条性能条:生命值/射速(越低越快,取反归一化)/机动,统一映射到有对比区分度的区间而不是简单 0-100%
    const stats = [
      { label: "生命值", ratio: clamp((sp.hpMult - 0.5) / 1.1, 0, 1), value: Math.round(sp.hpMult * 100) + "%", color: "#ff6b6b" },
      { label: "射速", ratio: 1 - clamp((sp.fireMult - 0.7) / 0.6, 0, 1), value: "×" + sp.fireMult.toFixed(2), color: "#4dabf7" },
      { label: "机动", ratio: clamp(((sp.lerpMult || 1) - 0.7) / 0.9, 0, 1), value: Math.round((sp.lerpMult || 1) * 100) + "%", color: "#38d9a9" },
    ];
    let sy = statY + 16;
    stats.forEach(st => {
      ctx.fillStyle = "#adb5bd"; ctx.font = "12px 'Segoe UI', sans-serif"; ctx.fillText(st.label, statX, sy);
      ctx.textAlign = "right"; ctx.fillStyle = "#dee2e6"; ctx.fillText(st.value, statX + statW, sy); ctx.textAlign = "left";
      UI.bar(ctx, statX, sy + 6, statW, 8, st.ratio, UI.shade(st.color, -0.15), st.color, {});
      sy += 32;
    });

    // 被动技能:图标框(专属图案)+ 名称/描述
    sy += 14;
    ctx.fillStyle = "#868e96"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("被动技能", statX, sy);
    const perkBoxY = sy + 14, boxSize = 44;
    UI.panel(ctx, statX, perkBoxY, boxSize, boxSize, 12, { accent: sp.color });
    this.drawPassiveIcon(ctx, statX + boxSize / 2, perkBoxY + boxSize / 2, boxSize * 0.75, key, sp.color);
    const textX = statX + boxSize + 12, textW = statX + statW - textX;
    ctx.fillStyle = sp.color; ctx.font = "bold 15px 'Segoe UI', sans-serif"; ctx.fillText(sp.perkName || "—", textX, perkBoxY + 18);
    ctx.fillStyle = "#38d9a9"; ctx.font = "12px 'Segoe UI', sans-serif";
    UI.wrapText(ctx, sp.perkDesc || "", textW).forEach((line, i) => ctx.fillText(line, textX, perkBoxY + 38 + i * 15));
    sy = perkBoxY + 62;

    const equip = [];
    if (sp.bombs > 0) equip.push("初始炸弹 +" + sp.bombs);
    if (sp.wings > 0) equip.push("初始僚机 +" + sp.wings);
    if (equip.length) { ctx.fillStyle = "#dee2e6"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText(equip.join("  ·  "), statX, sy); }
    sy += 26;

    // X5:"必杀技"改名"机型技能"——四个机型效果都不一样了,单独一段说明,别让玩家以为是同一个东西
    // X6:图标直接复用 HUD 里那枚同款 drawSpecialIcon(用户要求"技能放上游戏内技能图案"),而不是另画一套专属图鉴图标
    ctx.fillStyle = "#868e96"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("机型技能", statX, sy);
    const skillBoxY = sy + 14;
    UI.panel(ctx, statX, skillBoxY, boxSize, boxSize, 12, { accent: "#ffd43b" });
    this.drawSpecialIcon(ctx, statX + boxSize / 2, skillBoxY + boxSize / 2, boxSize * 0.75, sp.specialType || "nuke", sp.color);
    const skillTextX = statX + boxSize + 12, skillTextW = statX + statW - skillTextX;
    ctx.fillStyle = "#ffd43b"; ctx.font = "bold 15px 'Segoe UI', sans-serif"; ctx.fillText(sp.specialName || "—", skillTextX, skillBoxY + 18);
    ctx.fillStyle = "#dee2e6"; ctx.font = "12px 'Segoe UI', sans-serif";
    UI.wrapText(ctx, sp.specialDesc || "", skillTextW).forEach((line, i) => ctx.fillText(line, skillTextX, skillBoxY + 38 + i * 15));

    ctx.textAlign = "center";
    UI.button(ctx, this.shipSelectConfirmRect(), { label: selected ? "✓ 使用中" : "选择 USE", color: selected ? "#38d9a9" : "#4dabf7", active: true, font: 20, radius: 14 });
    ctx.fillStyle = "#4a90d9"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText("左右滑动或点击箭头切换机型", cx, CONFIG.HEIGHT - 32);
    ctx.textAlign = "left";
  },

  // ── Z:首页图鉴 —— 上半关卡预览网格(纯展示)+ 下半 BOSS 轮播(左右滑动) ──
  drawCodex(ctx) {
    const cx = CONFIG.WIDTH / 2;
    ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 26px 'Segoe UI', sans-serif"; ctx.fillText("图鉴", cx, 50);
    UI.button(ctx, this.codexBackRect(), { label: "‹ 首页", color: "#adb5bd", font: 15, radius: 10 });
    // OO:图鉴 / 成就 标签切换
    UI.button(ctx, this.codexTabRect(0), { label: "图鉴", color: "#4dabf7", active: this._codexTab === "guide", font: 16, radius: 10 });
    UI.button(ctx, this.codexTabRect(1), { label: "成就", color: "#ffd43b", active: this._codexTab === "achievements", font: 16, radius: 10 });
    if (this._codexTab === "achievements") { this.drawAchievements(ctx); return; }

    // 关卡预览网格:4列 x 3行,共 12 关,纯展示(通关地图去实际进入关卡)
    ctx.textAlign = "left"; ctx.fillStyle = "#868e96"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText("关卡预览", 18, 128); ctx.textAlign = "center";
    const cols = 4, tileW = 120, tileH = 64, gapX = 8, gapY = 10, gridW = cols * tileW + (cols - 1) * gapX, gx0 = (CONFIG.WIDTH - gridW) / 2, gy0 = 138;
    LEVELS.forEach((L, i) => {
      const col = i % cols, row = Math.floor(i / cols), tx = gx0 + col * (tileW + gapX), ty = gy0 + row * (tileH + gapY);
      const pr = Progress.entry(L.id), cleared = !!(pr && pr.cleared);
      // 注意:accent 会喂给 UI.rgba() 做透明度混合,必须是 hex;非 hex 颜色要走 opts.stroke 直接指定,绕开 rgba() 转换
      UI.panel(ctx, tx, ty, tileW, tileH, 10, cleared ? { accent: "#38d9a9" } : { stroke: "rgba(255,255,255,.25)" });
      ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'Segoe UI', sans-serif"; ctx.fillText(L.id, tx + tileW / 2, ty + 26);
      ctx.fillStyle = cleared ? "#38d9a9" : "#868e96"; ctx.font = "11px 'Segoe UI', sans-serif";
      ctx.fillText(cleared ? "✓ " + pr.best : "未通关", tx + tileW / 2, ty + 46);
    });

    // BOSS 图鉴轮播
    const bossAreaY = this.codexBossCardY();
    ctx.textAlign = "left"; ctx.fillStyle = "#868e96"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText("BOSS 图鉴", 18, bossAreaY - 10); ctx.textAlign = "center";
    UI.button(ctx, this.codexArrowRect(-1), { label: "‹", color: "#495057", font: 26, radius: 12 });
    UI.button(ctx, this.codexArrowRect(1), { label: "›", color: "#495057", font: 26, radius: 12 });

    const idx = this._codexBossIdx, def = CONFIG.bosses[idx];
    const cardW = 320, cardH = 246, cardX = cx - cardW / 2, cardY = bossAreaY;
    UI.panel(ctx, cardX, cardY, cardW, cardH, 16, { accent: def.colors[0] });
    fillBossShape(ctx, cx, cardY + 58, 34, def.shape, def.colors[0], idx);
    ctx.fillStyle = def.colors[0]; ctx.font = "bold 22px 'Segoe UI', sans-serif"; ctx.fillText(def.name, cx, cardY + 112);
    ctx.fillStyle = "#dee2e6"; ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillText("HP " + def.hp + "   分值 " + def.score, cx, cardY + 134);
    // X6:攻击方式图标行——一眼看出这只BOSS会用哪些弹幕套路(去重跨所有阶段的 attacks[].type),现代游戏图鉴常见的"技能一览"
    const atkTypes = [...new Set(def.phases.flatMap(p => p.attacks.map(a => a.type)))];
    const atkGap = 34, atkTotalW = (atkTypes.length - 1) * atkGap;
    atkTypes.forEach((t, i) => this.drawAttackIcon(ctx, cx - atkTotalW / 2 + i * atkGap, cardY + 156, 20, t, def.colors[0]));
    const appearIn = bossLevelIds(idx);
    // MM:有出场关卡时这行做成可点击样式(蓝色+下划线),点了跳转地图并高亮
    if (appearIn.length) {
      ctx.fillStyle = "#4dabf7"; ctx.font = "12px 'Segoe UI', sans-serif";
      const label = "出场关卡: " + appearIn.join(", ");
      ctx.fillText(label, cx, cardY + 182);
      const tw = ctx.measureText(label).width;
      ctx.strokeStyle = "#4dabf7"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - tw / 2, cardY + 186); ctx.lineTo(cx + tw / 2, cardY + 186); ctx.stroke();
    } else {
      ctx.fillStyle = "#868e96"; ctx.font = "12px 'Segoe UI', sans-serif"; ctx.fillText("出场关卡: —", cx, cardY + 182);
    }
    ctx.fillStyle = "#ffd43b"; ctx.font = "italic 14px 'Segoe UI', sans-serif"; ctx.fillText("「" + def.taunt + "」", cx, cardY + 210);

    // 圆点指示器
    for (let i = 0; i < CONFIG.bosses.length; i++) {
      const dx = cx + (i - (CONFIG.bosses.length - 1) / 2) * 20, dy = cardY + cardH + 20;
      ctx.beginPath(); ctx.arc(dx, dy, i === idx ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === idx ? def.colors[0] : "rgba(255,255,255,.3)"; ctx.fill();
    }
    ctx.fillStyle = "#4a90d9"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText("左右滑动或点击箭头切换 BOSS", cx, cardY + cardH + 46);
    ctx.textAlign = "left";
  },

  // ── OO:成就列表(图鉴页第二个标签)——纯展示,一屏放得下不用滚动 ──
  drawAchievements(ctx) {
    const cx = CONFIG.WIDTH / 2, rowH = 70, gap = 8, x0 = 20, w = CONFIG.WIDTH - 40;
    let unlockedCount = 0;
    ACHIEVEMENTS.forEach((a, i) => {
      const y = 138 + i * (rowH + gap), unlocked = Achievements.isUnlocked(a.id);
      if (unlocked) unlockedCount++;
      UI.panel(ctx, x0, y, w, rowH, 12, unlocked ? { accent: "#ffd43b", top: "rgba(255,212,59,.1)", bottom: "rgba(255,212,59,.02)" } : { stroke: "rgba(255,255,255,.15)" });
      ctx.textAlign = "center"; ctx.font = "28px 'Segoe UI', sans-serif"; ctx.fillStyle = unlocked ? "#fff" : "rgba(255,255,255,.25)";
      ctx.fillText(unlocked ? a.icon : "🔒", x0 + 40, y + rowH / 2 + 10);
      ctx.textAlign = "left";
      ctx.fillStyle = unlocked ? "#ffd43b" : "#868e96"; ctx.font = "bold 16px 'Segoe UI', sans-serif"; ctx.fillText(a.name, x0 + 76, y + 28);
      ctx.fillStyle = unlocked ? "#dee2e6" : "rgba(255,255,255,.3)"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText(a.desc, x0 + 76, y + 50);
      if (unlocked) { ctx.textAlign = "right"; ctx.fillStyle = "#38d9a9"; ctx.font = "bold 18px 'Segoe UI', sans-serif"; ctx.fillText("✓", x0 + w - 16, y + rowH / 2 + 6); ctx.textAlign = "left"; }
    });
    ctx.textAlign = "center"; ctx.fillStyle = "#868e96"; ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillText("已解锁 " + unlockedCount + " / " + ACHIEVEMENTS.length, cx, 138 + ACHIEVEMENTS.length * (rowH + gap) + 20);
    ctx.textAlign = "left";
  },

  // ── FF:新手引导(左右滑动翻页,和机型选择/图鉴同一套交互手感)──
  drawTutorial(ctx) {
    const cx = CONFIG.WIDTH / 2, n = TUTORIAL_PAGES.length, p = TUTORIAL_PAGES[this._tutorialPage], last = this._tutorialPage >= n - 1;
    ctx.fillStyle = "rgba(0,0,0,.66)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 26px 'Segoe UI', sans-serif"; ctx.fillText("新手引导", cx, 66);
    UI.button(ctx, this.tutorialSkipRect(), { label: "跳过", color: "#adb5bd", font: 15, radius: 10 });
    UI.button(ctx, this.tutorialArrowRect(-1), { label: "‹", color: "#495057", font: 26, radius: 12 });
    UI.button(ctx, this.tutorialArrowRect(1), { label: "›", color: "#495057", font: 26, radius: 12 });

    const cardW = 340, cardH = 340, cardX = cx - cardW / 2, cardY = 220;
    UI.panel(ctx, cardX, cardY, cardW, cardH, 20, { accent: "#4dabf7" });
    ctx.font = "56px 'Segoe UI', sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(p.icon, cx, cardY + 74);
    ctx.fillStyle = "#4dabf7"; ctx.font = "bold 22px 'Segoe UI', sans-serif"; ctx.fillText(p.title, cx, cardY + 118);
    ctx.fillStyle = "#dee2e6"; ctx.font = "15px 'Segoe UI', sans-serif";
    p.lines.forEach((line, i) => ctx.fillText(line, cx, cardY + 160 + i * 30));

    for (let i = 0; i < n; i++) {
      const dx = cx + (i - (n - 1) / 2) * 22, dy = cardY + cardH + 26;
      ctx.beginPath(); ctx.arc(dx, dy, i === this._tutorialPage ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i === this._tutorialPage ? "#4dabf7" : "rgba(255,255,255,.3)"; ctx.fill();
    }
    UI.button(ctx, this.tutorialNextRect(), { label: last ? "开始游戏 START" : "下一步 NEXT", color: "#38d9a9", active: true, font: 20, radius: 14 });
    ctx.textAlign = "left";
  },

  // ── 关卡地图 ──
  // LL:蛇形排布 —— 偶数世界从右到左排,让世界之间的衔接线变成垂直对齐(而不是斜线穿过空白),读起来更像一条连贯路线
  mapNodePos(i) {
    const L = LEVELS[i], reversed = L.world % 2 === 0, col = reversed ? (4 - L.sub) : L.sub;
    return { x: 120 + (col - 1) * 150, y: 360 + (L.world - 1) * 146, r: 38 };
  },
  // WW:基准 y 从 324 改成 360 —— 324 时世界1的战区名(band.y+18=292)比视口裁剪线(mapViewportRect().top=296)还靠上,
  //   每次绘制都会被 ctx.clip() 切掉,标题永远显示不出来;360 让 band.y(310)留出安全余量,不再被裁剪线咬到。
  mapWorldBandRect(world) { const y = 360 + (world - 1) * 146; return { x: 10, y: y - 50, w: CONFIG.WIDTH - 20, h: 122 }; },
  mapRowRect(i, y, count = 3) { const w = 102, gap = 14, total = count * w + (count - 1) * gap, x0 = (CONFIG.WIDTH - total) / 2; return { x: x0 + i * (w + gap), y, w, h: 46 }; },
  mapDiffRect(i) { return this.mapRowRect(i, 118, 3); },
  mapShipRect(i) { return this.mapRowRect(i, 192, CONFIG.shipOrder.length); },
  mapBackRect() { return { x: 20, y: 28, w: 90, h: 36 }; },
  // MM:节点滚动区域 —— top 以下、bottom 以上这段可以纵向拖动;世界数增多超出这段高度时 mapMaxScroll()>0 才会真的动起来
  mapViewportRect() { return { top: 296, bottom: CONFIG.HEIGHT - 6 }; },
  mapContentRange() {
    const worlds = LEVELS.reduce((m, l) => Math.max(m, l.world), 1);
    const top = this.mapWorldBandRect(1), bot = this.mapWorldBandRect(worlds);
    return { top: top.y, bottom: bot.y + bot.h };
  },
  mapMaxScroll() {
    const vp = this.mapViewportRect(), cr = this.mapContentRange();
    return Math.max(0, (cr.bottom - cr.top) - (vp.bottom - vp.top));
  },
  mapPointerDown(px, py) {
    const inR = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    if (inR(this.mapBackRect())) { this.toTitle(); return; }
    const dk = ["easy", "normal", "hard"];
    for (let i = 0; i < 3; i++) if (inR(this.mapDiffRect(i))) { this.setDiff(dk[i]); return; }
    const sk = CONFIG.shipOrder;
    for (let i = 0; i < sk.length; i++) if (inR(this.mapShipRect(i))) { this.setShip(sk[i]); return; }
    // MM:节点区域先记一个拖拽起点,松手时(mapPointerUp)再判断这一下到底是"点关卡"还是"拖动滚动"
    const vp = this.mapViewportRect();
    if (py >= vp.top && py <= vp.bottom) {
      this._mapDragStartX = px; this._mapDragStartY = py; this._mapDragStartScrollY = this._mapScrollY;
      this._mapDragging = true; this._mapDragMoved = false;
    }
  },
  mapPointerMove(px, py) {
    if (!this._mapDragging) return;
    const dy = py - this._mapDragStartY;
    if (Math.abs(dy) > 6) this._mapDragMoved = true;
    this._mapScrollY = clamp(this._mapDragStartScrollY - dy, 0, this.mapMaxScroll());
  },
  mapPointerUp(px, py) {
    if (!this._mapDragging) return;
    this._mapDragging = false;
    if (this._mapDragMoved) return;   // 拖动过了就是滚动手势,不当点击处理
    const pyAdj = py + this._mapScrollY;
    for (let i = 0; i < LEVELS.length; i++) {
      const n = this.mapNodePos(i);
      if (this.isUnlocked(i) && (px - n.x) ** 2 + (pyAdj - n.y) ** 2 <= n.r * n.r) { this.enterLevelFromMap(i, px, py); return; }
    }
  },
  // NN:从地图点击关卡节点进入对局,附带一个从点击处展开的聚焦过渡(替代直接瞬切)
  enterLevelFromMap(i, screenX, screenY) {
    this.startLevel(i);
    this._levelTransX = screenX; this._levelTransY = screenY; this._levelTransT = 0.0001;
  },
  // MM:图鉴 BOSS 卡片点"出场关卡"跳过来时用 —— 定位/高亮/自动滚动到目标关卡
  jumpToLevelFromCodex(bossIdx) {
    const ids = bossLevelIds(bossIdx);
    if (!ids.length) return;
    const idx = LEVELS.findIndex(l => l.id === ids[0]);
    if (idx < 0) return;
    this._mapHighlightId = ids[0]; this._mapHighlightT = 3.0;
    const n = this.mapNodePos(idx), vp = this.mapViewportRect();
    this._mapScrollY = clamp(n.y - (vp.top + (vp.bottom - vp.top) / 2), 0, this.mapMaxScroll());
    this.toMap();
  },
  drawMap(ctx) {
    const cx = CONFIG.WIDTH / 2;
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 30px 'Segoe UI', sans-serif"; ctx.fillText("关卡地图", cx, 60);
    // 返回(现代按钮)
    UI.button(ctx, this.mapBackRect(), { label: "‹ 首页", color: "#adb5bd", font: 15, radius: 10 });
    // 难度选择
    const dk = ["easy", "normal", "hard"];
    ctx.fillStyle = "#868e96"; ctx.font = "12px 'Segoe UI', sans-serif"; ctx.textAlign = "left"; ctx.fillText("难度", this.mapDiffRect(0).x + 2, 108); ctx.textAlign = "center";
    for (let i = 0; i < 3; i++) { const d = CONFIG.difficulties[dk[i]], sel = this.diff.key === dk[i]; UI.button(ctx, this.mapDiffRect(i), { label: d.name.split(" ")[0], sub: sel ? d.desc : "", color: d.color, active: sel, font: 17 }); }
    // 机型选择
    const sk = CONFIG.shipOrder;
    ctx.fillStyle = "#868e96"; ctx.font = "12px 'Segoe UI', sans-serif"; ctx.textAlign = "left"; ctx.fillText("机型", this.mapShipRect(0).x + 2, 182); ctx.textAlign = "center";
    for (let i = 0; i < sk.length; i++) { const sp = CONFIG.ships[sk[i]], sel = this.ship.key === sk[i]; UI.button(ctx, this.mapShipRect(i), { label: sp.name, sub: sel ? sp.desc : "", color: sp.color, active: sel, font: 15 }); }
    ctx.fillStyle = "#868e96"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("选难度 + 机型 → 点亮关卡开始 · 通关解锁下一关", cx, 268);

    // MM:节点区域可纵向滚动(为世界数增多做准备)—— 裁剪到视口并按 _mapScrollY 平移,头部的标题/选难度/选机型不受影响
    const vp = this.mapViewportRect(), scrollY = this._mapScrollY, worldsCount = LEVELS.reduce((m, l) => Math.max(m, l.world), 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, vp.top, CONFIG.WIDTH, vp.bottom - vp.top); ctx.clip();
    ctx.translate(0, -scrollY);

    // LL:每个世界一条主题色底板 + 战区名 + 罗马数字水印,呼应对局内该世界的背景配色,做出"质感"
    const roman = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"];
    for (let w = 1; w <= worldsCount; w++) {
      const band = this.mapWorldBandRect(w), th = CONFIG.themes[(w - 1) % CONFIG.themes.length];
      UI.roundRect(ctx, band.x, band.y, band.w, band.h, 16);
      const bg = ctx.createLinearGradient(band.x, 0, band.x + band.w, 0);
      bg.addColorStop(0, th.band1); bg.addColorStop(1, "rgba(255,255,255,.02)");
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,.12)"; UI.roundRect(ctx, band.x, band.y, band.w, band.h, 16); ctx.stroke();
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "12px 'Segoe UI', sans-serif";
      ctx.fillText(CONFIG.worldIntro[(w - 1) % CONFIG.worldIntro.length], band.x + 16, band.y + 18);
      ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.font = "bold 64px 'Segoe UI', sans-serif";
      ctx.fillText(roman[(w - 1) % roman.length], band.x + band.w - 8, band.y + band.h - 14);
      ctx.textAlign = "center";
    }

    // 连线(同世界横向 + 跨世界衔接;蛇形排布下衔接刚好是竖直线,视觉上像一条连贯路线)+ 沿途小路标点做质感
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 3;
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const a = this.mapNodePos(i), b = this.mapNodePos(i + 1);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      for (let k = 1; k <= 2; k++) { const t = k / 3; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fill(); }
    }
    // 节点(渐变填充 + 发光描边;压轴关卡(sub 3,对应 BOSS)额外一圈警示红环;图鉴跳转过来的目标关卡额外一圈脉动高亮)
    for (let i = 0; i < LEVELS.length; i++) {
      const L = LEVELS[i], n = this.mapNodePos(i), unlocked = this.isUnlocked(i), pr = Progress.entry(L.id);
      const baseColor = !unlocked ? "#495057" : (pr ? "#38d9a9" : "#4dabf7");
      if (L.sub === 3 && unlocked) { ctx.strokeStyle = "rgba(255,80,80,.55)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 7, 0, Math.PI * 2); ctx.stroke(); }
      if (L.id === this._mapHighlightId && this._mapHighlightT > 0) {
        const pulse = 0.5 + Math.abs(Math.sin(this.titleT * 6)) * 0.5;
        ctx.save(); ctx.globalAlpha = Math.min(1, this._mapHighlightT) * pulse; ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 13, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      const grad = ctx.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.3, n.r * 0.1, n.x, n.y, n.r);
      grad.addColorStop(0, UI.rgba(baseColor, unlocked ? 0.5 : 0.3)); grad.addColorStop(1, UI.rgba(baseColor, unlocked ? 0.16 : 0.08));
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = baseColor; ctx.stroke();
      ctx.fillStyle = unlocked ? "#fff" : "#868e96"; ctx.font = "bold 20px 'Segoe UI', sans-serif"; ctx.fillText(unlocked ? L.id : "🔒", n.x, n.y - 2);
      // 星星 = 最高通关难度(简1普2困3;未通关=空星)
      const rank = pr ? (pr.diffRank || 0) : 0;
      ctx.fillStyle = "#ffd43b"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("★".repeat(rank) + "☆".repeat(3 - rank), n.x, n.y + 17);
      // 通关信息:✓ + 最高分 + 通关难度
      if (pr) {
        ctx.fillStyle = "#38d9a9"; ctx.font = "12px 'Segoe UI', sans-serif"; ctx.fillText("✓ " + pr.best, n.x, n.y + n.r + 16);
        ctx.fillStyle = "#868e96"; ctx.font = "10px 'Segoe UI', sans-serif"; ctx.fillText(CONFIG.difficulties[pr.diff].name.split(" ")[0], n.x, n.y + n.r + 30);
      }
    }
    ctx.restore();

    // MM:超出一屏时右侧画一条极简滚动条提示还能往下/往上翻
    const maxScroll = this.mapMaxScroll();
    if (maxScroll > 0) {
      const trackH = vp.bottom - vp.top, thumbH = Math.max(30, trackH * trackH / (trackH + maxScroll)), thumbY = vp.top + (trackH - thumbH) * (scrollY / maxScroll);
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(CONFIG.WIDTH - 8, vp.top, 4, trackH);
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(CONFIG.WIDTH - 8, thumbY, 4, thumbH);
    }
    ctx.textAlign = "left";
  },

  // ── 达标提示:结算 / 继续刷分 ──
  drawCleared(ctx) {
    const cx = CONFIG.WIDTH / 2, L = this.levelDef();
    ctx.fillStyle = "rgba(0,0,0,.68)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd43b"; ctx.font = "bold 46px 'Segoe UI', sans-serif"; ctx.fillText("通关!", cx, 300);
    ctx.fillStyle = "#fff"; ctx.font = "22px 'Segoe UI', sans-serif"; ctx.fillText("关卡 " + L.id + "   当前得分 " + this.score, cx, 350);
    ctx.fillStyle = "#adb5bd"; ctx.font = "15px 'Segoe UI', sans-serif"; ctx.fillText("结算=计入血量与难度加成 · 继续刷分=无尽额外波次", cx, 384);
    // ②自动进入下一关勾选(末关则灰显不可用)
    const isLast = this.currentLevel >= LEVELS.length - 1, chk = this.clearedCheckRect();
    ctx.strokeStyle = isLast ? "#495057" : "#38d9a9"; ctx.lineWidth = 2; ctx.strokeRect(chk.x, chk.y + 6, 24, 24);
    if (this.autoNext && !isLast) { ctx.fillStyle = "#38d9a9"; ctx.font = "bold 20px 'Segoe UI', sans-serif"; ctx.textAlign = "left"; ctx.fillText("✓", chk.x + 5, chk.y + 24); }
    ctx.fillStyle = isLast ? "#868e96" : "#ced4da"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.textAlign = "left";
    ctx.fillText(isLast ? "已是最后一关" : "结算后自动进入下一关", chk.x + 34, chk.y + 24); ctx.textAlign = "center";
    UI.button(ctx, this.clearedMenuRect(0), { label: "结算 SETTLE", color: "#ffd43b", active: true, font: 21 });
    UI.button(ctx, this.clearedMenuRect(1), { label: "继续刷分 FARM", color: "#38d9a9", font: 21 });
    ctx.textAlign = "left";
  },

  // ── 结算界面:血量系数 × 难度系数 ──
  drawSettle(ctx) {
    const cx = CONFIG.WIDTH / 2, L = this.levelDef(), r = this.settleResult || this.computeFinal();
    ctx.fillStyle = "rgba(0,0,0,.78)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    const rank = this.diff.rank;
    ctx.fillStyle = "#ffd43b"; ctx.font = "bold 40px 'Segoe UI', sans-serif"; ctx.fillText("结算", cx, 206);
    ctx.fillStyle = "#adb5bd"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.fillText("关卡 " + L.id + "  难度 " + r.diffName, cx, 238);
    ctx.fillStyle = "#ffd43b"; ctx.font = "22px 'Segoe UI', sans-serif"; ctx.fillText("★".repeat(rank) + "☆".repeat(3 - rank), cx, 268);
    // 明细
    ctx.font = "20px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#dee2e6"; ctx.fillText("本局得分", cx - 110, 320); ctx.textAlign = "right"; ctx.fillText("" + this.easedCount(r.base), cx + 150, 320); ctx.textAlign = "center";
    ctx.fillStyle = "#51cf66"; ctx.fillText("血量加成", cx - 110, 356); ctx.textAlign = "right"; ctx.fillText("×" + r.hpFactor.toFixed(2) + "  (" + Math.round(r.hpRatio * 100) + "% HP)", cx + 150, 356); ctx.textAlign = "center";
    ctx.fillStyle = "#ff922b"; ctx.fillText("难度系数", cx - 110, 392); ctx.textAlign = "right"; ctx.fillText("×" + r.diffFactor.toFixed(2) + "  (" + r.diffName + ")", cx + 150, 392); ctx.textAlign = "center";
    ctx.strokeStyle = "#495057"; ctx.beginPath(); ctx.moveTo(cx - 150, 414); ctx.lineTo(cx + 150, 414); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 30px 'Segoe UI', sans-serif"; ctx.fillText("最终得分  " + this.easedCount(r.final, 1.3), cx, 456);
    ctx.fillStyle = "#38d9a9"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.fillText("最高分 " + Progress.entry(L.id).best + "     最高连击 " + this.maxCombo, cx, 492);
    // 排行榜
    ctx.fillStyle = "#adb5bd"; ctx.font = "17px 'Segoe UI', sans-serif"; ctx.fillText("── 最高分榜 ──", cx, 536);
    let hl = false;
    this.topScores.forEach((e, i) => { const me = !hl && e.score === r.final; if (me) hl = true; ctx.fillStyle = me ? "#ffd43b" : "#dee2e6"; ctx.font = (me ? "bold " : "") + "16px 'Segoe UI', sans-serif"; ctx.fillText((i + 1) + ".   " + e.score + "   " + e.date + (me ? "  ◄" : ""), cx, 564 + i * 26); });
    ctx.fillStyle = "#4a90d9"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("点击返回地图", cx, 564 + this.topScores.length * 26 + 28);
    ctx.textAlign = "left";
  },

  // BOSS 入场警告演出(红色闪烁横幅)
  drawWarning(ctx) {
    const cx = CONFIG.WIDTH / 2, blink = Math.floor(this.warningTimer * 6) % 2 === 0;
    const y = CONFIG.HEIGHT * 0.44;
    ctx.fillStyle = "rgba(255,40,40," + (blink ? 0.22 : 0.10) + ")"; ctx.fillRect(0, y - 44, CONFIG.WIDTH, 88);
    ctx.fillStyle = "#ff3b3b"; ctx.fillRect(0, y - 44, CONFIG.WIDTH, 3); ctx.fillRect(0, y + 41, CONFIG.WIDTH, 3);
    if (blink) {
      ctx.textAlign = "center"; ctx.fillStyle = "#ff6b6b"; ctx.font = "bold 40px 'Segoe UI', sans-serif";
      ctx.fillText("⚠ WARNING ⚠", cx, y - 4);
      ctx.fillStyle = "#ffd43b"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("BOSS 逼近", cx, y + 26);
      ctx.textAlign = "left";
    }
  },

  // ── 设置面板 ──
  settingsRects() {
    const W = CONFIG.WIDTH;
    return {
      sfxVolume:   { x: 110, y: 214, w: 320, h: 24 },   // JJ:音效音量滑轨
      musicVolume: { x: 110, y: 280, w: 320, h: 24 },   // JJ:音乐音量滑轨(独立于音效)
      nextTrack:{ x: W / 2 + 52, y: 318, w: 120, h: 38 },
      sound:    { x: W / 2 - 60, y: 362, w: 120, h: 44 },
      music:    { x: W / 2 - 60, y: 420, w: 120, h: 44 },
      haptics:  { x: W / 2 - 60, y: 478, w: 120, h: 44 },
      hidewings:{ x: W / 2 - 60, y: 536, w: 120, h: 44 },
      controlMode: { x: W / 2 - 80, y: 594, w: 160, h: 44 },   // KK:操作方式(相对拖动/虚拟摇杆)二选一
      exportSave: { x: W / 2 - 130, y: 668, w: 124, h: 44 },   // PP:存档导入导出
      importSave: { x: W / 2 + 6, y: 668, w: 124, h: 44 },
      reset:    { x: W / 2 - 130, y: 728, w: 260, h: 48 },
      back:     { x: W / 2 - 100, y: 786, w: 200, h: 52 },
    };
  },
  setSfxVolumeFromX(px) { const r = this.settingsRects().sfxVolume; Settings.set("sfxVolume", clamp((px - r.x) / r.w, 0, 1)); },
  setMusicVolumeFromX(px) { const r = this.settingsRects().musicVolume; Settings.set("musicVolume", clamp((px - r.x) / r.w, 0, 1)); },
  settingsPointerDown(px, py) {
    const R = this.settingsRects();
    const inR = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    const inSlider = (r) => px >= r.x - 10 && px <= r.x + r.w + 10 && py >= r.y - 16 && py <= r.y + r.h + 16;
    if (inSlider(R.sfxVolume))   { this._sliderDrag = "sfx"; this.setSfxVolumeFromX(px); this._resetArmed = false; return; }
    if (inSlider(R.musicVolume)) { this._sliderDrag = "music"; this.setMusicVolumeFromX(px); this._resetArmed = false; return; }
    if (inR(R.nextTrack)) { this._resetArmed = false; Music.next(); if (Settings.data.music) Music.play(); Sound.powerup(); return; }
    if (inR(R.sound))   { Settings.set("sound", !Settings.data.sound); this._resetArmed = false; return; }
    if (inR(R.music))   { Settings.set("music", !Settings.data.music); if (Settings.data.music) Music.play(); else Music.stop(); this._resetArmed = false; return; }
    if (inR(R.haptics)) { Settings.set("haptics", !Settings.data.haptics); if (Settings.data.haptics) Haptics.buzz(30); this._resetArmed = false; return; }
    if (inR(R.hidewings)) { Settings.set("hideWings", !Settings.data.hideWings); this._resetArmed = false; return; }
    if (inR(R.controlMode)) { Settings.set("controlMode", Settings.data.controlMode === "joystick" ? "drag" : "joystick"); resetJoystick(); this._resetArmed = false; return; }
    if (inR(R.exportSave)) { this._resetArmed = false; window.prompt("复制下面的文本保存存档(设置/进度/排行榜/成就),换设备后用「导入存档」粘贴回来:", SaveData.exportAll()); return; }
    if (inR(R.importSave)) {
      this._resetArmed = false;
      const s = window.prompt("粘贴之前导出的存档文本:", "");
      if (s) { const ok = SaveData.importAll(s); this.topScores = []; Sound.hit(); if (!ok) window.prompt("导入失败,内容不是合法的存档文本(仅供查看,可关闭):", s); }
      return;
    }
    if (inR(R.reset))   {   // 完全重置:需二次确认
      if (this._resetArmed) { Progress.clearAll(); Leaderboard.clearAll(); EndlessBoard.clearAll(); ChallengeHistory.clearAll(); Achievements.clearAll(); this.topScores = []; this._resetArmed = false; Sound.hit(); }
      else this._resetArmed = true;
      return;
    }
    if (inR(R.back))    { this._resetArmed = false; this.state = "title"; return; }
  },
  drawSettings(ctx) {
    const cx = CONFIG.WIDTH / 2, R = this.settingsRects();
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 44px 'Segoe UI', sans-serif"; ctx.fillText("设置", cx, 160);
    // JJ:音效音量 / 音乐音量 —— 两条独立滑轨
    const slider = (r, label, val) => {
      ctx.fillStyle = "#adb5bd"; ctx.font = "20px 'Segoe UI', sans-serif"; ctx.textAlign = "left";
      ctx.fillText(label + "  " + Math.round(val * 100) + "%", r.x, r.y - 16);
      ctx.fillStyle = "#343a40"; ctx.fillRect(r.x, r.y + r.h / 2 - 4, r.w, 8);
      ctx.fillStyle = "#4dabf7"; ctx.fillRect(r.x, r.y + r.h / 2 - 4, r.w * val, 8);
      ctx.beginPath(); ctx.arc(r.x + r.w * val, r.y + r.h / 2, 11, 0, Math.PI * 2); ctx.fill();
    };
    slider(R.sfxVolume, "音效音量", Settings.data.sfxVolume);
    slider(R.musicVolume, "音乐音量", Settings.data.musicVolume);
    ctx.textAlign = "left"; ctx.fillStyle = "#adb5bd"; ctx.font = "15px 'Segoe UI', sans-serif"; ctx.fillText("当前音乐: " + Music.title(), 110, R.nextTrack.y + 25);
    UI.button(ctx, R.nextTrack, { label: "下一首", color: "#4dabf7", active: Settings.data.music, font: 15, radius: 10 });
    // 开关按钮(现代)+ 左侧标签
    const toggle = (r, label, on) => {
      ctx.textAlign = "left"; ctx.fillStyle = "#adb5bd"; ctx.font = "19px 'Segoe UI', sans-serif"; ctx.fillText(label, cx - 200, r.y + r.h / 2 + 6);
      UI.button(ctx, r, { label: on ? "开 ON" : "关 OFF", color: on ? "#38d9a9" : "#868e96", active: on, font: 18, radius: 11 });
    };
    toggle(R.sound, "音效", Settings.data.sound);
    toggle(R.music, "音乐", Settings.data.music);
    toggle(R.haptics, "震动", Settings.data.haptics);
    toggle(R.hidewings, "隐藏僚机", Settings.data.hideWings);   // 开=隐藏
    // KK:操作方式(相对拖动/虚拟摇杆二选一,不是简单开关,复用 UI.button 但自定义文案/配色)
    { const isJoy = Settings.data.controlMode === "joystick", r = R.controlMode;
      ctx.textAlign = "left"; ctx.fillStyle = "#adb5bd"; ctx.font = "19px 'Segoe UI', sans-serif"; ctx.fillText("操作方式", cx - 200, r.y + r.h / 2 + 6);
      UI.button(ctx, r, { label: isJoy ? "虚拟摇杆" : "相对拖动", color: isJoy ? "#ff922b" : "#4dabf7", active: true, font: 16, radius: 11 }); }
    ctx.textAlign = "center"; ctx.fillStyle = "#868e96"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("上次难度会被记住 · 当前:" + CONFIG.difficulties[Settings.data.diff].name, cx, 654);
    // PP:导出/导入存档(弹窗展示/粘贴 JSON 文本,零依赖不用文件下载)
    UI.button(ctx, R.exportSave, { label: "导出存档", color: "#4dabf7", font: 15, radius: 11 });
    UI.button(ctx, R.importSave, { label: "导入存档", color: "#4dabf7", font: 15, radius: 11 });
    // 重置(二次确认)+ 返回
    UI.button(ctx, R.reset, { label: this._resetArmed ? "⚠ 再点一次确认清空" : "重置所有关卡分数", color: "#f03e3e", active: this._resetArmed, font: 18, radius: 12 });
    UI.button(ctx, R.back, { label: "返回 BACK", color: "#adb5bd", font: 20, radius: 13 });
    ctx.textAlign = "left";
  },

  // KK:虚拟摇杆(固定底座 + 跟手指的摇杆头),不按下时底座半透明常驻提示位置,按下时变实并显示摇杆头
  drawJoystick(ctx) {
    const j = CONFIG.joystick, active = input.joystickActive;
    ctx.globalAlpha = active ? 0.5 : 0.22;
    ctx.beginPath(); ctx.arc(j.baseX, j.baseY, j.radius, 0, Math.PI * 2); ctx.fillStyle = "#4dabf7"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.stroke();
    ctx.globalAlpha = active ? 0.9 : 0.45;
    ctx.beginPath(); ctx.arc(input.joyKnobX, input.joyKnobY, j.radius * 0.42, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.globalAlpha = 1;
  },

  // WW:通关进度条顶端的"终点旗"图标 —— 杆 + 三角旗面,纯矢量绘制(不用汉字/emoji,和游戏其它图标风格统一)
  drawFlagIcon(ctx, x, y, size) {
    const poleH = size * 1.4, topY = y - poleH;
    ctx.save();
    ctx.strokeStyle = "#ced4da"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, topY); ctx.stroke();
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x + size * 0.85, topY + size * 0.28); ctx.lineTo(x, topY + size * 0.56); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  // X5:炸弹按钮的精致图标——深色渐变弹体(球面高光做立体感)+ 引信 + 跳动火花,取代原来纯文字"×N"
  drawBombIcon(ctx, x, y, r) {
    const br = r * 0.5, cy = y + r * 0.08;
    ctx.save();
    const g = ctx.createRadialGradient(x - br * 0.35, cy - br * 0.35, br * 0.15, x, cy, br);
    g.addColorStop(0, "#5a5f68"); g.addColorStop(0.6, "#24282e"); g.addColorStop(1, "#0a0c0f");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, br, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(x - br * 0.32, cy - br * 0.32, br * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d9a066"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x + br * 0.3, cy - br * 0.88); ctx.quadraticCurveTo(x + br * 0.85, cy - br * 1.5, x + br * 0.5, cy - br * 1.9); ctx.stroke();
    const sparkA = this.titleT * 6;
    ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(x + br * 0.5, cy - br * 1.9, br * 0.22 + Math.sin(sparkA) * br * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ff922b"; ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + sparkA * 0.5; ctx.beginPath(); ctx.moveTo(x + br * 0.5 + Math.cos(a) * br * 0.32, cy - br * 1.9 + Math.sin(a) * br * 0.32); ctx.lineTo(x + br * 0.5 + Math.cos(a) * br * 0.52, cy - br * 1.9 + Math.sin(a) * br * 0.52); ctx.stroke(); }
    ctx.restore();
  },
  // X5:通用数量气泡徽标(按钮/图标右上角)——原来炸弹数量直接写在图标中心,现在图标本身是造型图案,数字挪到角上的小气泡里
  // X6:泛化出 color 参数,炸弹用红色,后续火力等级/僚机数等也能复用同一视觉语言,不用各画一套
  drawCountBadge(ctx, x, y, n, color = "#e03131") {
    const r = 12;
    ctx.save();
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, r);
    g.addColorStop(0, UI.shade(color, 0.35)); g.addColorStop(1, UI.shade(color, -0.15));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(n), x, y + 0.5);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.restore();
  },
  // X5/X6:机型技能图标——按 specialType 定制,四种机型一眼能分辨是哪种效果,而不是统一写"必杀"两个字。
  //   color 现在直接传具体颜色(取代原来的 dark 布尔开关):HUD 就绪按钮用机型色调暗后的版本(金色底上要够深才看得清),
  //   图鉴/机型选择页的深色玻璃底上直接用机型本色(够亮,不用再压暗)。每种图案都带机型色描边发光+一点轻微待机动画,
  //   呼应用户"继续优化图标"的要求(不是静态死板的线框,而是有一点"活"的细节)。
  drawSpecialIcon(ctx, x, y, r, type, color = "#2b1d00") {
    const s = r * 0.5, t = this.titleT;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    if (type === "shield") {
      ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.85, y - s * 0.45); ctx.lineTo(x + s * 0.85, y + s * 0.25);
      ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.95, x, y + s * 1.05);
      ctx.quadraticCurveTo(x - s * 0.7, y + s * 0.95, x - s * 0.85, y + s * 0.25); ctx.lineTo(x - s * 0.85, y - s * 0.45); ctx.closePath();
      ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s * 0.28, y); ctx.lineTo(x - s * 0.02, y + s * 0.32); ctx.lineTo(x + s * 0.4, y - s * 0.3); ctx.stroke();
    } else if (type === "stealth") {
      const blink = 0.55 + Math.sin(t * 3) * 0.45;   // 呼吸式明暗,呼应"忽隐忽现"
      ctx.globalAlpha = blink;
      ctx.beginPath(); ctx.ellipse(x, y, s * 0.95, s * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(x - s * 1.05, y - s * 0.95); ctx.lineTo(x + s * 1.05, y + s * 0.95); ctx.stroke();
    } else if (type === "wave") {
      const ph = (t * 1.2) % 1;   // 波纹相位缓慢流动,暗示"正在向外扩散"
      for (let i = 1; i <= 3; i++) { ctx.globalAlpha = Math.max(0, 1 - (i - 1) * 0.28 - ph * 0.15); ctx.beginPath(); ctx.arc(x, y + s * 0.55, s * 0.42 * i, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y + s * 0.55, s * 0.16, 0, Math.PI * 2); ctx.fill();
    } else {   // nuke:默认——爆裂星芒,轻微脉动模拟蓄力
      const pulse = 1 + Math.sin(t * 6) * 0.08;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.32, y + Math.sin(a) * s * 0.32); ctx.lineTo(x + Math.cos(a) * s * pulse, y + Math.sin(a) * s * pulse); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, s * 0.32, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
  // X6:机型被动技能图案(和机型技能图标并列展示)——天平(全面均衡)/闪电(狂热连击)/实心装甲板(钢铁装甲)/速度线(灵敏机动)
  //   防御型的被动"装甲"故意用实心图形,和技能"护盾"的线框+勾选图案区分开,不然两个都叫"盾"容易看混
  drawPassiveIcon(ctx, x, y, r, shipKey, color) {
    const s = r * 0.5;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    if (shipKey === "balanced") {
      ctx.beginPath(); ctx.moveTo(x - s * 0.9, y - s * 0.15); ctx.lineTo(x + s * 0.9, y - s * 0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.6); ctx.lineTo(x, y - s * 0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s * 0.32, y - s * 0.75); ctx.lineTo(x + s * 0.32, y - s * 0.75); ctx.lineTo(x, y - s * 1.0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(x - s * 0.9, y + s * 0.3, s * 0.26, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + s * 0.9, y + s * 0.3, s * 0.26, 0, Math.PI * 2); ctx.stroke();
    } else if (shipKey === "attacker") {
      ctx.beginPath(); ctx.moveTo(x + s * 0.15, y - s); ctx.lineTo(x - s * 0.5, y + s * 0.15); ctx.lineTo(x, y + s * 0.15); ctx.lineTo(x - s * 0.15, y + s); ctx.lineTo(x + s * 0.55, y - s * 0.15); ctx.lineTo(x + s * 0.05, y - s * 0.15); ctx.closePath();
      ctx.globalAlpha = 0.22; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    } else if (shipKey === "defender") {
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.8, y - s * 0.4); ctx.lineTo(x + s * 0.8, y + s * 0.25); ctx.lineTo(x, y + s * 1.05); ctx.lineTo(x - s * 0.8, y + s * 0.25); ctx.lineTo(x - s * 0.8, y - s * 0.4); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - s * 0.55, y); ctx.lineTo(x + s * 0.55, y); ctx.stroke();
    } else {   // scout
      for (let i = 0; i < 3; i++) { const dy = (i - 1) * s * 0.5; ctx.globalAlpha = 1 - Math.abs(i - 1) * 0.3; ctx.beginPath(); ctx.moveTo(x - s * 0.9, y + dy - s * 0.15); ctx.lineTo(x + s * 0.7 - Math.abs(i - 1) * s * 0.25, y + dy); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
  // X6:图鉴 BOSS 卡片用的攻击方式小图标——一眼看出这只 BOSS 会用哪些弹幕套路,不用逐字看攻击类型英文名
  drawAttackIcon(ctx, x, y, r, type, color) {
    const s = r * 0.5;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = "round";
    if (type === "fanDown") {
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x, y - s * 0.8); ctx.lineTo(x + i * s * 0.6, y + s * 0.8); ctx.stroke(); }
    } else if (type === "aimed") {
      ctx.beginPath(); ctx.arc(x, y, s * 0.7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    } else if (type === "ring") {
      ctx.beginPath(); ctx.arc(x, y, s * 0.75, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, s * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (type === "spiral") {
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const a = i * 0.55, rr = s * 0.06 * i; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    } else if (type === "wall") {
      for (let i = -1; i <= 1; i++) ctx.strokeRect(x + i * s * 0.7 - s * 0.22, y - s * 0.3, s * 0.44, s * 0.6);
    } else if (type === "laser") {
      ctx.fillRect(x - s * 0.18, y - s * 0.9, s * 0.36, s * 1.8);
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x - s * 0.35, y - s * 0.55); ctx.lineTo(x + s * 0.35, y - s * 0.55); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  drawSecondaryWeaponIcon(ctx, x, y, r, type, color) {
    const s = r * 0.5;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (type === "homing") {
      ctx.beginPath(); ctx.moveTo(x - s * 0.75, y + s * 0.5); ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.9, x + s * 0.55, y - s * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.55, y - s * 0.2); ctx.lineTo(x + s * 0.15, y - s * 0.18); ctx.moveTo(x + s * 0.55, y - s * 0.2); ctx.lineTo(x + s * 0.5, y + s * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - s * 0.78, y + s * 0.56, s * 0.13, 0, Math.PI * 2); ctx.fill();
    } else if (type === "laser") {
      ctx.fillRect(x - s * 0.16, y - s, s * 0.32, s * 2);
      ctx.beginPath(); ctx.moveTo(x, y - s * 1.15); ctx.lineTo(x - s * 0.38, y - s * 0.55); ctx.lineTo(x + s * 0.38, y - s * 0.55); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(x, y - s * 1.05); ctx.lineTo(x + s * 0.42, y + s * 0.55); ctx.lineTo(x, y + s * 0.35); ctx.lineTo(x - s * 0.42, y + s * 0.55); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - s * 0.52, y + s * 0.15); ctx.lineTo(x - s * 0.88, y + s * 0.75); ctx.moveTo(x + s * 0.52, y + s * 0.15); ctx.lineTo(x + s * 0.88, y + s * 0.75); ctx.stroke();
    }
    ctx.restore();
  },
  drawSecondaryHUD(ctx) {
    const p = this.player, s = CONFIG.secondary, oc = p.overcharge || 0;
    const items = [
      { type: "homing", need: s.homingPower, timer: p._homingTimer, interval: Math.max(0.32, s.homingInterval - oc * 0.05), color: "#74c0fc" },
      { type: "laser", need: s.laserPower, timer: p._laserTimer, interval: Math.max(0.55, s.laserInterval - oc * 0.06), color: "#cc5de8" },
      { type: "missile", need: s.missilePower, timer: p._missileTimer, interval: Math.max(0.75, s.missileInterval - oc * 0.04), color: "#ff922b" },
    ];
    const y = 160, r = 16, gap = 44;
    items.forEach((it, i) => {
      const x = 32 + i * gap, unlocked = p.power >= it.need, ready = unlocked && it.timer <= 0;
      const ratio = unlocked ? 1 - clamp(it.timer / it.interval, 0, 1) : 0;
      UI.roundButton(ctx, x, y, r, ready ? it.color : "#495057", { alpha: unlocked ? (ready ? 0.85 : 0.55) : 0.28, lineWidth: 1.5, stroke: ready ? UI.rgba(it.color, 0.85) : "rgba(255,255,255,.25)" });
      this.drawSecondaryWeaponIcon(ctx, x, y, r * 0.85, it.type, unlocked ? "#fff" : "#adb5bd");
      if (unlocked && !ready) UI.bar(ctx, x - r, y + r + 6, r * 2, 5, ratio, "#868e96", it.color, {});
      if (!unlocked) this.drawCountBadge(ctx, x + r * 0.62, y - r * 0.62, it.need, "#495057");
    });
  },
  // X6:火力等级图标——两道叠放的上箭头("升级/增幅"的通用视觉语言),配合 drawCountBadge 显示具体等级数字
  drawPowerIcon(ctx, x, y, r) {
    const s = r * 0.5;
    ctx.save(); ctx.fillStyle = "#38d9a9"; ctx.shadowColor = "#38d9a9"; ctx.shadowBlur = 4;
    for (let i = 0; i < 2; i++) {
      const oy = y + s * 0.3 - i * s * 0.55;
      ctx.beginPath(); ctx.moveTo(x - s * 0.75, oy + s * 0.4); ctx.lineTo(x, oy - s * 0.3); ctx.lineTo(x + s * 0.75, oy + s * 0.4); ctx.lineTo(x + s * 0.45, oy + s * 0.4); ctx.lineTo(x, oy + s * 0.05); ctx.lineTo(x - s * 0.45, oy + s * 0.4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  drawThreatHUD(ctx) {
    const t = CONFIG.threat, lvl = this.threatLevel(), maxed = lvl >= t.maxLevel;
    const x = 200, y = 42, w = 150, h = 8;
    const ratio = maxed ? 1 : clamp((this.threat - lvl * t.perLevel) / t.perLevel, 0, 1);
    const color = lvl >= 4 ? "#ff6b6b" : lvl >= 2 ? "#ffd43b" : "#74c0fc";
    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = color; ctx.font = "bold 12px 'Segoe UI', sans-serif";
    ctx.fillText("威胁 Lv." + lvl + "  ×" + this.threatScoreMult().toFixed(2), x, y - 5);
    UI.bar(ctx, x, y, w, h, ratio, color, color, { glow: lvl >= 3, glowColor: color, glowBlur: 8 });
    ctx.restore();
  },
  drawChipHUD(ctx) {
    const active = CONFIG.chipOrder.filter(k => this.chips[k] > 0);
    if (!active.length) return;
    let x = 16, y = 202;
    ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = "bold 12px 'Segoe UI', sans-serif";
    for (const key of active) {
      const c = CONFIG.chips[key], text = c.name + " " + Math.ceil(this.chips[key]) + "s";
      const w = Math.max(82, ctx.measureText(text).width + 18);
      ctx.fillStyle = "rgba(8, 16, 28, .68)"; UI.roundRect(ctx, x, y - 12, w, 24, 8); ctx.fill();
      ctx.strokeStyle = UI.rgba(c.color, .75); ctx.lineWidth = 1.2; UI.roundRect(ctx, x, y - 12, w, 24, 8); ctx.stroke();
      ctx.fillStyle = c.color; ctx.fillText(text, x + 9, y + 1);
      x += w + 8;
      if (x > CONFIG.WIDTH - 120) { x = 16; y += 28; }
    }
    ctx.restore();
  },
  drawChallengeHUD(ctx) {
    const target = this.targetChallengeSplit();
    if (!target) return;
    const current = Math.round(this.score * this.activeDiff.scoreMult), delta = current - target.score;
    const text = "影子 " + target.t + "s " + target.score + " · " + (delta >= 0 ? "+" : "") + delta;
    const x = CONFIG.WIDTH / 2, y = this.boss ? 96 : 64;
    ctx.save();
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    const w = Math.min(CONFIG.WIDTH - 56, ctx.measureText(text).width + 22), h = 24;
    ctx.fillStyle = "rgba(8, 16, 28, .72)"; UI.roundRect(ctx, x - w / 2, y - h + 4, w, h, 8); ctx.fill();
    ctx.strokeStyle = delta >= 0 ? "rgba(56,217,169,.78)" : "rgba(255,212,59,.78)";
    ctx.lineWidth = 1.2; UI.roundRect(ctx, x - w / 2, y - h + 4, w, h, 8); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = delta >= 0 ? "#38d9a9" : "#ffd43b"; ctx.fillText(text, x, y - 4);
    ctx.restore();
  },
  drawHUD(ctx) {
    ctx.fillStyle = "#e9ecef"; ctx.font = "20px 'Segoe UI', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("得分 " + this.score, 16, 30);
    // X6:火力等级从纯文字"火力 Lv.N"改成图标+气泡徽标,和炸弹按钮统一"图标+数字气泡"的视觉语言
    this.drawPowerIcon(ctx, 24, 55, 30);
    this.drawCountBadge(ctx, 40, 40, this.player.overcharge > 0 ? this.player.power + "+" + this.player.overcharge : this.player.power, this.player.overcharge > 0 ? "#74c0fc" : "#38d9a9");
    ctx.fillStyle = "#adb5bd"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.fillText(this.endless ? "无尽 " + Math.floor(this._endlessT) + "s" : "关卡 " + this.levelDef().id, 200, 28);
    this.drawThreatHUD(ctx);
    this.drawChallengeHUD(ctx);

    // AA:HP 血条 —— 更大更醒目:渐变(绿→黄→红)+ 底槽玻璃质感 + 掉血残影 + 危险脉动发光 + 图标
    const hpW = 190, hpH = 18, hpX = CONFIG.WIDTH - hpW - 16, hpY = 14;
    const hpRatio = clamp(this.player.hp / this.player.maxHp, 0, 1), danger = hpRatio <= 0.25;
    const hpPulse = danger ? 0.55 + Math.abs(Math.sin(this.titleT * 6)) * 0.45 : 1;
    const hpColor = hpRatio > 0.55 ? "#51cf66" : hpRatio > 0.25 ? "#ffd43b" : "#ff4d4f";
    // 图标(医疗十字,与道具里的血包图标呼应)
    const ix = hpX - 22, iy = hpY + hpH / 2;
    ctx.fillStyle = danger ? "#ff4d4f" : "#e03131"; ctx.beginPath(); ctx.arc(ix, iy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(ix - 1.6, iy - 5.5, 3.2, 11); ctx.fillRect(ix - 5.5, iy - 1.6, 11, 3.2);
    UI.bar(ctx, hpX, hpY, hpW, hpH, hpRatio, hpColor, danger ? "#ff8787" : hpColor, { glow: danger, glowColor: "#ff3b3b", glowBlur: 14, pulse: hpPulse, trailRatio: this._hpTrailRatio });
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(Math.ceil(this.player.hp) + "/" + this.player.maxHp, hpX + hpW / 2, hpY + hpH / 2 + 1);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    // 危险时屏幕边缘轻微红色脉动警示,配合血条一起提醒
    if (danger) { ctx.save(); ctx.globalAlpha = 0.35 * hpPulse; const vg = ctx.createRadialGradient(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.35, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.72); vg.addColorStop(0, "rgba(255,0,0,0)"); vg.addColorStop(1, "rgba(255,0,0,.5)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT); ctx.restore(); }

    // ①通关进度(右侧竖条,自下而上;刷分/无尽不显示)
    if (!this.farming && !this.endless && director.script) {
      const pr = clamp(director.cursor / Math.max(1, director.script.length - 1), 0, 1);
      const bx = CONFIG.WIDTH - 9, y0 = 152, y1 = CONFIG.HEIGHT - 150, bh = y1 - y0;
      ctx.fillStyle = "#2b2b2b"; ctx.fillRect(bx, y0, 4, bh);
      ctx.fillStyle = this.boss ? "#f03e3e" : "#4dabf7"; ctx.fillRect(bx, y1 - bh * pr, 4, bh * pr);
      ctx.fillStyle = "#fff"; ctx.fillRect(bx - 3, y1 - bh * pr - 1, 10, 2);
      // WW:原来用汉字"旗"当终点图标,和游戏里其它全绘图标风格不统一;改成杆+三角旗面的矢量小图标
      this.drawFlagIcon(ctx, bx + 2, y0 - 4, 12);
    }
    if (this.combo >= 2) {
      ctx.save(); ctx.shadowColor = "rgba(255,212,59,.7)"; ctx.shadowBlur = 8;
      ctx.fillStyle = "#ffd43b"; ctx.font = "bold 22px 'Segoe UI', sans-serif"; ctx.fillText(this.combo + " COMBO  ×" + this.comboMult().toFixed(2), 16, 88);
      ctx.restore();
      UI.bar(ctx, 16, 94, 150, 9, this.comboTimer / CONFIG.combo.timeout, "#ffd43b", "#ff922b", {});
    }

    // B:必杀能量条 —— 紫→金渐变,满能量时发光脉动 + 图标
    const enW = 190, enH = 14, enX = 16, enY = 112, enR = clamp(this.player.energy / 100, 0, 1), enFull = this.player.energy >= 100;
    const enPulse = enFull ? 0.55 + Math.abs(Math.sin(this.titleT * 5)) * 0.45 : 1;
    UI.bar(ctx, enX, enY, enW, enH, enR, "#845ef7", enFull ? "#ffd43b" : "#cc5de8", { glow: enFull, glowColor: "#ffd43b", glowBlur: 12, pulse: enPulse });
    // X4:必杀能量现在除了击杀也会随时间被动缓慢回复,加一道持续扫过已填充部分的柔光,提示"没打到东西也在悄悄涨"
    if (enR > 0.001 && !enFull) {
      ctx.save();
      ctx.beginPath(); ctx.rect(enX, enY, enW * enR, enH); ctx.clip();
      const sweepX = enX + ((this.titleT * 55) % (enW + 30)) - 30;
      const sg = ctx.createLinearGradient(sweepX, 0, sweepX + 22, 0);
      sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,.4)"); sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg; ctx.fillRect(enX, enY, enW, enH);
      ctx.restore();
    }
    ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.moveTo(enX + enW + 20, enY - 3); ctx.lineTo(enX + enW + 14, enY + enH / 2 + 1); ctx.lineTo(enX + enW + 19, enY + enH / 2 + 1); ctx.lineTo(enX + enW + 13, enY + enH + 4); ctx.lineTo(enX + enW + 24, enY + enH / 2 - 3); ctx.lineTo(enX + enW + 18, enY + enH / 2 - 3); ctx.closePath(); ctx.fill();
    // X4:就绪时显示机型专属技能名字(而不是统一的"机型技能"),呼应四种机型四套不同效果
    const specName = this.player.ship.specialName || "机型技能";
    ctx.fillStyle = enFull ? "#ffd43b" : "#adb5bd"; ctx.font = "bold 12px 'Segoe UI', sans-serif"; ctx.fillText(enFull ? specName + " · 就绪" : "机型技能", enX, enY + enH + 14);
    this.drawSecondaryHUD(ctx);
    this.drawChipHUD(ctx);

    // BOSS 血条 —— 渐变发光 + 阶段分隔刻度 + 狂暴提示
    if (this.boss) {
      const bw = CONFIG.WIDTH - 40, bx = 20, by = 68, bh = 13, br = clamp(this.boss.hp / this.boss.maxHp, 0, 1), bcol = this.boss.def.colors[this.boss.phaseIndex];
      UI.bar(ctx, bx, by, bw, bh, br, bcol, UI.rgba(bcol, .7), { glow: true, glowColor: bcol, glowBlur: 10, pulse: this.boss._enraged ? (0.6 + Math.abs(Math.sin(this.titleT * 8)) * 0.4) : 1 });
      this.boss.def.phases.forEach(p => { if (p.until > 0) { const tx = bx + bw * p.until; ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(tx - 1, by + 2, 2, bh - 4); } });
      ctx.fillStyle = this.boss._enraged ? "#ff3b3b" : "#ff8787"; ctx.font = "bold 13px 'Segoe UI', sans-serif"; ctx.textAlign = "right";
      ctx.fillText((this.boss._enraged ? "⚠ 狂暴 · " : "") + "BOSS  " + this.boss.def.name, CONFIG.WIDTH - 20, by - 5); ctx.textAlign = "left";
    }

    // AA:HUD 圆形按钮统一走玻璃质感 roundButton
    // X5:炸弹按钮改精致图标(深色弹体+引信+火花),数量从图标中心的"×N"文字挪到右上角的小气泡徽标
    const b = this.bombBtn;
    ctx.globalAlpha = this.player.bombs > 0 ? 1 : 0.35;
    UI.roundButton(ctx, b.x, b.y, b.r, "#cc5de8");
    this.drawBombIcon(ctx, b.x, b.y, b.r);
    ctx.globalAlpha = 1;
    if (this.player.bombs > 0) this.drawCountBadge(ctx, b.x + b.r * 0.62, b.y - b.r * 0.62, this.player.bombs);
    // 暂停按钮(⏸ 双竖条)—— X6:圆角化 + 渐变 + 柔光,和炸弹/机型技能图标同一套精致度,不再是两个裸 fillRect
    const pb = this.pauseBtn;
    UI.roundButton(ctx, pb.x, pb.y, pb.r, "#495057", { stroke: "rgba(255,255,255,.45)" });
    ctx.save(); ctx.shadowColor = "rgba(255,255,255,.4)"; ctx.shadowBlur = 4;
    const pauseG = ctx.createLinearGradient(0, pb.y - 12, 0, pb.y + 12);
    pauseG.addColorStop(0, "#fff"); pauseG.addColorStop(1, "#dee2e6");
    ctx.fillStyle = pauseG;
    UI.roundRect(ctx, pb.x - 9, pb.y - 12, 6, 24, 2); ctx.fill();
    UI.roundRect(ctx, pb.x + 3, pb.y - 12, 6, 24, 2); ctx.fill();
    ctx.restore();
    // B:机型技能按钮(能量满才显示;冷却结束前显示剩余秒数,冷却结束后才高亮可点)
    // X5:就绪态图标按 ship.specialType 定制(爆裂星芒/护盾/隐身斜杠眼/波纹),不再统一写"必杀"两个字
    if (this.player.energy >= 100) {
      const sb = this.specialBtn, ready = this.player.specialCooldown <= 0;
      if (ready) {
        const pulse = 0.6 + Math.abs(Math.sin(this.titleT * 5)) * 0.4;
        UI.roundButton(ctx, sb.x, sb.y, sb.r, "#ffd43b", { alpha: pulse });
        // X6:图标颜色改用机型本色压暗后的版本(而不是固定的深棕色),金色底上仍然够清楚,但能一眼看出"这是这台机的颜色"
        this.drawSpecialIcon(ctx, sb.x, sb.y, sb.r, this.player.ship.specialType || "nuke", UI.shade(this.player.ship.color, -0.5));
      } else {
        UI.roundButton(ctx, sb.x, sb.y, sb.r, "#495057", { alpha: 0.7 });
        ctx.fillStyle = "#dee2e6"; ctx.font = "bold 17px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.ceil(this.player.specialCooldown) + "", sb.x, sb.y + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      }
    }
    // 刷分模式:结算按钮 + 提示
    if (this.farming) {
      const sb = this.settleBtn;
      UI.roundButton(ctx, sb.x, sb.y, sb.r, "#ffd43b");
      ctx.fillStyle = "#2b1d00"; ctx.font = "bold 15px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("结算", sb.x, sb.y + 1);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#38d9a9"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("✓ 通关 · 刷分 " + this.score + "/" + Math.round(this._clearScore * CONFIG.scoring.farmScoreCapMult), 200, 56);
    }
  },

  drawEndScreen(ctx, title, color) {
    const cx = CONFIG.WIDTH / 2;
    ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = color; ctx.font = "42px 'Segoe UI', sans-serif"; ctx.fillText(title, cx, 300);
    ctx.fillStyle = "#adb5bd"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.fillText("难度 " + this.diff.name, cx, 332);
    ctx.fillStyle = "#fff"; ctx.font = "22px 'Segoe UI', sans-serif"; ctx.fillText("本局得分 " + this.easedCount(this.score), cx, 366);
    ctx.fillStyle = "#ffd43b"; ctx.font = "16px 'Segoe UI', sans-serif"; ctx.fillText("最高连击 " + this.maxCombo, cx, 392);
    ctx.fillStyle = "#adb5bd"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("── 最高分榜 ──", cx, 440);
    let highlighted = false;
    this.topScores.forEach((e, i) => {
      const isMe = !highlighted && e.score === this.score; if (isMe) highlighted = true;
      ctx.fillStyle = isMe ? "#ffd43b" : "#dee2e6"; ctx.font = (isMe ? "bold " : "") + "18px 'Segoe UI', sans-serif";
      ctx.fillText((i + 1) + ".   " + e.score + "      " + e.date + (isMe ? "  ◄" : ""), cx, 472 + i * 30);
    });
    ctx.fillStyle = "#4a90d9"; ctx.font = "18px 'Segoe UI', sans-serif"; ctx.fillText("点击返回地图", cx, 472 + this.topScores.length * 30 + 30);
    ctx.textAlign = "left";
  },
};
