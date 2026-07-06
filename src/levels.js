"use strict";

/* =====================================================================
 * 6) 关卡波次表
 * ===================================================================== */
// 关卡结构:世界-小关(1-1…3-3),先易后难,每关多波次。
// 波次步:spawn/wait/powerup;boss:<索引> 触发对应 BOSS;clear 结算过关。
// move: straight(默认) | sine 蛇行 | zigzag 锯齿 | swoop 俯冲驻留 | dive 瞄准直冲
const LEVELS = [
  // 世界1:开局用大 gap + 分组投放,同屏小怪很少,给玩家发育空间
  { id: "1-1", world: 1, sub: 1, script: [
    { wait: 1.0 }, { spawn: "small", count: 4, formation: "line", gap: 0.45 }, { wait: 1.8 },
    { spawn: "small", count: 5, formation: "arc", gap: 0.4, move: "sine" }, { powerup: "power" }, { wait: 1.6 },
    { spawn: "small", count: 6, formation: "line", gap: 0.4, move: "orbit" }, { wait: 1.4 }, { clear: true },
  ] },
  { id: "1-2", world: 1, sub: 2, script: [
    { wait: 0.9 }, { spawn: "small", count: 6, formation: "line", gap: 0.32, move: "sine" }, { wait: 1.3 },
    { spawn: "medium", count: 3, formation: "vee", gap: 0.4, move: "sine" }, { powerup: "power" }, { wait: 1.2 },
    { spawnMix: [ { type: "small", count: 5 }, { type: "medium", count: 2 } ], formation: "arc", gap: 0.3, move: "zigzag" }, { wait: 1.1 },
    { spawn: "large", count: 2, formation: "line" }, { spawn: "small", count: 5, formation: "line", gap: 0.3 }, { wait: 1.0 }, { clear: true },
  ] },
  // X3:preBoss:true 标记的波次数量会按 game.activeDiff.preBossMobMult 缩放(简单更少/困难更多)
  { id: "1-3", world: 1, sub: 3, script: [   // 压轴:BOSS 前小怪 ×3,充分发育
    { wait: 0.9 }, { spawn: "medium", count: 4, formation: "line", gap: 0.32, move: "sine" }, { wait: 1.0 },
    { spawn: "small", count: 30, formation: "line", gap: 0.22, move: "zigzag", preBoss: true }, { powerup: "heal" }, { wait: 1.0 },
    { spawn: "small", count: 30, formation: "vee", gap: 0.22, move: "sine", preBoss: true }, { powerup: "power" }, { wait: 0.9 },
    { spawn: "large", count: 4, formation: "line", gap: 0.35, preBoss: true }, { spawn: "small", count: 16, formation: "line", gap: 0.24, preBoss: true }, { powerup: "power" }, { wait: 1.0 },
    { boss: 0 }, { clear: true },
  ] },
  { id: "2-1", world: 2, sub: 1, script: [
    { wait: 0.9 }, { spawn: "small", count: 7, formation: "arc", gap: 0.24, move: "sine" }, { wait: 0.9 },
    { spawn: "medium", count: 3, formation: "vee", gap: 0.35, move: "zigzag" }, { powerup: "power" }, { wait: 0.9 },
    { spawnMix: [ { type: "small", count: 6 }, { type: "medium", count: 2 } ], formation: "line", gap: 0.22, move: "zigzag" }, { wait: 0.8 },
    { spawn: "large", count: 2, formation: "line", move: "orbit" }, { spawn: "small", count: 5, formation: "line", gap: 0.24, move: "sine" }, { wait: 1.0 }, { clear: true },
  ] },
  { id: "2-2", world: 2, sub: 2, script: [
    { wait: 0.9 }, { spawn: "small", count: 9, formation: "line", gap: 0.2, move: "dive" }, { powerup: "bomb" }, { wait: 0.9 },
    { spawn: "large", count: 3, formation: "line", gap: 0.45, move: "orbit" }, { spawn: "medium", count: 3, formation: "line", gap: 0.28, move: "zigzag" }, { wait: 0.9 },
    { spawnMix: [ { type: "small", count: 7 }, { type: "gunner", count: 2 } ], formation: "arc", gap: 0.2, move: "zigzag" }, { wait: 0.8 },
    { spawn: "gunner", count: 2, formation: "line", gap: 0.5, move: "sine" }, { powerup: "power" }, { wait: 1.0 }, { clear: true },
  ] },
  { id: "2-3", world: 2, sub: 3, script: [   // 压轴:双 BOSS · BOSS 前小怪 ×3,充分发育
    { wait: 0.9 }, { spawn: "large", count: 3, formation: "line" }, { spawn: "medium", count: 4, formation: "vee", gap: 0.25, move: "sine" }, { powerup: "power" }, { wait: 0.9 },
    { spawn: "small", count: 40, formation: "line", gap: 0.16, move: "zigzag", preBoss: true }, { wait: 0.9 },
    { spawn: "small", count: 34, formation: "vee", gap: 0.18, move: "dive", preBoss: true }, { powerup: "heal" }, { wait: 1.0 },
    { boss: 1 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 2 }, { clear: true },
  ] },
  // W2:3-1/3-2 二次加量 —— 上一版只加了数量,但填充的多是不开火的 small/splitter,实战里"两个炸弹就能轻松过",
  //   这次把配方换成以 large/medium/gunner 等真正开火的机型为主,filler 压到最低,wait 也整体收紧,让场上随时保持有效弹幕压力
  { id: "3-1", world: 3, sub: 1, script: [
    { wait: 0.6 }, { spawn: "large", count: 4, formation: "line", gap: 0.24, move: "sine", elite: "shield" }, { spawn: "gunner", count: 3, formation: "arc", gap: 0.3, move: "sine" }, { powerup: "power" }, { wait: 0.5 },
    { spawnMix: [ { type: "medium", count: 6 }, { type: "splitter", count: 4 } ], formation: "vee", gap: 0.15, move: "dive" }, { wait: 0.5 },
    { spawnMix: [ { type: "gunner", count: 4 }, { type: "medium", count: 5 } ], formation: "line", gap: 0.16, move: "sine" }, { powerup: "bomb" }, { wait: 0.45 },
    { spawn: "large", count: 4, formation: "arc", gap: 0.26, move: "zigzag" }, { spawn: "gunner", count: 3, formation: "line", gap: 0.32, move: "orbit" }, { powerup: "power" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "3-2", world: 3, sub: 2, script: [
    { wait: 0.6 }, { spawnMix: [ { type: "large", count: 4 }, { type: "medium", count: 7 } ], formation: "arc", gap: 0.18, move: "sine" }, { powerup: "power" }, { wait: 0.5 },
    { spawnMix: [ { type: "medium", count: 6 }, { type: "gunner", count: 4 } ], formation: "line", gap: 0.14, move: "zigzag" }, { powerup: "heal" }, { wait: 0.5 },
    { spawn: "large", count: 5, formation: "line", gap: 0.24, move: "swoop" }, { spawn: "splitter", count: 3, formation: "arc", gap: 0.3, move: "sine" }, { powerup: "power" }, { wait: 0.45 },
    { spawnMix: [ { type: "medium", count: 6 }, { type: "gunner", count: 4 } ], formation: "line", gap: 0.14, move: "zigzag" }, { powerup: "bomb" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "3-3", world: 3, sub: 3, script: [   // 最终压轴:三 BOSS 车轮战 · BOSS 前小怪 ×3,充分发育
    { wait: 0.9 }, { spawn: "medium", count: 6, formation: "vee", gap: 0.15, move: "zigzag" }, { spawn: "large", count: 3, formation: "line", gap: 0.3, move: "sine" }, { powerup: "power" }, { wait: 0.9 },
    { spawn: "small", count: 42, formation: "line", gap: 0.12, move: "dive", preBoss: true }, { wait: 0.8 },
    { spawn: "small", count: 36, formation: "vee", gap: 0.13, move: "zigzag", preBoss: true }, { powerup: "bomb" }, { powerup: "heal" }, { wait: 1.0 },
    { boss: 2 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 3 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 4 }, { clear: true },
  ] },
  // Z:世界4"深渊禁地" —— 引入 sniper(狙击机)/detonator(雷机),终章"深渊君王"以镭射机制收尾
  // W2:4-1/4-2 二次加量,理由同 3-1/3-2 —— 拉高开火机型占比、压缩 wait/gap,不再靠不开火的 small 凑数量充数
  { id: "4-1", world: 4, sub: 1, script: [
    { wait: 0.6 }, { spawn: "sniper", count: 4, formation: "line", gap: 0.35, move: "straight", elite: "charger" }, { spawn: "gunner", count: 2, formation: "vee", gap: 0.4, move: "sine" }, { powerup: "power" }, { wait: 0.5 },
    { spawnMix: [ { type: "medium", count: 5 }, { type: "sniper", count: 4 }, { type: "jammer", count: 2 } ], formation: "line", gap: 0.14, move: "zigzag" }, { wait: 0.5 },
    { spawn: "gunner", count: 5, formation: "vee", gap: 0.28, move: "orbit" }, { spawn: "small", count: 8, formation: "line", gap: 0.16 }, { powerup: "bomb" }, { wait: 0.5 },
    { spawnMix: [ { type: "medium", count: 6 }, { type: "gunner", count: 3 }, { type: "sniper", count: 3 } ], formation: "arc", gap: 0.16, move: "sine" }, { wait: 0.45 },
    { spawn: "sniper", count: 5, formation: "line", gap: 0.3, move: "straight" }, { spawn: "small", count: 10, formation: "arc", gap: 0.16, move: "dive" }, { powerup: "power" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "4-2", world: 4, sub: 2, script: [
    { wait: 0.6 }, { spawn: "detonator", count: 5, formation: "line", gap: 0.32, move: "sine" }, { spawn: "medium", count: 4, formation: "arc", gap: 0.22, move: "zigzag" }, { powerup: "power" }, { wait: 0.5 },
    { spawnMix: [ { type: "medium", count: 6 }, { type: "detonator", count: 4 } ], formation: "vee", gap: 0.18, move: "sine" }, { powerup: "heal" }, { wait: 0.5 },
    { spawn: "sniper", count: 5, formation: "line", gap: 0.3, move: "straight" }, { spawn: "large", count: 4, formation: "line", gap: 0.26, move: "swoop" }, { powerup: "power" }, { wait: 0.45 },
    { spawnMix: [ { type: "gunner", count: 4 }, { type: "sniper", count: 3 }, { type: "medium", count: 4 } ], formation: "line", gap: 0.16, move: "zigzag" }, { spawn: "detonator", count: 3, formation: "arc", gap: 0.35, move: "sine" }, { powerup: "bomb" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "4-3", world: 4, sub: 3, script: [   // 最终关:三 BOSS 车轮战(收官:深渊君王)· BOSS 前小怪 ×3
    { wait: 0.9 }, { spawn: "gunner", count: 4, formation: "vee", gap: 0.25, move: "sine" }, { spawn: "sniper", count: 3, formation: "line", gap: 0.4, move: "straight" }, { powerup: "power" }, { wait: 0.9 },
    { spawn: "small", count: 42, formation: "arc", gap: 0.12, move: "dive", preBoss: true }, { wait: 0.8 },
    { spawnMix: [ { type: "small", count: 18 }, { type: "detonator", count: 5 } ], formation: "line", gap: 0.16, move: "zigzag", preBoss: true }, { powerup: "bomb" }, { powerup: "heal" }, { wait: 1.0 },
    { boss: 3 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 4 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 5 }, { clear: true },
  ] },
  // V:世界5"虚空回廊" —— 引入 phantom(幻影机)/carrier(母舰机),终章三 BOSS 车轮战,以全新"虚空吞噬者"收官
  // W2:5-1/5-2 二次加量,理由同 3-1/3-2/4-1/4-2 —— phantom 本身就会开火,直接堆高它的占比比堆 small 更有效
  // X3:5-1/5-2 三次加量 —— 用户实际打过后反馈还是太轻松,在已经拉高开火占比的基础上再加一整个波次,拉长关卡时长/可获得分数
  { id: "5-1", world: 5, sub: 1, script: [
    { wait: 0.6 }, { spawn: "phantom", count: 6, formation: "line", gap: 0.28, move: "zigzag" }, { spawn: "gunner", count: 2, formation: "vee", gap: 0.4, move: "sine" }, { powerup: "power" }, { wait: 0.5 },
    { spawnMix: [ { type: "phantom", count: 8 }, { type: "sniper", count: 3 } ], formation: "line", gap: 0.14, move: "sine" }, { wait: 0.5 },
    { spawn: "gunner", count: 4, formation: "vee", gap: 0.3, move: "orbit" }, { spawn: "phantom", count: 5, formation: "line", gap: 0.22, move: "zigzag" }, { powerup: "bomb" }, { wait: 0.45 },
    { spawnMix: [ { type: "phantom", count: 10 }, { type: "gunner", count: 4 } ], formation: "arc", gap: 0.13, move: "zigzag" }, { powerup: "heal" }, { wait: 0.45 },
    { spawnMix: [ { type: "phantom", count: 8 }, { type: "gunner", count: 3 }, { type: "sniper", count: 3 } ], formation: "arc", gap: 0.14, move: "sine" }, { spawn: "small", count: 6, formation: "line", gap: 0.2 }, { powerup: "power" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "5-2", world: 5, sub: 2, script: [
    { wait: 0.6 }, { spawn: "carrier", count: 3, formation: "line", gap: 0.45, move: "sine", elite: "shield" }, { spawn: "support", count: 2, formation: "arc", gap: 0.42, move: "sine" }, { spawn: "phantom", count: 5, formation: "arc", gap: 0.2, move: "zigzag" }, { powerup: "power" }, { wait: 0.5 },
    { spawnMix: [ { type: "phantom", count: 6 }, { type: "detonator", count: 4 } ], formation: "line", gap: 0.14, move: "sine" }, { powerup: "heal" }, { wait: 0.5 },
    { spawn: "carrier", count: 3, formation: "vee", gap: 0.4, move: "swoop" }, { spawn: "sniper", count: 5, formation: "line", gap: 0.26, move: "straight" }, { powerup: "power" }, { wait: 0.45 },
    { spawn: "carrier", count: 3, formation: "vee", gap: 0.38, move: "orbit" }, { spawn: "phantom", count: 8, formation: "line", gap: 0.14, move: "sine" }, { powerup: "heal" }, { wait: 0.45 },
    { spawnMix: [ { type: "gunner", count: 4 }, { type: "phantom", count: 8 }, { type: "sniper", count: 4 } ], formation: "line", gap: 0.13, move: "zigzag" }, { spawn: "carrier", count: 2, formation: "arc", gap: 0.5, move: "sine" }, { powerup: "bomb" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "5-3", world: 5, sub: 3, script: [   // 终章:三 BOSS 车轮战(收官:虚空吞噬者)· BOSS 前小怪 ×3
    { wait: 0.9 }, { spawn: "carrier", count: 3, formation: "vee", gap: 0.3, move: "sine" }, { spawn: "phantom", count: 5, formation: "line", gap: 0.3, move: "zigzag" }, { powerup: "power" }, { wait: 0.9 },
    { spawn: "small", count: 46, formation: "arc", gap: 0.11, move: "dive", preBoss: true }, { wait: 0.8 },
    { spawnMix: [ { type: "phantom", count: 20 }, { type: "carrier", count: 5 } ], formation: "line", gap: 0.14, move: "zigzag", preBoss: true }, { powerup: "bomb" }, { powerup: "heal" }, { wait: 1.0 },
    { boss: 4 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 5 }, { powerup: "heal" }, { wait: 0.8 }, { boss: 6 }, { clear: true },
  ] },
  { id: "6-1", world: 6, sub: 1, script: [
    { wait: 0.6 }, { spawn: "beacon", count: 4, formation: "line", gap: 0.35, move: "sine" }, { spawn: "medium", count: 5, formation: "arc", gap: 0.18, move: "zigzag" }, { powerup: "power" }, { wait: 0.6 },
    { spawnMix: [ { type: "mirrorDrone", count: 4 }, { type: "gunner", count: 4 } ], formation: "vee", gap: 0.2, move: "sine" }, { wait: 0.55 },
    { spawn: "phaseWing", count: 5, formation: "line", gap: 0.28, move: "straight" }, { spawn: "beacon", count: 3, formation: "arc", gap: 0.34, move: "orbit" }, { powerup: "bomb" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "6-2", world: 6, sub: 2, script: [
    { wait: 0.6 }, { spawn: "mineLayer", count: 3, formation: "line", gap: 0.5, move: "sine" }, { spawn: "phaseWing", count: 4, formation: "arc", gap: 0.28, move: "straight" }, { powerup: "power" }, { wait: 0.55 },
    { spawnMix: [ { type: "beacon", count: 4 }, { type: "sniper", count: 4 }, { type: "mirrorDrone", count: 3 } ], formation: "line", gap: 0.18, move: "zigzag" }, { powerup: "heal" }, { wait: 0.55 },
    { spawn: "warden", count: 3, formation: "vee", gap: 0.42, move: "sine" }, { spawn: "gunner", count: 5, formation: "line", gap: 0.22, move: "orbit" }, { powerup: "bomb" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "6-3", world: 6, sub: 3, script: [
    { wait: 0.8 }, { spawnMix: [ { type: "beacon", count: 5 }, { type: "mirrorDrone", count: 4 } ], formation: "arc", gap: 0.18, move: "sine", preBoss: true }, { powerup: "power" }, { wait: 0.7 },
    { spawnMix: [ { type: "phaseWing", count: 8 }, { type: "mineLayer", count: 3 } ], formation: "line", gap: 0.18, move: "zigzag", preBoss: true }, { powerup: "heal" }, { wait: 0.9 },
    { boss: 7 }, { clear: true },
  ] },
  { id: "7-1", world: 7, sub: 1, script: [
    { wait: 0.6 }, { spawn: "warden", count: 4, formation: "line", gap: 0.38, move: "sine" }, { spawn: "medium", count: 7, formation: "arc", gap: 0.16, move: "zigzag" }, { powerup: "power" }, { wait: 0.55 },
    { spawnMix: [ { type: "tether", count: 3 }, { type: "gunner", count: 5 } ], formation: "vee", gap: 0.2, move: "sine" }, { wait: 0.55 },
    { spawn: "harvester", count: 3, formation: "arc", gap: 0.4, move: "straight" }, { powerup: "heal" }, { spawn: "phaseWing", count: 6, formation: "line", gap: 0.18, move: "zigzag" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "7-2", world: 7, sub: 2, script: [
    { wait: 0.6 }, { spawnMix: [ { type: "warden", count: 4 }, { type: "shieldCarrier", count: 3 } ], formation: "line", gap: 0.24, move: "sine" }, { powerup: "power" }, { wait: 0.55 },
    { spawnMix: [ { type: "mineLayer", count: 4 }, { type: "tether", count: 3 }, { type: "phantom", count: 5 } ], formation: "arc", gap: 0.18, move: "zigzag" }, { powerup: "bomb" }, { wait: 0.55 },
    { spawn: "harvester", count: 4, formation: "line", gap: 0.3, move: "straight" }, { spawn: "carrier", count: 3, formation: "vee", gap: 0.42, move: "orbit" }, { powerup: "heal" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "7-3", world: 7, sub: 3, script: [
    { wait: 0.8 }, { spawnMix: [ { type: "warden", count: 5 }, { type: "gunner", count: 7 } ], formation: "line", gap: 0.16, move: "sine", preBoss: true }, { powerup: "power" }, { wait: 0.7 },
    { spawnMix: [ { type: "tether", count: 4 }, { type: "harvester", count: 3 }, { type: "phaseWing", count: 6 } ], formation: "arc", gap: 0.18, move: "zigzag", preBoss: true }, { powerup: "bomb" }, { powerup: "heal" }, { wait: 0.9 },
    { boss: 8 }, { clear: true },
  ] },
  { id: "8-1", world: 8, sub: 1, script: [
    { wait: 0.6 }, { spawnMix: [ { type: "tether", count: 4 }, { type: "beacon", count: 4 } ], formation: "line", gap: 0.22, move: "sine" }, { powerup: "power" }, { wait: 0.55 },
    { spawn: "kamikaze", count: 5, formation: "line", gap: 0.45 }, { spawn: "mineLayer", count: 4, formation: "arc", gap: 0.34, move: "zigzag" }, { powerup: "heal" }, { wait: 0.55 },
    { spawnMix: [ { type: "mirrorDrone", count: 5 }, { type: "phaseWing", count: 6 } ], formation: "vee", gap: 0.18, move: "sine" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "8-2", world: 8, sub: 2, script: [
    { wait: 0.6 }, { spawnMix: [ { type: "warden", count: 4 }, { type: "tether", count: 4 }, { type: "sniper", count: 4 } ], formation: "arc", gap: 0.18, move: "sine" }, { powerup: "power" }, { wait: 0.55 },
    { spawnMix: [ { type: "mineLayer", count: 5 }, { type: "beacon", count: 5 }, { type: "mirrorDrone", count: 4 } ], formation: "line", gap: 0.16, move: "zigzag" }, { powerup: "bomb" }, { wait: 0.55 },
    { spawn: "harvester", count: 5, formation: "arc", gap: 0.32, move: "straight" }, { spawn: "kamikaze", count: 5, formation: "line", gap: 0.42 }, { powerup: "heal" }, { wait: 0.9 }, { clear: true },
  ] },
  { id: "8-3", world: 8, sub: 3, script: [
    { wait: 0.8 }, { spawnMix: [ { type: "tether", count: 5 }, { type: "mineLayer", count: 5 }, { type: "warden", count: 4 } ], formation: "line", gap: 0.16, move: "sine", preBoss: true }, { powerup: "power" }, { wait: 0.7 },
    { spawnMix: [ { type: "beacon", count: 6 }, { type: "phaseWing", count: 8 }, { type: "kamikaze", count: 4 } ], formation: "arc", gap: 0.15, move: "zigzag", preBoss: true }, { powerup: "bomb" }, { powerup: "heal" }, { wait: 0.9 },
    { boss: 9 }, { clear: true },
  ] },
  // GG:从老版本(空中突袭v3.6)移植回来的经典无尽关卡 —— 没有强化抽卡/事件/挑战码那一整套,单纯生存刷分。
  //   放在地图末尾,endless:true 标记让 isUnlocked/mapNodePos/drawMap 全部走独立分支,不占用世界/小关编号,也不参与"通关解锁下一关"链条。
  { id: "∞", world: 6, sub: 2, endless: true, script: [] },
];

// Z:反查某个 BOSS 索引出现在哪些关卡(供首页图鉴展示)
function bossLevelIds(defIndex) {
  return LEVELS.filter(L => L.script.some(s => s.boss === defIndex)).map(L => L.id);
}

function formationX(formation, i, count, radius) {
  const W = CONFIG.WIDTH, m = radius + 20;
  if (formation === "center") return W / 2;
  if (formation === "random") return m + game.rng() * (W - 2 * m);
  return count <= 1 ? W / 2 : m + i * (W - 2 * m) / (count - 1);
}
function formationYOffset(formation, i, count) {
  if (formation === "vee") return Math.abs(i - (count - 1) / 2) * 45;
  if (formation === "arc") { const t = count <= 1 ? 0 : (i / (count - 1)) * 2 - 1; return (1 - t * t) * -60; }   // Z:弧形站位,中间提前出场、两端靠后
  return 0;
}
// Z:把多种敌机类型按数量交错排成一份出场序列(轮转分配,而非先出完A类再出B类)
// X3:mult 给 preBoss 波次按难度放大数量用;向上取整避免难度系数把个位数怪缩没了
function buildMixPlan(mix, mult = 1) {
  const pools = mix.map(m => ({ type: m.type, elite: m.elite, left: Math.max(1, Math.round(m.count * mult)) })), plan = [];
  let any = true;
  while (any) {
    any = false;
    for (const p of pools) { if (p.left > 0) { plan.push({ type: p.type, elite: p.elite }); p.left--; any = true; } }
  }
  return plan;
}

const director = {
  script: null, cursor: 0, started: false, timer: 0, left: 0, spawnTotal: 0, bossRef: null, mixPlan: null, mixLeft: 0,
  begin(script) { this.script = script; this.cursor = 0; this.started = false; this.timer = 0; this.left = 0; this.spawnTotal = 0; this.bossRef = null; this.mixPlan = null; this.mixLeft = 0; },
  // X3:preBoss 步骤按 game.activeDiff.preBossMobMult 放大数量(简单更少/困难更多),不直接改 s.count(那是 LEVELS 里的共享数据,
  //   改了会在下一次进同一关时继续叠加/污染),而是把放大后的数量单独存在 director 自己的状态里(spawnTotal / mixPlan.length)。
  beginStep(s) {
    const mult = s.preBoss ? game.activeDiff.preBossMobMult : 1;
    if (s.wait != null) this.timer = s.wait;
    else if (s.spawn) { this.spawnTotal = Math.max(1, Math.round(s.count * mult)); this.left = this.spawnTotal; this.timer = 0; }
    else if (s.spawnMix) { this.mixPlan = buildMixPlan(s.spawnMix, mult); this.mixLeft = this.mixPlan.length; this.timer = 0; }   // Z:单波次混合多种敌机,轮转出场
    else if (s.powerup) { if (game.canDrop(s.powerup)) game.spawnPowerUp(CONFIG.WIDTH / 2, s.powerup); }
    else if (s.boss != null) this.bossRef = game.spawnBoss(s.boss);   // 注意 != null:BOSS 索引可为 0
    // clear 步不在进入时立即结束,而是在 update 里等屏幕清空
  },
  next() { this.cursor++; this.started = false; },
  update(dt) {
    if (!this.script || this.cursor >= this.script.length) return;
    const s = this.script[this.cursor];
    if (!this.started) { this.started = true; this.beginStep(s); }
    if (s.wait != null) { this.timer -= dt; if (this.timer <= 0) this.next(); }
    else if (s.spawn) {
      if (this.left > 0) { this.timer -= dt; if (this.timer <= 0) { const total = this.spawnTotal, i = total - this.left, r = CONFIG.enemy[s.spawn].radius; game.enemies.push(pools.enemy.get(s.spawn, formationX(s.formation, i, total, r), formationYOffset(s.formation, i, total), s.move, s.elite)); this.left--; this.timer = s.gap || 0; } }
      if (this.left <= 0) this.next();
    }
    else if (s.spawnMix) {
      if (this.mixLeft > 0) { this.timer -= dt; if (this.timer <= 0) { const total = this.mixPlan.length, idx = total - this.mixLeft, entry = this.mixPlan[idx], type = entry.type, elite = s.elite || entry.elite, r = CONFIG.enemy[type].radius; game.enemies.push(pools.enemy.get(type, formationX(s.formation, idx, total, r), formationYOffset(s.formation, idx, total), s.move, elite)); this.mixLeft--; this.timer = s.gap || 0; } }
      if (this.mixLeft <= 0) this.next();
    }
    else if (s.powerup) this.next();
    else if (s.boss != null) { if (this.bossRef && this.bossRef.dead) this.next(); }
    else if (s.clear) { if (game.enemies.length === 0) game.reachTarget(); }   // 等固定数量的怪全部清空
  },
};
