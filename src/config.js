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
    fireInterval: 0.11, bulletSpeed: 950, maxPower: 8, maxOvercharge: 8, maxBombs: 5, bombInvuln: 1.4,
  },
  bullet: { radius: 5, damage: 1 },
  secondary: {
    homingPower: 3, homingInterval: 0.68, homingSpeed: 520, homingTurn: 7.0, homingDamage: 2, homingRadius: 6,
    laserPower: 5, laserInterval: 1.05, laserDuration: 0.18, laserWidth: 16, laserDamage: 3,
    missilePower: 6, missileInterval: 1.25, missileSpeed: 360, missileTurn: 3.8, missileDamage: 6, missileSplash: 48,
  },
  charge: { minPower: 2, min: 0.35, max: 1.35, cooldown: 1.4, overchargeBase: 4, overchargeBonus: 6 },
  // KK:虚拟摇杆操作模式(和默认的"相对拖动"二选一,设置页可切换)。baseX/baseY 固定底座位置(避开底部按钮行),
  // radius 摇杆最大可推距离,deadzone 死区比例(小于这个比例视为无输入),maxSpeed 推到底时的移动速度(px/s)。
  joystick: { baseX: 110, baseY: 770, radius: 70, deadzone: 0.15, maxSpeed: 480 },

  enemy: {
    small:  { hp: 1,  speed: 200, radius: 15, score: 100, color: "#ff6b6b", fireInterval: 0,   bulletSpeed: 0,   damage: 0 },
    medium: { hp: 5,  speed: 120, radius: 23, score: 300, color: "#ffa94d", fireInterval: 1.8, bulletSpeed: 280, damage: 8, shots: 1 },
    large:  { hp: 16, speed: 80,  radius: 33, score: 700, color: "#f06595", fireInterval: 2.4, bulletSpeed: 250, damage: 8, shots: 3 },
    // D:新增两种。gunner 重炮机(高血/双发瞄准);splitter 分裂机(死亡裂成小型机)
    gunner:   { hp: 10, speed: 90,  radius: 26, score: 500, color: "#748ffc", fireInterval: 1.2, bulletSpeed: 300, damage: 9, shots: 2, homingInterval: 4.4, homingMinTime: 150, homingSpeed: 210, homingTurn: 2.7, homingDamage: 7 },
    splitter: { hp: 8,  speed: 100, radius: 26, score: 400, color: "#20c997", fireInterval: 0,   bulletSpeed: 0,   damage: 0, splits: 3 },
    // Z:世界4 新增两种。sniper 狙击机(慢速/低频但单发高伤精准狙击,shots:1 时 fireFan 天然退化为直线瞄准);
    //   detonator 雷机(自身不开火,死亡时炸出一圈弹幕,onEnemyKilled 里按 ringCount/ringSpeed/ringDamage 处理)
    sniper:     { hp: 7, speed: 70,  radius: 22, score: 550, color: "#e64980", fireInterval: 2.6, bulletSpeed: 520, damage: 14, shots: 1, warn: 0.55 },
    detonator:  { hp: 6, speed: 110, radius: 24, score: 450, color: "#fab005", fireInterval: 0,   bulletSpeed: 0,   damage: 0, ringCount: 14, ringSpeed: 210, ringDamage: 9 },
    // V:世界5 新增两种。phantom 幻影机(高速/双发瞄准,量多但脆);
    //   carrier 母舰机(自身不开火,死亡时裂出 spawnCount 只 spawns 类型的僚机,onEnemyKilled 里处理,同 splitter 套路但更硬更重)
    phantom:  { hp: 9,  speed: 150, radius: 20, score: 600, color: "#22d3ee", fireInterval: 1.0, bulletSpeed: 340, damage: 11, shots: 2 },
    carrier:  { hp: 22, speed: 65,  radius: 32, score: 900, color: "#9775fa", fireInterval: 0,   bulletSpeed: 0,   damage: 0, spawns: "medium", spawnCount: 2 },
    shieldCarrier: { hp: 18, speed: 70, radius: 31, score: 850, color: "#74c0fc", fireInterval: 1.9, bulletSpeed: 260, damage: 8, shots: 3, shield: 18 },
    jammer:   { hp: 12, speed: 72,  radius: 25, score: 650, color: "#15aabf", fireInterval: 2.2, bulletSpeed: 260, damage: 7, shots: 2, jamRadius: 320, weaponSlow: 1.35 },
    support:  { hp: 12, speed: 62,  radius: 25, score: 700, color: "#51cf66", fireInterval: 0,   bulletSpeed: 0,   damage: 0, repairInterval: 2.4, repairRadius: 150, repairAmount: 4 },
    kamikaze: { hp: 5,  speed: 155, radius: 21, score: 520, color: "#ff6b6b", fireInterval: 0,   bulletSpeed: 0,   damage: 0, move: "rearChase", fromBottom: true, crashDamage: 45 },
    beacon:   { hp: 6,  speed: 95,  radius: 21, score: 520, color: "#ffd43b", fireInterval: 0,   bulletSpeed: 300, damage: 8, markInterval: 2.8, markDelay: 0.75, markShots: 3, homingInterval: 3.6, homingMinTime: 95, homingSpeed: 225, homingTurn: 3.0, homingDamage: 7 },
    mineLayer:{ hp: 13, speed: 68,  radius: 27, score: 760, color: "#ff922b", fireInterval: 0,   bulletSpeed: 0,   damage: 9, mineInterval: 2.2, mineRadius: 18, triggerRadius: 70, mineFuse: 0.45, ringCount: 8, ringSpeed: 170, zoneKind: "fire", zoneMinTime: 125, zoneInterval: 4.2, zoneRadius: 46, zoneDuration: 4.3, zoneDamage: 4 },
    phaseWing:{ hp: 8,  speed: 120, radius: 22, score: 680, color: "#be4bdb", fireInterval: 0,   bulletSpeed: 275, damage: 8, blinkInterval: 2.4, blinkDelay: 0.55, blinkRange: 170, shots: 5 },
    mirrorDrone:{ hp: 7, speed: 105, radius: 20, score: 650, color: "#74c0fc", fireInterval: 0, bulletSpeed: 230, damage: 7, reflectCd: 0.9 },
    tether:   { hp: 14, speed: 62,  radius: 26, score: 820, color: "#20c997", fireInterval: 0,   bulletSpeed: 0,   damage: 0, pullRadius: 260, pullStrength: 95, zoneKind: "ice", zoneMinTime: 185, zoneInterval: 5.0, zoneRadius: 54, zoneDuration: 4.0, zoneDamage: 2, slowMult: 0.56, slowDuration: 1.2 },
    warden:   { hp: 18, speed: 58,  radius: 30, score: 920, color: "#91a7ff", fireInterval: 0,   bulletSpeed: 0,   damage: 0, guardRadius: 155, guardShield: 8, maxTargets: 4 },
    harvester:{ hp: 10, speed: 155, radius: 23, score: 720, color: "#fcc419", fireInterval: 0,   bulletSpeed: 0,   damage: 0, stealRadius: 210, escapeSpeed: 230, bonusDropChance: 0.25 },
  },
  enemyBullet: { radius: 6 },

  // 敌机运动模式参数(波次表用 move 字段引用;缺省 straight 直线下落)
  moves: {
    straight: {},
    sine:     { amp: 90,  freq: 3.0 },              // 正弦蛇行
    zigzag:   { amp: 110, period: 1.4 },            // 锯齿折返
    swoop:    { holdY: 210, hold: 0.7, diveVy: 2.4 }, // 下降→驻留→俯冲
    dive:     { speedMul: 1.7, triggerY: 0.16 },    // 下降片刻后瞄准玩家直冲(神风)
    rearChase:{ warn: 2, boost: 2.5, boostMul: 200 / 155, speedMul: 1, turn: 4, track: 2.5 },
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
    8: [ { ox: 0, deg: 0 }, { ox: -7, deg: -6 }, { ox: 7, deg: 6 }, { ox: -13, deg: -13 }, { ox: 13, deg: 13 }, { ox: -19, deg: -22 }, { ox: 19, deg: 22 }, { ox: -25, deg: -32 }, { ox: 25, deg: 32 }, { ox: -31, deg: -42 }, { ox: 31, deg: 42 } ], // 11 路
  },

  // weights 普通掉落;endlessWeights 无尽掉落(炸弹更稀有)。火力满级后继续吃 power 会永久强化主炮/激光。
  // autoInterval:常规关卡(非无尽)每隔多久自动刷新一个道具(秒)。
  powerup: { radius: 14, speed: 130, dropChance: 0.11, healAmount: 12, autoInterval: 5, healDropInterval: 20, magnetRadius: 40, magnetSpeed: 640, chipMinPower: 5, chipMinEndlessTime: 30, chipDraftInterval: 30, chipBossDraftDelay: 30, chipMinDraftGap: 30, fullWeightMult: 0.2,
    weights:        { power: 0.47, heal: 0.22, bomb: 0.12, wing: 0.14, chip: 0.05 },
    endlessWeights: { power: 0.48, heal: 0.23, bomb: 0.04, wing: 0.13, chip: 0.12 } },
  // OO:道具图鉴用的展示文案 —— 图标/配色直接复用 drawPowerupToken(见 entities.js),和局内掉落物完全一致
  powerupOrder: ["power", "heal", "bomb", "wing", "chip"],
  powerupInfo: {
    power:  { name: "火力", desc: "主炮火力等级 +1;满级后转化为过载层数,提升蓄力激光威力", color: "#2f9e44" },
    heal:   { name: "医疗", desc: "立即回复少量生命值", color: "#e03131" },
    bomb:   { name: "炸弹", desc: "获得 1 枚炸弹,可清屏并重创 BOSS", color: "#5f3dc4" },
    wing:   { name: "僚机", desc: "获得 1 架侧翼僚机,叠加火力覆盖", color: "#495057", labelColor: "#ced4da" },
    chip:   { name: "芯片", desc: "拾取后触发一次芯片/强化抽取", color: "#4dabf7" },
  },
  overflow: { healShield: 30, healShieldDur: 8, bombEnergy: 26, wingChip: "sideGuns", threatGain: 18, score: 250, batchWindow: 0.3, extraScore: 80, extraEnergy: 8, energyCap: 60, powerDamageStep: 0.25, wingDamageStep: 0.25, healShieldStep: 8, healShieldCap: 60, healShieldDurStep: 0.6, healShieldDurCap: 12 },
  threat: {
    maxLevel: 5, perLevel: 80, scoreStep: 0.08, damageStep: 0.04,
    fullPowerPerSec: 2.4, comboPerSec: 2.0, noHitPerSec: 1.5, noHitDelay: 14,
    killGain: 1.8, bossKillGain: 24, overflowGain: 16, comboTrigger: 12,
    hitLoss: 70, blockedHitLoss: 28, bombLoss: 46, comboBreakLoss: 34,
  },
  chipOrder: ["laserFocus", "homingSwarm", "missileBarrage", "chargeCore", "capacitor", "sideGuns", "volatileCore"],
  chips: {
    laserFocus: { name: "聚焦激光", desc: "激光更窄,伤害更高", color: "#cc5de8", duration: 15, laserWidthMult: 0.72, laserDamageBonus: 3, laserDurationBonus: 0.08, pickBuff: { label: "能量 +6", energy: 6 } },
    homingSwarm: { name: "蜂群追踪", desc: "追踪弹更多,锁定更远", color: "#4dabf7", duration: 14, intervalMult: 0.72, extraCount: 1, targetRange: 430, damageBonus: 3, pickBuff: { label: "护盾 +6", shield: 6, dur: 3 } },
    missileBarrage: { name: "导弹齐射", desc: "导弹更多,爆炸范围扩大", color: "#ff922b", duration: 14, intervalMult: 0.78, extraCount: 1, damageBonus: 3, splashMult: 1.28, pickBuff: { label: "清弹 140", clearBullets: 140 } },
    chargeCore: { name: "蓄能核心", desc: "蓄力更快,冷却更短", color: "#ffd43b", duration: 13, chargeRate: 1.55, cooldownMult: 0.60, boostBonus: 4, pickBuff: { label: "能量 +10", energy: 10 } },
    capacitor: { name: "电容护盾", desc: "过载层可抵消伤害", color: "#74c0fc", duration: 16, block: 24, pickBuff: { label: "护盾 +12", shield: 12, dur: 4 } },
    sideGuns: { name: "侧翼炮组", desc: "主炮附加斜向火力", color: "#ffd43b", duration: 14, angle: 24, pickBuff: { label: "能量 +6", energy: 6 } },
    volatileCore: { name: "危险过载", desc: "分数更高,承伤也更高", color: "#ff6b6b", duration: 12, scoreBonus: 0.35, threatGainMult: 1.35, damageTakenMult: 1.16, pickBuff: { label: "能量 +10 / 护盾 +6", energy: 10, shield: 6, dur: 4 } },
  },
  bonusOrder: ["damage", "fireRate", "range", "maxHp", "reinforcedHull", "armorPlating", "fieldRepair", "repairLoop", "repairPulse", "leech", "livingArmor", "medicalReservoir", "painConverter", "missileRack", "pierce", "chainSpark", "salvage", "shieldAmplifier", "shieldBreaker", "kineticAmmo", "heavyRounds", "armorPiercer", "armorCaliber", "vitalReactor", "stableFire", "perfectLine", "sideCannons", "laserLens", "laserSplitter", "swarmCore", "homingShards", "signalFilter", "explosivePayload", "clusterWarheads", "missileInterceptor", "magnetCore", "comboBattery", "comboBarrage", "comboSurge", "chargeAmp", "executioner", "eliteHunter", "reactiveArmor", "lastStand", "glassCannon", "bossHunter", "weakScanner", "adrenaline", "emergencyBarrier", "overdrive"],
  bonuses: {
    damage: { name: "火力校准", desc: "全武器伤害 +12%", color: "#ff6b6b", damageMult: 0.12 },
    fireRate: { name: "加速扳机", desc: "主炮/副武器射速 +8%", color: "#4dabf7", cooldownMult: 0.08 },
    range: { name: "远程弹道", desc: "锁定距离和激光持续 +16%", color: "#51cf66", rangeMult: 0.16 },
    maxHp: { name: "装甲扩容", desc: "最大生命 +10 并治疗", color: "#38d9a9", weight: 130, hp: 10, pickBuff: { label: "护盾 +8", shield: 8, dur: 4 } },
    reinforcedHull: { name: "复合装甲", desc: "最大生命 +8% 并治疗,单次最多 +32", color: "#20c997", rarity: "稀有", weight: 58, hpPct: 0.08, maxHpPerPick: 32 },
    armorPlating: { name: "钛合装甲", desc: "承受伤害 -6%", color: "#74c0fc", rarity: "稀有", weight: 50, damageReductionMult: 0.06 },
    fieldRepair: { name: "纳米修复", desc: "4秒未受击后每秒回复1.6%最大生命", color: "#69db7c", rarity: "稀有", weight: 42, healPct: 0.016, delay: 4, tick: 1 },
    repairLoop: { name: "维修循环", desc: "每14秒恢复5%最大生命,满血转临时护盾", color: "#38d9a9", rarity: "稀有", weight: 36, every: 14, healPct: 0.05, shield: 6, maxShield: 30, dur: 5, pickBuff: { label: "立即修复 6%", healPct: 0.06 } },
    repairPulse: { name: "维修脉冲", desc: "治疗补给和维修循环会震击近身敌人", color: "#69db7c", rarity: "稀有", weight: 30, damage: 6, range: 155 },
    leech: { name: "吸能核心", desc: "击杀回复 1 生命,冷却 1.2 秒", color: "#e64980", heal: 1, cooldown: 1.2 },
    livingArmor: { name: "活性装甲", desc: "每12次非炸弹击杀永久最大生命 +2,每层最多 +40", color: "#2f9e44", rarity: "稀有", weight: 38, every: 12, hp: 2, maxHp: 40, pickBuff: { label: "护盾 +8", shield: 8, dur: 4 } },
    medicalReservoir: { name: "医疗储备", desc: "满血拾取治疗补给永久最大生命 +1,每层最多 +36", color: "#38d9a9", rarity: "稀有", weight: 36, hp: 1, maxHp: 36, pickBuff: { label: "护盾 +8", shield: 8, dur: 4 } },
    painConverter: { name: "痛觉转换", desc: "受伤时将损失生命转为必杀能量", color: "#f06595", rarity: "稀有", weight: 28, energyPerHp: 0.9, maxEnergy: 30, pickBuff: { label: "能量 +6", energy: 6 } },
    missileRack: { name: "备用弹仓", desc: "导弹 +1 且装填更快", color: "#ff922b", missileCount: 1, missileCooldownMult: 0.06 },
    pierce: { name: "穿甲弹链", desc: "主炮可额外穿透 1 个目标", color: "#ffd43b", pierce: 1 },
    chainSpark: { name: "连锁电弧", desc: "击杀会电击附近敌人", color: "#74c0fc", damage: 3, range: 210 },
    salvage: { name: "残骸回收", desc: "每 5 次击杀获得护盾", color: "#20c997", shield: 8, every: 5, dur: 5, pickBuff: { label: "护盾 +6", shield: 6, dur: 3 } },
    shieldAmplifier: { name: "护盾放大器", desc: "有护盾时全武器伤害 +14%", color: "#74c0fc", rarity: "稀有", weight: 34, damageMult: 0.14 },
    shieldBreaker: { name: "破盾电荷", desc: "对敌方护盾伤害 +45%,击破护盾时震击附近敌人", color: "#74c0fc", rarity: "稀有", weight: 34, shieldDamageMult: 0.45, breakDamage: 5, range: 130, pickBuff: { label: "清弹 120", clearBullets: 120 } },
    kineticAmmo: { name: "动能弹芯", desc: "主炮基础伤害 +1", color: "#ffa94d", bulletDamage: 1 },
    heavyRounds: { name: "钨芯重弹", desc: "主炮伤害 +2,主炮射速 -12%", color: "#ffd43b", rarity: "稀有", weight: 30, bulletDamage: 2, mainCooldownPenalty: 0.12 },
    armorPiercer: { name: "破甲弹芯", desc: "主炮对高生命敌机伤害 +28%", color: "#ff922b", rarity: "稀有", weight: 34, minHp: 12, heavyDamageMult: 0.28 },
    armorCaliber: { name: "装甲口径", desc: "每15额外最大生命,主炮伤害 +1,每层最多 +5", color: "#38d9a9", rarity: "稀有", weight: 32, hpPerDamage: 15, maxDamage: 5 },
    vitalReactor: { name: "生命炉心", desc: "每20额外最大生命,全武器伤害 +3%,每层最多 +26%", color: "#20c997", rarity: "稀有", weight: 30, hpPerDamageMult: 20, damageMult: 0.03, maxDamageMult: 0.26 },
    stableFire: { name: "稳态火控", desc: "生命高于70%时全武器伤害 +14%", color: "#38d9a9", rarity: "稀有", weight: 32, hpThreshold: 0.70, damageMult: 0.14 },
    perfectLine: { name: "完美航线", desc: "9秒未受击后伤害 +10%,射速 +6%", color: "#69db7c", rarity: "稀有", weight: 30, delay: 9, damageMult: 0.10, cooldownMult: 0.06 },
    sideCannons: { name: "侧翼炮塔", desc: "主炮附加斜向侧翼火力,最多3对", color: "#ffd43b", rarity: "稀有", weight: 30, angle: 18, offset: 20, maxPairs: 3 },
    laserLens: { name: "棱镜透镜", desc: "激光更痛、更窄、更久", color: "#cc5de8", rarity: "稀有", weight: 42, laserDamage: 1, laserWidthShrink: 0.06, laserDuration: 0.03 },
    laserSplitter: { name: "分束棱镜", desc: "每层增加1对低伤害激光副束,最多4对", color: "#be4bdb", rarity: "稀有", weight: 30, offset: 34, maxPairs: 4, damageMult: 0.38, widthMult: 0.62 },
    swarmCore: { name: "蜂群协议", desc: "追踪弹 +1,锁定和伤害提升", color: "#4dabf7", rarity: "稀有", weight: 38, extraCount: 1, homingDamage: 1, targetRangeMult: 0.10 },
    homingShards: { name: "追踪裂片", desc: "追踪弹命中时溅射附近敌人", color: "#4dabf7", rarity: "稀有", weight: 32, damage: 1, range: 105 },
    signalFilter: { name: "抗干扰滤波", desc: "扰频减速效果降低 14%", color: "#15aabf", rarity: "稀有", weight: 34, jamResist: 0.14 },
    explosivePayload: { name: "高爆载荷", desc: "导弹伤害和爆炸范围提升", color: "#ff922b", rarity: "稀有", weight: 38, missileDamage: 2, splashMult: 0.20 },
    clusterWarheads: { name: "集束弹头", desc: "导弹命中后释放追踪子弹", color: "#ff922b", rarity: "史诗", weight: 18, count: 2, maxCount: 6 },
    missileInterceptor: { name: "拦截爆破", desc: "导弹爆炸会清除爆点附近敌弹", color: "#ff922b", rarity: "稀有", weight: 32, rangeMult: 0.80, pickBuff: { label: "清弹 160", clearBullets: 160 } },
    magnetCore: { name: "回收磁场", desc: "补给吸附范围 +55%", color: "#20c997", magnetMult: 0.55, pickBuff: { label: "能量 +6", energy: 6 } },
    comboBattery: { name: "连击电池", desc: "每 10 连击获得能量和护盾", color: "#ffd43b", rarity: "稀有", weight: 36, energy: 12, shield: 6, dur: 4, pickBuff: { label: "能量 +8 / 护盾 +6", energy: 8, shield: 6, dur: 4 } },
    comboBarrage: { name: "连击弹幕", desc: "每 10 连击释放追踪弹幕", color: "#4dabf7", rarity: "稀有", weight: 34, count: 2, maxCount: 8 },
    comboSurge: { name: "连击涡轮", desc: "每 10 连击获得 1 层过载", color: "#ffd43b", rarity: "史诗", weight: 18, overcharge: 1 },
    chargeAmp: { name: "蓄能放大器", desc: "蓄力激光更强,冷却更短", color: "#f783ac", rarity: "稀有", weight: 34, boostBonus: 3, cooldownMult: 0.10 },
    executioner: { name: "处决算法", desc: "对 40% 血以下敌人伤害 +25%", color: "#e64980", rarity: "稀有", weight: 34, threshold: 0.4, damageMult: 0.25 },
    eliteHunter: { name: "王牌猎手", desc: "对精英敌伤害 +28%", color: "#ff6b6b", rarity: "稀有", weight: 32, eliteDamageMult: 0.28 },
    reactiveArmor: { name: "反应装甲", desc: "护盾格挡时震击近身敌人", color: "#74c0fc", rarity: "稀有", weight: 30, damage: 6, range: 150 },
    lastStand: { name: "黑匣子保险", desc: "致命伤保留 1 生命并展开护盾", color: "#845ef7", rarity: "史诗", weight: 12, shield: 26, maxShield: 70, dur: 5, cooldown: 70, pickBuff: { label: "护盾 +12", shield: 12, dur: 4 } },
    glassCannon: { name: "玻璃大炮", desc: "全武器伤害 +28%,承伤 +22%", color: "#ff6b6b", rarity: "稀有", weight: 28, damageMult: 0.28, damageTakenMult: 0.22 },
    bossHunter: { name: "猎首协议", desc: "对 Boss 伤害 +30%", color: "#cc5de8", rarity: "稀有", weight: 30, bossDamageMult: 0.30 },
    weakScanner: { name: "弱点标定", desc: "Boss弱点窗口 +0.3秒,弱点伤害 +18%", color: "#ffd43b", rarity: "稀有", weight: 26, weakDamageMult: 0.18, weakDuration: 0.3 },
    adrenaline: { name: "肾上腺素", desc: "半血以下伤害和射速大幅提升", color: "#ff8787", rarity: "史诗", weight: 16, threshold: 0.5, damageMult: 0.24, cooldownMult: 0.14 },
    emergencyBarrier: { name: "应急力场", desc: "低血量受伤自动展开护盾", color: "#74c0fc", rarity: "史诗", weight: 14, threshold: 0.35, shield: 22, maxShield: 56, dur: 6, cooldown: 18, pickBuff: { label: "护盾 +12", shield: 12, dur: 4 } },
    overdrive: { name: "过载弹幕", desc: "射速 +20%,承伤 +17%", color: "#ffd43b", rarity: "史诗", weight: 12, cooldownMult: 0.20, damageTakenMult: 0.17 },
  },
  elite: {
    minLevel: 3, baseChance: 0.035, levelChance: 0.012, endlessChance: 0.04, threatChance: 0.02, maxChance: 0.18, types: ["shield", "charger", "berserker", "repair", "jammer"],
    shield: { name: "护盾", color: "#74c0fc", hpMult: 1.15, shield: 12, scoreMult: 1.35 },
    charger: { name: "充能", color: "#ffd43b", hpMult: 1.08, scoreMult: 1.45, cd: 2.4, warn: 0.65, count: 3, spread: 18, speed: 340, damageMult: 1.15 },
    berserker: { name: "狂暴", color: "#ff6b6b", hpMult: 0.92, speedMult: 1.18, fireMult: 0.78, scoreMult: 1.5 },
    repair: { name: "再生", color: "#69db7c", hpMult: 1.06, scoreMult: 1.42, regenEvery: 2.6, regenPct: 0.08 },
    jammer: { name: "扰频", color: "#15aabf", hpMult: 1.04, scoreMult: 1.44, jamRadius: 220, weaponSlow: 1.18 },
  },
  bomb: { bossDamage: 70, flash: 0.35 },
  bossPhase: { weakDuration: 2.4, weakDamageMult: 0.25 },
  bossInvuln: { minCount: 2, maxCount: 3, minDuration: 5, maxDuration: 10 },

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
    { name: "棱镜审判者", hp: 1900, radius: 72, score: 32000, enterY: 150, damage: 14, shape: "hex", taunt: "所有航线,都将被光校准。",
      colors: ["#dbe4ff", "#cc5de8", "#ff3b3b"], movement: "sweep", moveSpeed: 1.35, moveRange: 190,
      phases: [
        { until: 0.70, cd: 1.05, attacks: [ { type: "laser", warn: 0.6, dur: 0.75, width: 46, cd: 4.2, aimed: true }, { type: "fanDown", count: 5, spread: 62, speed: 265 } ] },
        { until: 0.35, cd: 1.00, attacks: [ { type: "prismBurst", warn: 0.55, dur: 0.7, width: 48, cd: 4.0, count: 6, speed: 205 }, { type: "wall", spacing: 48, gap: 100, speed: 195 } ] },
        { until: 0.00, cd: 0.92, attacks: [ { type: "dualLaser", warn: 0.55, dur: 0.85, width: 42, cd: 3.5, offset: 82 }, { type: "spiral", arms: 2, step: 18, speed: 200 } ] },
      ] },
    { name: "铁幕空母", hp: 2300, radius: 82, score: 38000, enterY: 145, damage: 13, shape: "octagon", taunt: "舰载群,展开铁幕。",
      colors: ["#868e96", "#495057", "#ff3b3b"], movement: "figure8", moveSpeed: 1.0, moveRange: 135, guardDR: 0.35,
      phases: [
        { until: 0.75, cd: 1.25, attacks: [ { type: "escort", enemy: "medium", adds: 2, maxAdds: 4, name: "舰载", color: "#adb5bd" }, { type: "fanDown", count: 6, spread: 64, speed: 255 } ] },
        { until: 0.40, cd: 1.05, attacks: [ { type: "escort", enemy: "warden", adds: 1, maxAdds: 4, name: "铁幕", color: "#91a7ff" }, { type: "wall", spacing: 42, gap: 92, speed: 205 } ] },
        { until: 0.00, cd: 0.95, attacks: [ { type: "escort", enemy: "gunner", elite: "berserker", adds: 2, maxAdds: 5, name: "王牌", color: "#ff6b6b" }, { type: "ring", count: 22, speed: 235 }, { type: "aimed", count: 3, spread: 16, speed: 300 } ] },
      ] },
    { name: "引潮核心", hp: 2600, radius: 78, score: 45000, enterY: 150, damage: 15, shape: "star", taunt: "靠近核心,或被天空抛弃。",
      colors: ["#4dabf7", "#1c7ed6", "#ff3b3b"], movement: "dart", moveSpeed: 1.15, moveRange: 160, dartEvery: 2.0,
      phases: [
        { until: 0.68, cd: 1.20, attacks: [ { type: "gravity", warn: 0.8, dur: 2.0, radius: 410, strength: 85 }, { type: "ring", count: 16, speed: 190 } ] },
        { until: 0.32, cd: 1.05, attacks: [ { type: "gravity", warn: 0.65, dur: 1.8, radius: 430, strength: 100 }, { type: "wall", spacing: 40, gap: 86, speed: 205 } ] },
        { until: 0.00, cd: 0.95, attacks: [ { type: "gravity", warn: 0.55, dur: 1.6, radius: 450, strength: -115 }, { type: "laser", warn: 0.5, dur: 0.85, width: 52, cd: 3.2, aimed: true }, { type: "spiral", arms: 3, step: 19, speed: 205 } ] },
      ] },
    { name: "失控原型机", hp: 2400, radius: 74, score: 42000, enterY: 150, damage: 14, shape: "delta", taunt: "原型限制解除。",
      colors: ["#fcc419", "#9775fa", "#ff3b3b"], movement: "figure8", moveSpeed: 1.25, moveRange: 170, prototype: true,
      phases: [
        { until: 0.70, cd: 0.95, attacks: [ { type: "fanDown", count: 8, spread: 82, speed: 265 }, { type: "escort", enemy: "beacon", adds: 1, maxAdds: 3, name: "原型", color: "#fcc419" } ] },
        { until: 0.35, cd: 0.85, attacks: [ { type: "prismBurst", warn: 0.55, dur: 0.65, width: 48, cd: 3.8, count: 6, speed: 215 }, { type: "spiral", arms: 3, step: 21, speed: 210 } ] },
        { until: 0.00, cd: 0.85, attacks: [ { type: "gravity", warn: 0.55, dur: 1.4, radius: 420, strength: 95 }, { type: "wall", spacing: 36, gap: 78, speed: 220 }, { type: "ring", count: 24, speed: 245 } ] },
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
      weaponBias: { cooldownMult: 0.96 },
      perkName: "全面均衡", perkDesc: "副武器循环小幅加快,新手推荐",
      specialType: "wave", specialName: "破阵冲击波", specialDesc: "向前发射一道扩散能量波,抵消沿途弹幕并对敌机造成伤害" },
    attacker: { key: "attacker", name: "攻击型", color: "#ff6b6b", desc: "火力猛·皮薄",  hpMult: 0.75, fireMult: 0.78, bombs: 0, wings: 0,
      bodyShape: "twin", lerpMult: 1.1, radiusMult: 0.95, dmgTakenMult: 1.0, energyMult: 1.0, comboTimeoutMult: 1.4, bombDmgMult: 1.0, specialCooldownMult: 1.0,
      weaponBias: { laserDamageBonus: 1, chargeBoostBonus: 2, chargeCooldownMult: 0.9 },
      perkName: "狂热连击", perkDesc: "连击 +40% · 激光/蓄力更强",
      specialType: "nuke", specialName: "全屏轰杀", specialDesc: "对场上所有敌机造成重伤,并获得短暂无敌" },
    defender: { key: "defender", name: "防御型", color: "#38d9a9", desc: "血厚·多炸弹",  hpMult: 1.5, fireMult: 1.18, bombs: 2, wings: 0,
      bodyShape: "bulk", lerpMult: 0.85, radiusMult: 1.15, dmgTakenMult: 0.8, energyMult: 1.0, comboTimeoutMult: 1.0, bombDmgMult: 1.25, specialCooldownMult: 1.0,
      weaponBias: { missileDamageBonus: 1, missileSplashMult: 1.18 },
      perkName: "钢铁装甲", perkDesc: "受到伤害 -20% · 导弹溅射更强",
      specialType: "shield", specialName: "护盾展开", specialDesc: "立即回复部分生命,并展开最多抵挡2次伤害的能量护盾" },
    scout: { key: "scout", name: "侦查型", color: "#ffd43b", desc: "机动灵活·体积小", hpMult: 0.65, fireMult: 0.92, bombs: 1, wings: 0,
      bodyShape: "dart", lerpMult: 1.5, radiusMult: 0.78, dmgTakenMult: 1.0, energyMult: 1.15, comboTimeoutMult: 1.0, bombDmgMult: 1.0, specialCooldownMult: 0.75,
      weaponBias: { homingIntervalMult: 0.9, homingTurnBonus: 1.1, chargeRate: 1.1 },
      perkName: "灵敏机动", perkDesc: "机动/能量更强 · 追踪弹与蓄力更灵活",
      specialType: "stealth", specialName: "光学迷彩", specialDesc: "短暂隐身,期间免疫所有伤害" },
  },
  // A:僚机上限。B:必杀(能量攒满 + 冷却结束才可释放,offensive 全屏重伤;对 BOSS 伤害减半)
  wingMax: 6,
  // X3:cooldown 10→15(必杀强度没变,拉长间隔避免刷太快);新增 passiveGainPerSec —— 除了击杀攒能量,不管有没有击杀都按秒缓慢回能
  //   (60秒能从0攒满,纯粹是保底,不会比正常边打边攒更快),避免"没打到东西的时候必杀完全不涨"的干等感
  // X4:机型专属必杀参数——shieldHp/shieldDur/healOnShield 给防御型;stealthDur 给侦查型;waveDamage/waveSpeed/waveWidthGrow 给平衡型
  special: { bossDamage: 110, gainPerKill: 3, gainBossKill: 25, passiveGainPerSec: 1.7, invuln: 0.8, cooldown: 15,
    shieldHp: 60, shieldDur: 9, shieldHits: 2, healOnShield: 0.3, stealthDur: 4.0, waveDamage: 45 },
  endlessDifficulties: {
    normal: {
      key: "normal", name: "常规演练", color: "#4dabf7",
      playerHpMult: 1, playerDmgMult: 3, startWings: 0, startPower: 0,
      startingDrafts: 2, draftInterval: 30,
      enemyHpMult: 0.40, bossHpMult: 0.52, enemySpeedMult: 1,
      enemyHpBoostMult: 1.30, enemyHpDoubleInterval: 360,
      dmgRampMult: 2.2, dmgDoubleInterval: 420,
      scoreMult: 1.0, fireMult: 1.0, dmgMult: 1.0, invuln: 1.2, startBombs: 3,
    },
    hell: {
      key: "hell", name: "绝境深潜", color: "#ff6b6b",
      playerHpMult: 2, playerDmgMult: 3, startWings: 2, startPower: 2,
      startingDrafts: 3, draftInterval: 30,
      enemyHpMult: 0.65, bossHpMult: 5, enemySpeedMult: 1.15,
      enemyHpBoostMult: 1.80, enemyHpDoubleInterval: 240,
      dmgRampMult: null, dmgDoubleInterval: null,
      scoreMult: 1.5, fireMult: 1.0, dmgMult: 1.0, invuln: 1.2, startBombs: 3, bossInvulnDuration: 5, bossBulletMult: 1.25,
    },
  },
  // F 无尽模式:玩家血量倍率更低、同屏敌人上限更小。T:难度统一固定,不跟随地图选择
  // dmgRampTime/dmgRampMult:经典无尽关卡(endlessLite)敌弹伤害从 t=0 的 1 倍线性增长,到 dmgRampTime 秒时封顶为 dmgRampMult 倍
  // GG:dmgDoubleInterval 给无尽挑战(非 lite)用——伤害按 2^(t/此值) 指数增长,不封顶,每过这么多秒伤害翻一倍
  endless: {
    hpMult: 0.7, maxEnemies: 10, diffKey: "normal", startingDrafts: 2, dmgRampTime: 300, dmgRampMult: 3, dmgDoubleInterval: 300, enemyHpBaseMult: 1.15, enemyHpBoostTime: 60, enemyHpBoostMult: 1.8, enemyHpDoubleInterval: 240, enemyHpFloorTime: 35, enemyHpFloor: 170, enemyHpFloorTargetTime: 200, enemyHpFloorTarget: 5600, enemyHpFloorDoubleInterval: 240, enemyHpLateTime: 300, enemyHpLateDoubleInterval: 150, enemyHpFloorLateDoubleInterval: 180, enemyHpFloorMax: 22000,
    dynamicHp: { startTime: 300, interval: 60, enemyLife: 3, enemyFailRatio: 0.9, enemyTargetLife: 2, enemyMinSamples: 10, bossTargetLife: 60, bossMinGap: 10, bossDamageReduction: 0.5, enemyDamageReduction: 0.2, score: 3000 },
    worldInterval: 40, powerupChance: 0.09,
    eventInterval: 28, eventDuration: 16, eventClearScore: 700, eventCleanShield: 18, eventCleanShieldDur: 5,
    spawn: { initialDelay: 1.0, intervalBase: 1.8, intervalDecay: 0.008, intervalMin: 0.8, countBase: 2, countStepSec: 15, countStepMax: 3 },
    moves: ["sine", "zigzag", "dive", "straight", "swoop", "orbit"],
    pools: [
      { until: 20, enemies: ["small", "small", "medium"] },
      { until: 50, enemies: ["small", "medium", "medium", "large", "gunner"] },
      { until: 100, enemies: ["small", "medium", "large", "gunner", "splitter", "beacon"] },
      { until: 160, enemies: ["small", "medium", "large", "gunner", "splitter", "sniper", "detonator", "jammer", "shieldCarrier", "beacon", "phaseWing"] },
      { until: 250, enemies: ["small", "medium", "large", "gunner", "splitter", "sniper", "detonator", "mineLayer", "jammer", "support", "shieldCarrier", "phantom", "phantom", "carrier", "warden", "kamikaze"] },
      { enemies: ["small", "medium", "large", "gunner", "splitter", "sniper", "detonator", "mineLayer", "jammer", "support", "shieldCarrier", "shieldCarrier", "phantom", "phantom", "carrier", "carrier", "mirrorDrone", "tether", "warden", "harvester", "kamikaze"] },
    ],
    events: [
      { key: "supplyStorm", name: "补给风暴", color: "#38d9a9", sub: "掉落率上升", routeBias: "生存", powerupChanceAdd: 0.16 },
      { key: "eliteAirspace", name: "精英空域", color: "#ff8787", sub: "精英敌增多", routeBias: "主炮", eliteChance: 0.48, spawnBonus: 1 },
      { key: "overloadField", name: "过载磁场", color: "#ffd43b", sub: "分数提升,威胁提升", routeBias: "风险", scoreBonus: 0.18, threatGainMult: 1.25 },
      { key: "ambush", name: "伏击航道", color: "#74c0fc", sub: "敌群加密,补给偏防御", routeBias: "生存", spawnBonus: 2, powerupChanceAdd: 0.06, forceDrop: "heal" },
      { key: "armoredAirspace", name: "重甲空域", color: "#74c0fc", sub: "敌机生命提升,补给偏防御", routeBias: "生存", enemyHpMult: 0.22, powerupChanceAdd: 0.04, forceDrop: "heal" },
      { key: "noHitRun", name: "无伤穿越", color: "#38d9a9", sub: "限时无伤,受击目标失败", routeBias: "生存", minTime: 70, spawnBonus: 1, powerupChanceAdd: 0.04, forceDrop: "heal", scoreBonus: 0.09, noHitGoal: true },
      { key: "annihilationOrder", name: "歼灭令", color: "#ffd43b", sub: "限时击杀目标,完成才结算", routeBias: "主炮", minTime: 80, enemyType: "medium", enemyChance: 0.48, spawnBonus: 2, scoreBonus: 0.08, killGoal: 16 },
      { key: "aceHunt", name: "猎杀王牌", color: "#ff6b6b", sub: "精英敌增多,击破王牌目标", routeBias: "主炮", minTime: 100, enemyType: "gunner", enemyChance: 0.55, eliteChance: 0.72, spawnBonus: 1, scoreBonus: 0.10, eliteGoal: 4 },
      { key: "repairConvoy", name: "维修航队", color: "#51cf66", sub: "支援机增多,敌群更耐打", routeBias: "导弹", minTime: 110, enemyType: "support", enemyChance: 0.4, spawnBonus: 1, enemyHpMult: 0.12, scoreBonus: 0.09 },
      { key: "ionStorm", name: "离子风暴", color: "#cc5de8", sub: "周期镭射航道", routeBias: "激光", laserEvery: 4.2, laserDelay: 1.2, warn: 0.72, dur: 0.5, width: 34, damage: 7, jitter: 190 },
      { key: "crossfire", name: "交叉火线", color: "#ff922b", sub: "周期侧向弹幕", routeBias: "生存", minTime: 120, bulletEvery: 3.8, bulletDelay: 1.0, bulletRows: 5, bulletSpeed: 250, bulletDamage: 6, scoreBonus: 0.10 },
      { key: "jammerCloud", name: "扰频云层", color: "#15aabf", sub: "干扰机增多", routeBias: "追踪", spawnBonus: 1, jammerChance: 0.42 },
      { key: "sniperLockdown", name: "狙击封锁", color: "#e64980", sub: "狙击机增多,分数提升", routeBias: "主炮", minTime: 90, enemyType: "sniper", enemyChance: 0.46, spawnBonus: 1, powerupChanceAdd: 0.03, scoreBonus: 0.09 },
      { key: "minefield", name: "爆雷空域", color: "#fab005", sub: "爆雷机增多,分数和威胁提升", routeBias: "导弹", minTime: 130, enemyType: "detonator", enemyChance: 0.44, spawnBonus: 1, scoreBonus: 0.12, threatGainMult: 1.12 },
      { key: "shieldWall", name: "护盾纵队", color: "#74c0fc", sub: "护盾运输机增多,敌群更耐打", routeBias: "主炮", minTime: 140, enemyType: "shieldCarrier", enemyChance: 0.42, spawnBonus: 1, enemyHpMult: 0.08, scoreBonus: 0.10 },
      { key: "phantomWing", name: "幻影编队", color: "#22d3ee", sub: "高速幻影机增多", routeBias: "追踪", minTime: 150, enemyType: "phantom", enemyChance: 0.5, spawnBonus: 1, powerupChanceAdd: 0.02, scoreBonus: 0.10 },
      { key: "carrierRaid", name: "母舰压境", color: "#9775fa", sub: "母舰机增多,击毁后分裂僚机", routeBias: "主炮", minTime: 170, enemyType: "carrier", enemyChance: 0.34, spawnBonus: 1, enemyHpMult: 0.08, scoreBonus: 0.12 },
      { key: "shieldedAmbush", name: "盾幕伏击", color: "#91a7ff", sub: "监押机护住敌群", routeBias: "主炮", minTime: 150, enemyType: "warden", enemyChance: 0.4, spawnBonus: 1, enemyHpMult: 0.06, scoreBonus: 0.11 },
      { key: "sniperCrossfire", name: "狙击交叉线", color: "#f06595", sub: "狙击机与侧向弹幕夹击", routeBias: "生存", minTime: 150, enemyType: "sniper", enemyChance: 0.42, spawnBonus: 1, bulletEvery: 4.4, bulletDelay: 1.0, bulletRows: 4, bulletSpeed: 230, bulletDamage: 6, scoreBonus: 0.10 },
      { key: "blackoutRaid", name: "黑障突袭", color: "#15aabf", sub: "扰频精英和信标机增多", routeBias: "追踪", minTime: 160, enemyType: "beacon", enemyChance: 0.34, jammerChance: 0.25, eliteChance: 0.45, spawnBonus: 1, scoreBonus: 0.10 },
      { key: "rearAssault", name: "尾后突袭", color: "#ff6b6b", sub: "自爆机从身后追袭", routeBias: "生存", minTime: 130, enemyType: "kamikaze", enemyChance: 0.46, spawnBonus: 1, powerupChanceAdd: 0.02, scoreBonus: 0.10 },
      { key: "mineLayerRun", name: "浮雷航道", color: "#ff922b", sub: "布雷机封锁安全线", routeBias: "导弹", minTime: 160, enemyType: "mineLayer", enemyChance: 0.42, spawnBonus: 1, scoreBonus: 0.11, threatGainMult: 1.08 },
      { key: "hornetPursuit", name: "黄蜂追迹", color: "#ffd43b", sub: "信标机与重炮机释放追踪弹", routeBias: "生存", minTime: 150, enemyType: "beacon", enemyChance: 0.48, spawnBonus: 1, scoreBonus: 0.10, threatGainMult: 1.08 },
      { key: "scorchedLane", name: "燃烧航道", color: "#ff922b", sub: "布雷机留下持续火区", routeBias: "生存", minTime: 175, enemyType: "mineLayer", enemyChance: 0.46, spawnBonus: 1, enemyHpMult: 0.05, scoreBonus: 0.11, threatGainMult: 1.10 },
      { key: "tetherNet", name: "牵引网", color: "#20c997", sub: "牵引机轻拉航线", routeBias: "生存", minTime: 190, enemyType: "tether", enemyChance: 0.36, spawnBonus: 1, powerupChanceAdd: 0.03, scoreBonus: 0.10 },
      { key: "frostNet", name: "冰冻网", color: "#74c0fc", sub: "牵引机留下减速冰区", routeBias: "生存", minTime: 220, enemyType: "tether", enemyChance: 0.44, spawnBonus: 1, enemyHpMult: 0.05, scoreBonus: 0.11 },
      { key: "harvestRush", name: "收割突袭", color: "#fcc419", sub: "收割机抢夺补给", routeBias: "风险", minTime: 210, enemyType: "harvester", enemyChance: 0.34, spawnBonus: 1, powerupChanceAdd: 0.06, scoreBonus: 0.13 },
    ],
    boss: {
      firstDelay: 30, interval: 35, baseHpMult: 1, secondHpMult: 5, hpGrowthMult: 2, hpGrowthMax: 80, drStart: 0.10, drStep: 0.05, drMax: 0.30,
      affixes: [
        { key: "armored", name: "装甲", desc: "生命更高", color: "#74c0fc", hpMult: 0.18, scoreMult: 1.12 },
        { key: "rapid", name: "急袭", desc: "攻击更快", color: "#ff8787", fireMult: 0.82, scoreMult: 1.15 },
        { key: "prism", name: "棱镜", desc: "周期瞄准镭射", color: "#cc5de8", attack: "laser", every: 5.5, warn: 0.55, dur: 0.65, width: 42, damageMult: 0.85, scoreMult: 1.16 },
        { key: "barrage", name: "弹幕", desc: "周期环形弹幕", color: "#ff922b", attack: "ring", every: 6.2, count: 14, speed: 230, damageMult: 0.78, scoreMult: 1.16 },
        { key: "escort", name: "护卫", desc: "周期投放精英僚机", color: "#51cf66", attack: "escort", every: 7.5, enemy: "gunner", elite: "charger", maxAdds: 4, scoreMult: 1.14 },
        { key: "aceEscort", name: "王牌", desc: "周期投放狂暴精英重炮机", color: "#ff6b6b", attack: "escort", every: 8.0, enemy: "gunner", elite: "berserker", maxAdds: 3, scoreMult: 1.18 },
        { key: "eliteCommand", name: "统御", desc: "周期召唤高空精英机", color: "#ff6b6b", attack: "escort", every: 6.5, enemy: "gunner", elite: "berserker", maxAdds: 3, hpPct: 0.2, holdTop: true, scoreMult: 1.22 },
        { key: "ewar", name: "电子战", desc: "周期投放扰频精英机", color: "#15aabf", attack: "escort", every: 8.2, enemy: "jammer", elite: "jammer", maxAdds: 3, scoreMult: 1.18 },
        { key: "shieldEscort", name: "盾卫", desc: "周期投放护盾运输机", color: "#74c0fc", attack: "escort", every: 8.8, enemy: "shieldCarrier", maxAdds: 3, scoreMult: 1.17 },
        { key: "phantomEscort", name: "幻影", desc: "周期投放高速幻影僚机", color: "#22d3ee", attack: "escort", every: 7.0, enemy: "phantom", maxAdds: 4, scoreMult: 1.16 },
        { key: "swarmEscort", name: "蜂群", desc: "周期投放多架小型机", color: "#fab005", attack: "escort", every: 5.8, enemy: "small", adds: 3, maxAdds: 6, scoreMult: 1.15 },
        { key: "exposedCore", name: "露核", desc: "周期暴露弱点", color: "#ffd43b", attack: "weak", every: 7.2, dur: 2.6, weakDamageMult: 0.35, scoreMult: 1.12 },
        { key: "repair", name: "维修", desc: "周期恢复生命", color: "#38d9a9", attack: "repair", every: 6.8, healPct: 0.035, scoreMult: 1.17 },
        { key: "jammer", name: "扰频", desc: "靠近时武器变慢", color: "#15aabf", jamRadius: 300, weaponSlow: 1.25, scoreMult: 1.13 },
        { key: "ironclad", name: "铁幕", desc: "生命更高并周期投放监押机", color: "#91a7ff", hpMult: 0.22, attack: "escort", every: 8.6, enemy: "warden", maxAdds: 3, scoreMult: 1.2 },
        { key: "sniperEscort", name: "狙卫", desc: "周期投放狙击僚机", color: "#f06595", attack: "escort", every: 8.4, enemy: "sniper", elite: "charger", maxAdds: 3, scoreMult: 1.18 },
        { key: "prismArmor", name: "棱甲", desc: "生命提升并周期瞄准镭射", color: "#cc5de8", hpMult: 0.12, attack: "laser", every: 5.2, warn: 0.5, dur: 0.7, width: 44, damageMult: 0.85, scoreMult: 1.18 },
        { key: "crossBarrage", name: "交火", desc: "周期密集环形弹幕", color: "#ff922b", attack: "ring", every: 5.4, count: 18, speed: 250, damageMult: 0.8, scoreMult: 1.18 },
        { key: "rearGuard", name: "尾袭", desc: "周期投放后方自爆机", color: "#ff6b6b", attack: "escort", every: 7.4, enemy: "kamikaze", adds: 2, maxAdds: 4, scoreMult: 1.17 },
        { key: "gravity", name: "引潮", desc: "周期释放轻牵引环", color: "#4dabf7", attack: "gravity", every: 7.0, radius: 420, strength: 95, dur: 2.0, warn: 0.7, scoreMult: 1.18 },
        { key: "carrier", name: "空母", desc: "周期投放护卫编队", color: "#51cf66", attack: "escort", every: 7.8, enemy: "phaseWing", adds: 2, maxAdds: 4, scoreMult: 1.17 },
        { key: "prismBurst", name: "棱爆", desc: "镭射后散出慢速侧弹", color: "#cc5de8", attack: "prismBurst", every: 5.8, warn: 0.55, dur: 0.65, width: 42, count: 6, speed: 210, damageMult: 0.78, scoreMult: 1.19 },
        { key: "weakDeck", name: "甲板", desc: "周期暴露高伤弱点", color: "#ffd43b", attack: "weak", every: 9.0, dur: 2.7, weakDamageMult: 0.45, scoreMult: 1.13 },
      ],
    },
  },
  challenge: { rulesVersion: 92, splits: [30, 60, 120] },

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
  worldIntro: ["第一战区 · 近海突破", "第二战区 · 大漠强袭", "第三战区 · 夜空决战", "第四战区 · 深渊禁地", "第五战区 · 虚空回廊", "第六战区 · 棱镜天幕", "第七战区 · 铁幕航母", "第八战区 · 引潮核心"],

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

