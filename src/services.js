"use strict";

/* =====================================================================
 * 1.5) 音效钩子(WebAudio 合成)
 * ===================================================================== */
const Sound = {
  enabled: true, volume: 1, ctx: null, noiseBuf: null,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    const n = Math.floor(this.ctx.sampleRate * 0.5), buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },
  resume() { this.init(); if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
  tone(freq, dur, type, gain, glideTo) {
    if (!this.enabled || !this.ctx || this.volume <= 0) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(gain * this.volume, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur);
  },
  noise(dur, gain, fromFreq) {
    if (!this.enabled || !this.ctx || this.volume <= 0) return;
    const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    s.buffer = this.noiseBuf; f.type = "lowpass"; f.frequency.setValueAtTime(fromFreq || 1500, t); f.frequency.exponentialRampToValueAtTime(200, t + dur);
    g.gain.setValueAtTime(gain * this.volume, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.ctx.destination); s.start(t); s.stop(t + dur);
  },
  shoot()      { this.tone(880, 0.03, "square", 0.012); },
  homing()     { this.tone(1180, 0.045, "triangle", 0.018, 760); },
  laser()      { this.tone(520, 0.08, "sawtooth", 0.04, 980); this.tone(1560, 0.05, "triangle", 0.018, 940); },
  missile()    { this.noise(0.12, 0.055, 700); this.tone(150, 0.10, "sawtooth", 0.045, 95); },
  missileHit() { this.noise(0.24, 0.22, 1300); this.tone(110, 0.18, "sawtooth", 0.08, 48); },
  // GG:按敌机体型分级的爆炸音色 —— 小的短促尖锐,大的低沉更有分量
  explosion(tier) {
    if (tier === "large") { this.noise(0.42, 0.32, 900); this.tone(90, 0.35, "sawtooth", 0.16, 40); }
    else if (tier === "medium") { this.noise(0.32, 0.27, 1200); this.tone(130, 0.22, "sawtooth", 0.14, 50); }
    else this.noise(0.2, 0.2, 1900);
  },
  hit()        { this.tone(160, 0.15, "sawtooth", 0.18, 70); },
  powerup()    { this.tone(520, 0.08, "square", 0.14); this.tone(780, 0.10, "square", 0.12); },
  bomb()       { this.noise(0.5, 0.4, 2600); this.tone(120, 0.5, "sawtooth", 0.2, 40); },
  bossDefeat() { this.noise(0.7, 0.35, 1800); this.tone(300, 0.7, "square", 0.2, 60); },
  start()      { this.tone(440, 0.08, "square", 0.12); this.tone(660, 0.10, "square", 0.12); },
};

/* =====================================================================
 * 1.52) BGM(M)—— 用户提供的轮播音乐
 * ===================================================================== */
const Music = {
  tracks: [
    { src: "assets/audio/above-the-sprawl.mp3", title: "Above the Sprawl" },
    { src: "assets/audio/skyward-raid-bgm-02.m4a", title: "Skyward Raid BGM 02" },
  ],
  index: 0, playing: false, enabled: true, volume: 0.8, gain: 0.55, fade: 2.2, track: null,
  playPending: false, autoplayBlocked: false,
  init() {
    if (this.track || typeof Audio === "undefined") return;
    this.load(this.index);
  },
  load(index, autoplay) {
    if (typeof Audio === "undefined") return;
    if (this.track) { this.track.pause(); this.track.onended = null; }
    this.playPending = false; this.autoplayBlocked = false;
    this.index = (index + this.tracks.length) % this.tracks.length;
    this.track = new Audio(this.tracks[this.index].src);
    this.track.loop = false; this.track.preload = "auto"; this.track.onended = () => this.next();
    this.applyVolume();
    if (autoplay) this.resume();
  },
  title() {
    return (this.tracks[this.index] && this.tracks[this.index].title) || "BGM";
  },
  next() {
    this.load(this.index + 1, this.playing && this.enabled && this.volume > 0);
  },
  envelope() {
    if (!this.track || this.fade <= 0) return 1;
    const t = this.track.currentTime || 0, d = this.track.duration, fadeIn = clamp(t / this.fade, 0, 1);
    const fadeOut = Number.isFinite(d) ? clamp((d - t) / this.fade, 0, 1) : 1;
    return Math.min(fadeIn, fadeOut);
  },
  applyVolume() { if (this.track) this.track.volume = this.enabled ? clamp(this.volume * this.gain * this.envelope(), 0, 1) : 0; },
  play() { this.playing = true; this.init(); this.applyVolume(); this.resume(); },
  stop() { this.playing = false; if (this.track) this.track.pause(); },
  resume(force) {
    if (!this.playing || !this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.track) return;
    if (this.playPending && !force) return;
    if (force) this.playPending = false;
    this.autoplayBlocked = false;
    const p = this.track.play();
    if (p && p.then) {
      this.playPending = true;
      p.then(() => { this.playPending = false; }).catch(() => { this.playPending = false; this.autoplayBlocked = true; });
    }
  },
  update() {
    this.init();
    this.applyVolume();
    if (!this.playing || !this.enabled || this.volume <= 0) { if (this.track && !this.track.paused) this.track.pause(); return; }
    if (this.track && this.track.paused && !this.autoplayBlocked) this.resume();
  },
};

/* =====================================================================
 * 1.55) 震动反馈钩子(navigator.vibrate;仅部分手机支持,不支持自动无视)
 *       想调震感强度就改各函数的时长/节奏数组。V 键可开关。
 * ===================================================================== */
const Haptics = {
  enabled: true,
  buzz(pattern) { if (this.enabled && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); },
  hit()        { this.buzz(60); },
  bomb()       { this.buzz([0, 45, 30, 45]); },
  bossDefeat() { this.buzz([0, 90, 40, 130]); },
  powerup()    { this.buzz(20); },
};

/* =====================================================================
 * 1.57) 设置(localStorage 持久化:音量 / 音效 / 震动 / 上次难度)
 * ===================================================================== */
const Settings = {
  key: "kzts_settings",
  // JJ:音效/音乐拆成独立音量+独立开关(原来共用一个 volume,音乐音效没法分别调)
  data: { sfxVolume: 0.8, musicVolume: 0.7, sound: true, music: true, haptics: true, diff: "normal", ship: "balanced", autoNext: true, hideWings: false, seenTutorial: false, controlMode: "drag" },
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(this.key));
      if (s) {
        // JJ:旧存档只有单一 volume 字段,迁移到新的 sfxVolume/musicVolume,避免老玩家音量突然被清零
        if (s.volume != null && s.sfxVolume == null) s.sfxVolume = s.volume;
        if (s.volume != null && s.musicVolume == null) s.musicVolume = s.volume;
        Object.assign(this.data, s);
      }
    } catch (e) {}
    this.apply();
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  apply() { Sound.enabled = this.data.sound; Sound.volume = this.data.sfxVolume; Music.enabled = this.data.music; Music.volume = this.data.musicVolume; Haptics.enabled = this.data.haptics; },
  set(k, v) { this.data[k] = v; this.apply(); this.save(); },
};

/* =====================================================================
 * 1.58) 关卡进度(localStorage:每关是否通关 / 最高分 / 通关难度)
 * ===================================================================== */
const Progress = {
  key: "kzts_progress", data: {},
  load() { try { this.data = JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { this.data = {}; } },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  // 星数 = 最高通关难度 rank(简单1/普通2/困难3);高难度过关不会被低难度降级
  record(id, score, diffKey, rank) {
    const p = this.data[id] || { best: 0, diffRank: 0, diff: null, cleared: false };
    p.cleared = true;
    if (score > p.best) p.best = score;
    if (rank > (p.diffRank || 0)) { p.diffRank = rank; p.diff = diffKey; }
    this.data[id] = p; this.save();
  },
  entry(id) { return this.data[id] || null; },
  isCleared(id) { const p = this.data[id]; return !!(p && p.cleared); },
  clearAll() { this.data = {}; this.save(); },
};

/* =====================================================================
 * 1.6) 分数排行(localStorage,file:// 不可用时回退内存)
 *      Q:按关卡 id 分开存放,排行榜只显示当前关卡的排行情况。
 * ===================================================================== */
const Leaderboard = {
  key: "kzts_scores", max: 5, _mem: {},
  loadAll() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return this._mem; } },
  saveAll(all) { try { localStorage.setItem(this.key, JSON.stringify(all)); } catch (e) { this._mem = all; } },
  load(id) { return this.loadAll()[id] || []; },
  submit(id, score) {
    const all = this.loadAll(), l = all[id] || [];
    l.push({ score: score, date: new Date().toISOString().slice(0, 10) });
    l.sort((a, b) => b.score - a.score);
    const top = l.slice(0, this.max); all[id] = top; this.saveAll(all); return top;
  },
  clearAll() { try { localStorage.removeItem(this.key); } catch (e) {} this._mem = {}; },
};

const Challenge = {
  prefix: "SR2077-",
  todayKey() {
    const d = new Date(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return String(d.getFullYear()) + m + day;
  },
  dailySeed() { return "DAILY-" + this.todayKey(); },
  randomSeed() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const n = Math.floor(Math.random() * 0x1000000).toString(36).toUpperCase().padStart(5, "0");
    return "RAID-" + d + "-" + n;
  },
  hash(seed) {
    let h = 2166136261;
    const s = String(seed || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },
  rng(seed) {
    let a = this.hash(seed) || 1;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  rulesVersion() {
    return (CONFIG.challenge && CONFIG.challenge.rulesVersion) || 1;
  },
  routeSignature(seed, rulesVersion) {
    const e = CONFIG.endless || {}, spawn = e.spawn || {}, boss = e.boss || {};
    const splits = CONFIG.challenge && CONFIG.challenge.splits ? CONFIG.challenge.splits : [30, 60, 120];
    const parts = [
      "route-v1", seed || "", rulesVersion || this.rulesVersion(), e.diffKey || "", e.maxEnemies || 0,
      e.worldInterval || 40, e.powerupChance || 0,
      [e.startingDrafts, e.enemyHpBaseMult, e.enemyHpRampTime, e.enemyHpRampMult, e.dmgRampTime, e.dmgRampMult].join(","),
      [spawn.initialDelay, spawn.intervalBase, spawn.intervalDecay, spawn.intervalMin, spawn.countBase, spawn.countStepSec, spawn.countStepMax].join(","),
      [boss.firstDelay, boss.interval, boss.baseHpMult, boss.hpStep, boss.hpStepMax].join(","),
      splits.join(","),
    ];
    const r = this.rng(parts.join("|")), probes = [];
    for (let i = 0; i < 12; i++) probes.push(Math.floor(r() * 65536).toString(36));
    return this.hash(parts.join("|") + "|" + probes.join(",")).toString(36).toUpperCase().padStart(6, "0").slice(-6);
  },
  routeStatus(payload) {
    const local = this.routeSignature(payload && payload.seed, payload && payload.rules);
    const code = String((payload && payload.sig) || local).toUpperCase().slice(0, 8);
    return { code, local, ok: code === local };
  },
  cleanSplits(splits) {
    if (!Array.isArray(splits)) return [];
    const max = CONFIG.challenge && CONFIG.challenge.splits ? CONFIG.challenge.splits.length : 3;
    return splits.map(s => ({ t: Math.floor(Number(s.t) || 0), score: Math.max(0, Math.round(Number(s.score) || 0)) })).filter(s => s.t > 0).slice(0, max);
  },
  encode(run) {
    const splits = this.cleanSplits(run.splits);
    const seed = String(run.seed || this.randomSeed()), rules = run.rulesVersion || run.rules || this.rulesVersion();
    const payload = {
      v: 1,
      mode: "endless",
      seed,
      ship: run.ship || "balanced",
      score: run.score || 0,
      time: run.time || 0,
      combo: run.combo || 0,
      rules,
      sig: run.sig || this.routeSignature(seed, rules),
    };
    if (splits.length) payload.splits = splits;
    const raw = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    return this.prefix + raw;
  },
  decode(text) {
    try {
      let raw = String(text || "").trim();
      if (!raw) return null;
      if (raw.startsWith(this.prefix)) raw = raw.slice(this.prefix.length);
      raw = raw.replace(/-/g, "+").replace(/_/g, "/");
      while (raw.length % 4) raw += "=";
      const payload = JSON.parse(atob(raw));
      if (!payload || payload.v !== 1 || payload.mode !== "endless" || !payload.seed) return null;
      payload.rules = payload.rules || 1;
      payload.splits = this.cleanSplits(payload.splits);
      const route = this.routeStatus(payload);
      payload.sig = route.code; payload.localSig = route.local; payload.sigOk = route.ok;
      return payload;
    } catch (e) {
      return null;
    }
  },
};

const ChallengeHistory = {
  key: "kzts_challenges", max: 8, _mem: [],
  id(seed, ship) { return String(seed || "") + "|" + String(ship || "balanced"); },
  load() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { return this._mem; } },
  saveList(list) { try { localStorage.setItem(this.key, JSON.stringify(list)); } catch (e) { this._mem = list; } },
  best(seed, ship) { return this.load().find(r => r.id === this.id(seed, ship)) || null; },
  submit(run) {
    const list = this.load(), id = this.id(run.seed, run.ship), ts = new Date().toISOString();
    let entry = list.find(r => r.id === id);
    if (!entry) { entry = { id, seed: run.seed, ship: run.ship, score: 0, time: 0, combo: 0, attempts: 0, ts }; list.unshift(entry); }
    entry.attempts = (entry.attempts || 0) + 1; entry.ts = ts; entry.lastScore = run.score; entry.lastTime = run.time; entry.lastCode = run.code || entry.lastCode;
    entry.lastSplits = Challenge.cleanSplits(run.splits);
    entry.daily = !!run.daily;
    if (run.score >= (entry.score || 0)) { entry.score = run.score; entry.time = run.time; entry.combo = run.combo; entry.splits = entry.lastSplits; entry.code = run.code || entry.code; entry.date = ts.slice(0, 10); }
    list.sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")));
    this.saveList(list.slice(0, this.max));
    return entry;
  },
  clearAll() { try { localStorage.removeItem(this.key); } catch (e) {} this._mem = []; },
};

// F:无尽模式独立排行榜
const EndlessBoard = {
  key: "kzts_endless", max: 5, _mem: [],
  load() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { return this._mem; } },
  saveList(list) { try { localStorage.setItem(this.key, JSON.stringify(list)); } catch (e) { this._mem = list; } },
  submit(score) { const l = this.load(); l.push({ score, date: new Date().toISOString().slice(0, 10) }); l.sort((a, b) => b.score - a.score); const top = l.slice(0, this.max); this.saveList(top); return top; },
  clearAll() { try { localStorage.removeItem(this.key); } catch (e) {} this._mem = []; },
};

// GG:无尽关卡(经典模式,移植自老版本)独立排行榜 —— 和无尽挑战(强化/事件版)分开计分,避免构筑加成让分数不可比
const EndlessBoardLite = {
  key: "kzts_endless_lite", max: 5, _mem: [],
  load() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { return this._mem; } },
  saveList(list) { try { localStorage.setItem(this.key, JSON.stringify(list)); } catch (e) { this._mem = list; } },
  submit(score) { const l = this.load(); l.push({ score, date: new Date().toISOString().slice(0, 10) }); l.sort((a, b) => b.score - a.score); const top = l.slice(0, this.max); this.saveList(top); return top; },
  clearAll() { try { localStorage.removeItem(this.key); } catch (e) {} this._mem = []; },
};

// OO:成就系统 —— 定义 + 持久化。check* 系列在对应结算/事件点调用,内部自己判断解锁条件、去重、弹提示。
const ACHIEVEMENTS = [
  { id: "first_clear",  icon: "🏅", name: "初露锋芒", desc: "通关任意一关" },
  { id: "all_clear",    icon: "👑", name: "全线告捷", desc: "通关全部关卡" },
  { id: "no_hit",       icon: "🛡", name: "完美无伤", desc: "满血通关一关" },
  { id: "no_bomb",      icon: "💎", name: "轻装上阵", desc: "不用炸弹通关一关" },
  { id: "combo_30",     icon: "🔥", name: "连击大师", desc: "单局连击达到 30" },
  { id: "boss_slayer",  icon: "⚔", name: "屠龙勇士", desc: "累计击败 20 次 BOSS" },
  { id: "endless_5min", icon: "⏱", name: "持久战士", desc: "无尽模式存活 5 分钟" },
  { id: "all_ships",    icon: "🛩", name: "全机长征", desc: "体验过全部机型" },
  { id: "void_slayer",  icon: "🌀", name: "虚空终结者", desc: "击败最终 BOSS「虚空吞噬者」" },
];
const Achievements = {
  key: "kzts_achievements",
  data: { unlocked: {}, bossKills: 0, shipsUsed: [] },
  load() { try { const s = JSON.parse(localStorage.getItem(this.key)); if (s) Object.assign(this.data, s); } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  isUnlocked(id) { return !!this.data.unlocked[id]; },
  clearAll() { try { localStorage.removeItem(this.key); } catch (e) {} this.data = { unlocked: {}, bossKills: 0, shipsUsed: [] }; },
  unlock(id) {
    if (this.data.unlocked[id]) return;
    this.data.unlocked[id] = true; this.save();
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (def) { game.banner("🏆 成就达成", def.name); Sound.powerup(); }
  },
  trackShipUse(key) {
    if (!this.data.shipsUsed.includes(key)) { this.data.shipsUsed.push(key); this.save(); }
    if (CONFIG.shipOrder.every(k => this.data.shipsUsed.includes(k))) this.unlock("all_ships");
  },
  trackBossKill(defIndex) { this.data.bossKills++; this.save(); if (this.data.bossKills >= 20) this.unlock("boss_slayer"); if (defIndex === 6) this.unlock("void_slayer"); },
  checkLevelClear({ hpRatio, bombsUsed, maxCombo }) {
    this.unlock("first_clear");
    if (hpRatio >= 0.999) this.unlock("no_hit");
    if (bombsUsed === 0) this.unlock("no_bomb");
    if (maxCombo >= 30) this.unlock("combo_30");
    // GG:无尽关卡(endless:true)不是"关卡",不计入通关总数,否则全通成就永远解不出来
    if (Object.values(Progress.data).filter(p => p.cleared).length >= LEVELS.filter(l => !l.endless).length) this.unlock("all_clear");
  },
  checkEndlessEnd({ time, maxCombo }) {
    if (time >= 300) this.unlock("endless_5min");
    if (maxCombo >= 30) this.unlock("combo_30");
  },
};

// PP:存档导入导出 —— 单文件双击运行没有后端也没有文件下载习惯,用 window.prompt 展示/读取 JSON 文本最省事,
// 复制粘贴即可备份/换设备,零依赖不用引入任何下载/剪贴板 API。
const SaveData = {
  keys: ["kzts_settings", "kzts_progress", "kzts_scores", "kzts_endless", "kzts_endless_lite", "kzts_challenges", "kzts_achievements"],
  exportAll() {
    const out = { _game: "skywardRaid2077", _v: 1 };
    for (const k of this.keys) { const v = localStorage.getItem(k); if (v != null) out[k] = v; }
    return JSON.stringify(out);
  },
  importAll(jsonStr) {
    let obj;
    try { obj = JSON.parse(jsonStr); } catch (e) { return false; }
    if (!obj || typeof obj !== "object" || obj._game !== "skywardRaid2077") return false;
    for (const k of this.keys) { if (obj[k] != null) { try { localStorage.setItem(k, obj[k]); } catch (e) {} } }
    Settings.load(); Progress.load(); Achievements.load();
    game.diff = CONFIG.difficulties[Settings.data.diff] || CONFIG.difficulties.normal;
    game.ship = CONFIG.ships[Settings.data.ship] || CONFIG.ships.balanced;
    return true;
  },
};
