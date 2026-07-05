"use strict";

/* =====================================================================
 *  Skyward Raid 2077 —— 原创未来空战原型  v0.5
 *  引擎:HTML5 原生 Canvas,零依赖。双击本文件即可在浏览器运行。
 *
 *  本版新增:标题界面 / 难度选择(简单·普通·困难)/ 完整游戏流程(标题↔对局↔结算)
 *  历史功能:卷轴背景 · 连击系统 · 分数排行 · 多关卡 · 炸弹清屏 · 爆炸粒子 · 音效钩子
 *            火力升级 · 多阶段 BOSS · 敌机弹幕
 *
 *  ⚠ 美术/音效均为占位(代码图形 + WebAudio 合成),非原版素材。替换即用,逻辑不动。
 *  ⚠ 数值集中在 CONFIG。
 * ===================================================================== */

/* =====================================================================
 * 1) CONFIG
 * ===================================================================== */
const CONFIG = {
  WIDTH: 540, HEIGHT: 960,

  player: {
    startX: 270, startY: 800, radius: 15, maxHp: 100, lerp: 0.35,
    fireInterval: 0.11, bulletSpeed: 950, maxPower: 7, maxOvercharge: 5, maxBombs: 5, bombInvuln: 1.4,
  },
  bullet: { radius: 5, damage: 1 },
  secondary: {
    homingPower: 3, homingInterval: 0.68, homingSpeed: 520, homingTurn: 7.0, homingDamage: 2, homingRadius: 6,
    laserPower: 5, laserInterval: 1.05, laserDuration: 0.18, laserWidth: 16, laserDamage: 3,
    missilePower: 6, missileInterval: 1.25, missileSpeed: 360, missileTurn: 3.8, missileDamage: 6, missileSplash: 48,
  },
  // KK:虚拟摇杆操作模式(和默认的"相对拖动"二选一,设置页可切换)。baseX/baseY 固定底座位置(避开底部按钮行),
  // radius 摇杆最大可推距离,deadzone 死区比例(小于这个比例视为无输入),maxSpeed 推到底时的移动速度(px/s)。
  joystick: { baseX: 110, baseY: 770, radius: 70, deadzone: 0.15, maxSpeed: 480 },

  enemy: {
    small:  { hp: 1,  speed: 200, radius: 15, score: 100, color: "#ff6b6b", fireInterval: 0,   bulletSpeed: 0,   damage: 0 },
    medium: { hp: 5,  speed: 120, radius: 23, score: 300, color: "#ffa94d", fireInterval: 1.8, bulletSpeed: 280, damage: 8, shots: 1 },
    large:  { hp: 16, speed: 80,  radius: 33, score: 700, color: "#f06595", fireInterval: 2.4, bulletSpeed: 250, damage: 8, shots: 3 },
    // D:新增两种。gunner 重炮机(高血/双发瞄准);splitter 分裂机(死亡裂成小型机)
    gunner:   { hp: 10, speed: 90,  radius: 26, score: 500, color: "#748ffc", fireInterval: 1.2, bulletSpeed: 300, damage: 9, shots: 2 },
    splitter: { hp: 8,  speed: 100, radius: 26, score: 400, color: "#20c997", fireInterval: 0,   bulletSpeed: 0,   damage: 0, splits: 3 },
    // Z:世界4 新增两种。sniper 狙击机(慢速/低频但单发高伤精准狙击,shots:1 时 fireFan 天然退化为直线瞄准);
    //   detonator 雷机(自身不开火,死亡时炸出一圈弹幕,onEnemyKilled 里按 ringCount/ringSpeed/ringDamage 处理)
    sniper:     { hp: 7, speed: 70,  radius: 22, score: 550, color: "#e64980", fireInterval: 2.6, bulletSpeed: 520, damage: 14, shots: 1 },
    detonator:  { hp: 6, speed: 110, radius: 24, score: 450, color: "#fab005", fireInterval: 0,   bulletSpeed: 0,   damage: 0, ringCount: 14, ringSpeed: 210, ringDamage: 9 },
    // V:世界5 新增两种。phantom 幻影机(高速/双发瞄准,量多但脆);
    //   carrier 母舰机(自身不开火,死亡时裂出 spawnCount 只 spawns 类型的僚机,onEnemyKilled 里处理,同 splitter 套路但更硬更重)
    phantom:  { hp: 9,  speed: 150, radius: 20, score: 600, color: "#22d3ee", fireInterval: 1.0, bulletSpeed: 340, damage: 11, shots: 2 },
    carrier:  { hp: 22, speed: 65,  radius: 32, score: 900, color: "#9775fa", fireInterval: 0,   bulletSpeed: 0,   damage: 0, spawns: "medium", spawnCount: 2 },
  },
  enemyBullet: { radius: 6 },

  // 敌机运动模式参数(波次表用 move 字段引用;缺省 straight 直线下落)
  moves: {
    straight: {},
    sine:     { amp: 90,  freq: 3.0 },              // 正弦蛇行
    zigzag:   { amp: 110, period: 1.4 },            // 锯齿折返
    swoop:    { holdY: 210, hold: 0.7, diveVy: 2.4 }, // 下降→驻留→俯冲
    dive:     { speedMul: 1.7, triggerY: 0.16 },    // 下降片刻后瞄准玩家直冲(神风)
    orbit:    { radius: 60, speed: 2.2 },            // Z:绕基准点公转,同时缓慢下降(比 sine 多了纵向摆动)
  },

  weapon: {
    1: [ { ox: 0,  deg: 0 } ],
    2: [ { ox: -9, deg: 0 }, { ox: 9, deg: 0 } ],
    3: [ { ox: 0, deg: 0 }, { ox: -11, deg: -12 }, { ox: 11, deg: 12 } ],
    4: [ { ox: -7, deg: 0 }, { ox: 7, deg: 0 }, { ox: -13, deg: -16 }, { ox: 13, deg: 16 } ],
    5: [ { ox: 0, deg: 0 }, { ox: -8, deg: -10 }, { ox: 8, deg: 10 }, { ox: -15, deg: -22 }, { ox: 15, deg: 22 } ],
    6: [ { ox: 0, deg: 0 }, { ox: -8, deg: -9 }, { ox: 8, deg: 9 }, { ox: -16, deg: -20 }, { ox: 16, deg: 20 }, { ox: -22, deg: -32 }, { ox: 22, deg: 32 } ],                                  // 7 路
    7: [ { ox: 0, deg: 0 }, { ox: -7, deg: -7 }, { ox: 7, deg: 7 }, { ox: -14, deg: -16 }, { ox: 14, deg: 16 }, { ox: -20, deg: -26 }, { ox: 20, deg: 26 }, { ox: -26, deg: -38 }, { ox: 26, deg: 38 } ],  // 9 路
  },

  // weights 普通掉落;endlessWeights 无尽掉落(炸弹更稀有)。火力满级后继续吃 power 会进入超载层数。
  // autoInterval:常规关卡(非无尽)每隔多久自动刷新一个道具(秒)。
  powerup: { radius: 14, speed: 130, dropChance: 0.14, healAmount: 12, autoInterval: 5, magnetRadius: 40, magnetSpeed: 640,
    weights:        { power: 0.5,  heal: 0.22, bomb: 0.13, wing: 0.15 },
    endlessWeights: { power: 0.55, heal: 0.26, bomb: 0.04, wing: 0.15 } },
  overflow: { healShield: 30, healShieldDur: 8, bombEnergy: 26, wingChip: "sideGuns", threatGain: 18 },
  threat: {
    maxLevel: 5, perLevel: 80, scoreStep: 0.08, damageStep: 0.04,
    fullPowerPerSec: 2.4, comboPerSec: 2.0, noHitPerSec: 1.5, noHitDelay: 14,
    killGain: 1.8, bossKillGain: 24, overflowGain: 16, comboTrigger: 12,
    hitLoss: 70, blockedHitLoss: 28, bombLoss: 46, comboBreakLoss: 34,
  },
  chipOrder: ["laserFocus", "capacitor", "sideGuns"],
  chips: {
    laserFocus: { name: "聚焦激光", color: "#cc5de8", duration: 12, laserWidthMult: 0.72, laserDamageBonus: 2, laserDurationBonus: 0.06 },
    capacitor: { name: "电容护盾", color: "#74c0fc", duration: 14, block: 22 },
    sideGuns: { name: "侧翼炮组", color: "#ffd43b", duration: 10, angle: 22 },
  },
  bomb: { bossDamage: 70, flash: 0.35 },

  // 每关一个独立 BOSS:各有移动方式(sweep 横扫 / figure8 八字 / dart 瞬移)
  // 与分阶段弹幕组合(attacks 里的 type 见 runBossAttack 弹幕库)。
  bosses: [
    { name: "近卫舰", hp: 400, radius: 58, score: 6000, enterY: 150, damage: 9, shape: "delta", taunt: "休想越过这道防线!",
      colors: ["#845ef7", "#e64980", "#f03e3e"], movement: "sweep", moveSpeed: 1.1, moveRange: 170,
      phases: [
        { until: 0.66, cd: 1.30, attacks: [ { type: "fanDown", count: 5, spread: 55, speed: 250 } ] },
        { until: 0.33, cd: 0.90, attacks: [ { type: "aimed", count: 3, spread: 16, speed: 280 } ] },
        { until: 0.00, cd: 1.05, attacks: [ { type: "ring", count: 18, speed: 225 }, { type: "fanDown", count: 6, spread: 60, speed: 250 } ] },
      ] },
    { name: "旋刃", hp: 540, radius: 54, score: 7500, enterY: 150, damage: 9, shape: "cross", taunt: "在我的刃下化作齑粉吧。",
      colors: ["#4dabf7", "#22b8cf", "#f03e3e"], movement: "figure8", moveSpeed: 1.0, moveRange: 150,
      phases: [
        { until: 0.60, cd: 0.14, attacks: [ { type: "spiral", arms: 2, step: 19, speed: 170 } ] },     // 连续旋转弹幕
        { until: 0.30, cd: 0.85, attacks: [ { type: "aimed", count: 5, spread: 22, speed: 260 } ] },
        { until: 0.00, cd: 0.12, attacks: [ { type: "spiral", arms: 3, step: 26, speed: 190 } ] },
      ] },
    { name: "轰炸机", hp: 680, radius: 62, score: 9000, enterY: 135, damage: 10, shape: "hex", taunt: "地毯式火力,无处可逃!",
      colors: ["#ffa94d", "#ff922b", "#f03e3e"], movement: "dart", dartEvery: 2.2,
      phases: [
        { until: 0.60, cd: 1.60, attacks: [ { type: "wall", spacing: 46, gap: 100, speed: 180 } ] },   // 带缺口弹墙,逼走位
        { until: 0.30, cd: 0.80, attacks: [ { type: "aimed", count: 5, spread: 26, speed: 270 } ] },
        { until: 0.00, cd: 1.40, attacks: [ { type: "wall", spacing: 40, gap: 90, speed: 200 }, { type: "ring", count: 12, speed: 210 } ] },
      ] },
    { name: "双核要塞", hp: 880, radius: 60, score: 11000, enterY: 150, damage: 11, shape: "delta", taunt: "双核同调……全弹发射!",
      colors: ["#e64980", "#f06595", "#f03e3e"], movement: "sweep", moveSpeed: 1.5, moveRange: 190,
      phases: [
        { until: 0.66, cd: 1.00, attacks: [ { type: "ring", count: 16, speed: 220 }, { type: "aimed", count: 3, spread: 14, speed: 280 } ] },
        { until: 0.33, cd: 0.13, attacks: [ { type: "spiral", arms: 3, step: 23, speed: 200 } ] },
        { until: 0.00, cd: 1.20, attacks: [ { type: "ring", count: 20, speed: 230 }, { type: "wall", spacing: 44, gap: 80, speed: 190 } ] },
      ] },
    { name: "天空要塞", hp: 1120, radius: 66, score: 15000, enterY: 150, damage: 12, shape: "hex", taunt: "这里,就是你的坟墓。",
      colors: ["#f783ac", "#f03e3e", "#ff3b3b"], movement: "figure8", moveSpeed: 1.2, moveRange: 170,
      phases: [
        { until: 0.70, cd: 0.90, attacks: [ { type: "fanDown", count: 7, spread: 70, speed: 250 }, { type: "aimed", count: 3, spread: 12, speed: 290 } ] },
        { until: 0.40, cd: 0.12, attacks: [ { type: "spiral", arms: 4, step: 21, speed: 200 } ] },
        { until: 0.00, cd: 1.00, attacks: [ { type: "ring", count: 22, speed: 230 }, { type: "wall", spacing: 38, gap: 80, speed: 200 }, { type: "spiral", arms: 2, step: 17, speed: 180 }, { type: "laser", warn: 0.6, dur: 0.9, width: 50, cd: 4.8, aimed: true } ] },
      ] },
    // Z:世界4 最终BOSS —— shape:"star" 新造型,主打 laser(镭射柱)机制 + 狂暴(继承自 Boss 通用逻辑)
    { name: "深渊君王", hp: 1400, radius: 70, score: 20000, enterY: 150, damage: 13, shape: "star", taunt: "深渊无门,唯有臣服。",
      colors: ["#12b886", "#343a40", "#ff3b3b"], movement: "figure8", moveSpeed: 1.3, moveRange: 180,
      phases: [
        { until: 0.72, cd: 0.85, attacks: [ { type: "fanDown", count: 8, spread: 80, speed: 260 }, { type: "aimed", count: 3, spread: 12, speed: 300 } ] },
        { until: 0.42, cd: 0.11, attacks: [ { type: "spiral", arms: 4, step: 20, speed: 210 }, { type: "laser", warn: 0.55, dur: 0.9, width: 54, cd: 3.8, aimed: true } ] },
        { until: 0.00, cd: 0.95, attacks: [ { type: "ring", count: 24, speed: 240 }, { type: "wall", spacing: 36, gap: 76, speed: 210 }, { type: "laser", warn: 0.5, dur: 1.0, width: 60, cd: 3.2, aimed: true } ] },
      ] },
    // V:世界5 最终BOSS —— shape:"octagon" 新造型,全游戏最强,laser+spiral+wall 三件套叠加收官
    { name: "虚空吞噬者", hp: 1700, radius: 76, score: 26000, enterY: 150, damage: 15, shape: "octagon", taunt: "万物终将被虚空吞噬。",
      colors: ["#5f3dc4", "#101010", "#ff3b3b"], movement: "figure8", moveSpeed: 1.4, moveRange: 190,
      phases: [
        { until: 0.70, cd: 0.80, attacks: [ { type: "fanDown", count: 9, spread: 85, speed: 270 }, { type: "aimed", count: 4, spread: 14, speed: 300 } ] },
        { until: 0.38, cd: 0.10, attacks: [ { type: "spiral", arms: 5, step: 18, speed: 220 }, { type: "laser", warn: 0.5, dur: 0.9, width: 56, cd: 3.5, aimed: true } ] },
        { until: 0.00, cd: 0.85, attacks: [ { type: "ring", count: 26, speed: 250 }, { type: "wall", spacing: 34, gap: 72, speed: 220 }, { type: "laser", warn: 0.45, dur: 1.0, width: 64, cd: 2.8, aimed: true } ] },
      ] },
  ],

  crashDamage: 25,

  // C:机型。hpMult 血量倍率 / fireMult 射击间隔倍率(<1 更快) / bombs 额外炸弹 / wings 初始僚机
  // X:机型深化 —— lerpMult 移动跟手倍率 / radiusMult 机体&判定缩放 / dmgTakenMult 受伤倍率 / energyMult 必杀能量获取倍率
  //   comboTimeoutMult 连击判定时间倍率 / bombDmgMult 炸弹对BOSS伤害倍率 / specialCooldownMult 必杀冷却倍率
  //   bodyShape 决定 Player 机身剪影(delta/twin/bulk/dart,见 drawShipBody)
  // X4:必杀技机型专属化(specialType,见 game.useSpecial 分派)—— 攻击型保留原来的全屏重伤;防御型改护盾+回血;
  //   侦查型改隐身;平衡型改冲击波抵消弹幕。specialName/specialDesc 供机型选择页展示。
  shipOrder: ["balanced", "attacker", "defender", "scout"],
  ships: {
    balanced: { key: "balanced", name: "平衡型", color: "#4dabf7", desc: "均衡·带1僚机", hpMult: 1.0, fireMult: 1.0,  bombs: 0, wings: 1,
      bodyShape: "delta", lerpMult: 1.0, radiusMult: 1.0, dmgTakenMult: 1.0, energyMult: 1.0, comboTimeoutMult: 1.0, bombDmgMult: 1.0, specialCooldownMult: 1.0,
      perkName: "全面均衡", perkDesc: "无明显短板,新手推荐",
      specialType: "wave", specialName: "破阵冲击波", specialDesc: "向前发射一道扩散能量波,抵消沿途弹幕并对敌机造成伤害" },
    attacker: { key: "attacker", name: "攻击型", color: "#ff6b6b", desc: "火力猛·皮薄",  hpMult: 0.75, fireMult: 0.78, bombs: 0, wings: 0,
      bodyShape: "twin", lerpMult: 1.1, radiusMult: 0.95, dmgTakenMult: 1.0, energyMult: 1.0, comboTimeoutMult: 1.4, bombDmgMult: 1.0, specialCooldownMult: 1.0,
      perkName: "狂热连击", perkDesc: "连击判定时间 +40%,更容易叠满倍率",
      specialType: "nuke", specialName: "全屏轰杀", specialDesc: "对场上所有敌机造成重伤,并获得短暂无敌" },
    defender: { key: "defender", name: "防御型", color: "#38d9a9", desc: "血厚·多炸弹",  hpMult: 1.5, fireMult: 1.18, bombs: 2, wings: 0,
      bodyShape: "bulk", lerpMult: 0.85, radiusMult: 1.15, dmgTakenMult: 0.8, energyMult: 1.0, comboTimeoutMult: 1.0, bombDmgMult: 1.25, specialCooldownMult: 1.0,
      perkName: "钢铁装甲", perkDesc: "受到伤害 -20% · 炸弹伤害 +25%",
      specialType: "shield", specialName: "护盾展开", specialDesc: "立即回复部分生命,并展开可吸收伤害的能量护盾" },
    scout: { key: "scout", name: "侦查型", color: "#ffd43b", desc: "机动灵活·体积小", hpMult: 0.65, fireMult: 0.92, bombs: 1, wings: 0,
      bodyShape: "dart", lerpMult: 1.5, radiusMult: 0.78, dmgTakenMult: 1.0, energyMult: 1.15, comboTimeoutMult: 1.0, bombDmgMult: 1.0, specialCooldownMult: 0.75,
      perkName: "灵敏机动", perkDesc: "跟手 +50% · 受击体积 -22% · 必杀冷却 -25% · 能量获取 +15%",
      specialType: "stealth", specialName: "光学迷彩", specialDesc: "短暂隐身,期间免疫所有伤害" },
  },
  // A:僚机上限。B:必杀(能量攒满 + 冷却结束才可释放,offensive 全屏重伤;对 BOSS 伤害减半)
  wingMax: 4,
  // X3:cooldown 10→15(必杀强度没变,拉长间隔避免刷太快);新增 passiveGainPerSec —— 除了击杀攒能量,不管有没有击杀都按秒缓慢回能
  //   (60秒能从0攒满,纯粹是保底,不会比正常边打边攒更快),避免"没打到东西的时候必杀完全不涨"的干等感
  // X4:机型专属必杀参数——shieldHp/shieldDur/healOnShield 给防御型;stealthDur 给侦查型;waveDamage/waveSpeed/waveWidthGrow 给平衡型
  special: { bossDamage: 110, gainPerKill: 3, gainBossKill: 25, passiveGainPerSec: 1.7, invuln: 0.8, cooldown: 15,
    shieldHp: 60, shieldDur: 9, healOnShield: 0.3, stealthDur: 4.0, waveDamage: 45 },
  // F 无尽模式:玩家血量倍率更低、同屏敌人上限更小。T:难度统一固定,不跟随地图选择
  // dmgRampTime/dmgRampMult:无尽模式敌弹伤害从 t=0 的 1 倍线性增长,到 dmgRampTime 秒时封顶为 dmgRampMult 倍
  endless: { hpMult: 0.7, maxEnemies: 14, diffKey: "normal", dmgRampTime: 300, dmgRampMult: 3 },

  combo: { timeout: 2.5, scoreStep: 0.15, maxMult: 5, resetOnHit: false },

  // 结算:最终分 = 本局分 ×(1 + 血量比例×hpCoeff)× 难度 scoreMult
  // bombKillMult:炸弹清兵得分折扣(不吃连击)。farmMaxEnemies:刷分在场敌人上限。
  // farmScoreCapMult:刷分总分上限=通关时得分×此倍数,达到则强制结算。
  scoring: { hpCoeff: 0.6, farmInterval: 1.4, bombKillMult: 0.25, farmMaxEnemies: 12, farmScoreCapMult: 2 },
  bg: { speed: 130 },
  themes: [
    { sky1: "#081826", sky2: "#0d3a5c", band1: "rgba(20,80,110,.55)", band2: "rgba(40,130,160,.4)" },
    { sky1: "#241207", sky2: "#5a2e12", band1: "rgba(120,64,28,.55)",  band2: "rgba(170,96,40,.4)" },
    { sky1: "#0a0a1e", sky2: "#241040", band1: "rgba(60,36,110,.55)",  band2: "rgba(110,70,180,.4)" },
    { sky1: "#1a0505", sky2: "#3d0d0d", band1: "rgba(120,20,20,.55)",  band2: "rgba(180,40,20,.4)" },   // Z:世界4"深渊"主题
    { sky1: "#05030a", sky2: "#140a2e", band1: "rgba(70,30,120,.55)",  band2: "rgba(120,60,190,.4)" },  // V:世界5"虚空"主题
  ],
  // P:关卡过场副标题(按世界)
  worldIntro: ["第一战区 · 近海突破", "第二战区 · 大漠强袭", "第三战区 · 夜空决战", "第四战区 · 深渊禁地", "第五战区 · 虚空回廊"],

  // 难度档:dmgMult 敌方伤害倍率 / fireMult 敌方射击间隔倍率(>1 更慢=更易)
  //          bossHpMult BOSS 血量倍率 / invuln 玩家受击无敌时长 / startBombs 初始炸弹
  // X3:itemDropMult(仅 BOSS 关卡的自动掉落间隔倍率,>1 更慢更稀有)/ preBossMobMult(标了 preBoss:true 的波次数量倍率)
  //   —— 难度越高,BOSS 关卡里白捡的道具越少、BOSS 前要清的小怪越多,和已有的 dmgMult/bossHpMult 一起构成完整的难度曲线
  difficulties: {
    // X4:desc 补上新的BOSS关卡道具/小怪经济差异(原来只提伤害/炸弹/无敌时长),并在地图难度按钮上显示出来(之前定义了但从没真正渲染过)
    easy:   { key: "easy",   name: "简单 EASY",   color: "#38d9a9", desc: "伤害低·补给多",   dmgMult: 0.6, fireMult: 1.35, bossHpMult: 0.60, invuln: 1.5, startBombs: 4, scoreMult: 0.5, rank: 1, itemDropMult: 0.75, preBossMobMult: 0.8 },
    normal: { key: "normal", name: "普通 NORMAL", color: "#4dabf7", desc: "标准平衡",         dmgMult: 1.0, fireMult: 1.00, bossHpMult: 0.82, invuln: 1.2, startBombs: 3, scoreMult: 1.0, rank: 2, itemDropMult: 1.0,  preBossMobMult: 1.0 },
    hard:   { key: "hard",   name: "困难 HARD",   color: "#ff6b6b", desc: "弹幕快·补给少",   dmgMult: 1.4, fireMult: 0.80, bossHpMult: 1.25, invuln: 0.9, startBombs: 2, scoreMult: 3.0, rank: 3, itemDropMult: 1.6,  preBossMobMult: 1.5 },
  },
};

// FF:新手引导内容(首页可左右滑动翻看的教程页,首次启动自动展示,之后可点"？帮助"重看)
const TUTORIAL_PAGES = [
  { icon: "✈", title: "移动 & 开火", lines: ["拖动屏幕(或按住鼠标)移动飞机", "飞机会自动持续开火,无需额外按键"] },
  { icon: "💣", title: "炸弹 & 机型技能", lines: ["左下角炸弹图标:清屏 + 短暂无敌", "机型技能要等能量条攒满且冷却结束才能放", "机型技能效果因机型而异(轰炸/护盾/隐身/冲击波),不打人也会随时间缓慢回能"] },
  { icon: "🔥", title: "连击 & 道具", lines: ["连续击杀不中断可以叠连击倍率,越高分越多", "火力满级后继续吃火力会进入超载,强化激光/导弹/追踪弹", "常规关卡每隔几秒会自然刷新一个道具"] },
  { icon: "⚠", title: "BOSS 机制", lines: ["BOSS 血量过低会触发狂暴,攻击变快变猛", "镭射攻击有红色预警,亮起后千万别站在里面", "首页"+ "「📖 图鉴」" + "可以查看所有 BOSS 的详细信息"] },
  { icon: "🛩", title: "机型 & 世界", lines: ["不同机型有独特的被动技能和专属机型技能,首页可左右滑动查看", "关卡地图也能换机型,和首页共用同一个选择", "已开放 5 个世界共 15 关,难度逐步升级"] },
];
