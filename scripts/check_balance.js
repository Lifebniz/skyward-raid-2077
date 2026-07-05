"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const sandbox = { console, Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("src/config.js", "utf8") + "\nglobalThis.CONFIG = CONFIG;", sandbox);
vm.runInContext(fs.readFileSync("src/core.js", "utf8"), sandbox);
vm.runInContext(fs.readFileSync("src/game.js", "utf8") + "\nglobalThis.game = game;", sandbox);
const { CONFIG } = sandbox;
const { game } = sandbox;
sandbox.FloatText = class FloatText { constructor(x, y, text, color) { this.x = x; this.y = y; this.text = text; this.color = color; } };

const between = (value, min, max, label) => assert(value >= min && value <= max, `${label} ${value} outside ${min}-${max}`);
const unique = (items, label) => assert.strictEqual(new Set(items).size, items.length, `${label} has duplicate keys`);

assert(CONFIG && CONFIG.player && CONFIG.endless, "CONFIG did not load");

between(CONFIG.powerup.chipMinEndlessTime, 15, 30, "first endless draft delay");
between(CONFIG.powerup.chipDraftInterval, 15, 30, "endless draft interval");
between(CONFIG.endless.maxEnemies, 8, 20, "endless max enemies");
between(CONFIG.endless.enemyHpRampMult, 1.5, 3.2, "endless enemy HP ramp");
between(CONFIG.endless.dmgRampMult, 1.5, 3.5, "endless damage ramp");
between(CONFIG.endless.boss.firstDelay, 20, 45, "first boss delay");
between(CONFIG.endless.boss.interval, 25, 55, "boss interval");
between(CONFIG.endless.eventClearScore, 300, 1800, "event clear score");
between(CONFIG.endless.eventCleanShield, 8, 50, "event clean shield");
between(CONFIG.endless.eventCleanShieldDur, 2, 10, "event clean shield duration");

const enemyKeys = new Set(Object.keys(CONFIG.enemy));
const eliteTypes = CONFIG.elite.types || [];
unique(eliteTypes, "elite types");
assert(eliteTypes.length >= 5, "elite type variety should include at least 5 types");
assert(eliteTypes.includes("jammer"), "elite type variety should include jammer");
for (const key of eliteTypes) {
  const e = CONFIG.elite[key];
  assert(e && e.name && e.color, `elite ${key} needs readable text`);
  if (e.hpMult) between(e.hpMult, 0.75, 1.35, `elite ${key} hpMult`);
  if (e.speedMult) between(e.speedMult, 1, 1.45, `elite ${key} speedMult`);
  if (e.fireMult) between(e.fireMult, 0.6, 1, `elite ${key} fireMult`);
  if (e.regenEvery) between(e.regenEvery, 1.5, 4, `elite ${key} regenEvery`);
  if (e.regenPct) between(e.regenPct, 0.03, 0.12, `elite ${key} regenPct`);
  if (e.jamRadius) between(e.jamRadius, 140, 280, `elite ${key} jamRadius`);
  if (e.weaponSlow) between(e.weaponSlow, 1.05, 1.4, `elite ${key} weaponSlow`);
}
game.boss = null; game.enemies = [{ dead: false, x: 100, y: 100, radius: 20, type: "medium", eliteCfg: CONFIG.elite.jammer }];
assert(game.jamFactor(100, 100) > 1, "jammer elite should slow weapons in range");
assert.strictEqual(game.jamFactor(500, 100), 1, "jammer elite should not slow weapons out of range");
for (const [i, pool] of CONFIG.endless.pools.entries()) {
  assert(pool.enemies && pool.enemies.length, `endless pool ${i} is empty`);
  for (const type of pool.enemies) assert(enemyKeys.has(type), `pool ${i} references missing enemy ${type}`);
}

const eventKeys = CONFIG.endless.events.map(e => e.key);
unique(eventKeys, "endless events");
const routeNames = new Set(["主炮", "激光", "追踪", "导弹", "生存", "风险"]);
const drops = new Set(["power", "heal", "bomb", "wing", "chip"]);
for (const e of CONFIG.endless.events) {
  assert(e.name && e.sub, `event ${e.key} needs readable text`);
  if (e.routeBias) assert(routeNames.has(e.routeBias), `event ${e.key} has invalid routeBias ${e.routeBias}`);
  if (e.minTime != null) between(e.minTime, 0, 300, `event ${e.key} minTime`);
  if (e.enemyType) assert(enemyKeys.has(e.enemyType), `event ${e.key} references missing enemy ${e.enemyType}`);
  if (e.enemyChance != null) between(e.enemyChance, 0, 0.75, `event ${e.key} enemyChance`);
  if (e.spawnBonus != null) between(e.spawnBonus, 0, 3, `event ${e.key} spawnBonus`);
  if (e.scoreBonus != null) between(e.scoreBonus, 0, 0.35, `event ${e.key} scoreBonus`);
  if (e.threatGainMult != null) between(e.threatGainMult, 1, 1.5, `event ${e.key} threatGainMult`);
  if (e.forceDrop) assert(drops.has(e.forceDrop), `event ${e.key} has invalid forceDrop ${e.forceDrop}`);
  if (e.powerupChanceAdd != null) between(CONFIG.endless.powerupChance + e.powerupChanceAdd, 0, 0.4, `event ${e.key} total powerup chance`);
  if (e.enemyHpMult != null) between(e.enemyHpMult, 0, 0.6, `event ${e.key} enemyHpMult`);
  if (e.laserEvery) {
    between(e.laserEvery, 3, 7, `event ${e.key} laserEvery`);
    between(e.warn || 0, 0.4, 1.2, `event ${e.key} laser warn`);
    between(e.width || 0, 20, 70, `event ${e.key} laser width`);
  }
}
game.score = 0; game.threat = 0; game.bonuses = {}; game.chips = {}; game.floats = []; game._endlessEventTimer = 0; game._endlessStats = { hits: 2 }; game._endlessEventStartHits = 1;
game.player = { x: 100, y: 100, shieldHp: 0, grantShield(n, dur) { this.shieldHp = n; this.shieldTimer = dur; } };
const eventHitGain = game.finishEndlessEvent(CONFIG.endless.events[0]);
assert.strictEqual(eventHitGain, CONFIG.endless.eventClearScore, "event clear should grant base score after hits");
assert.strictEqual(game.player.shieldHp, 0, "event clear should not grant clean shield after hits");
game.score = 0; game.floats = []; game._endlessStats = { hits: 1 }; game._endlessEventStartHits = 1;
const eventCleanGain = game.finishEndlessEvent(CONFIG.endless.events[0]);
assert(eventCleanGain > eventHitGain, "clean event clear should grant bonus score");
assert(game.player.shieldHp >= CONFIG.endless.eventCleanShield, "clean event clear should grant shield");

const draftIds = CONFIG.chipOrder.map(k => "chip:" + k).concat(CONFIG.bonusOrder.map(k => "bonus:" + k));
const hasSurvivalDraft = () => game._chipChoices.some(id => id.startsWith("bonus:") && game.draftCardRoute(game.cardInfo(id)) === "生存");
game.endless = true; game.player = { power: CONFIG.powerup.chipMinPower }; game._endlessEvent = null; game._endlessEventTimer = 0; game.bonuses = {}; game.chips = {}; game._chipChoices = []; game._rng = () => 0.999;
assert.strictEqual(game.canDrop("chip"), false, "endless should use timed drafts instead of chip drops");
game.drawChipChoices();
assert(game._chipChoices.some(id => id.startsWith("bonus:")), "endless draft should include one permanent bonus option");
assert(hasSurvivalDraft(), "endless draft should include one survival/HP option");
game.state = "playing"; game._endlessT = CONFIG.powerup.chipMinEndlessTime - 0.01; game._nextChipDraftAt = 0; game._endlessStats = { drafts: 0 };
assert.strictEqual(game.updateChipDraftTimer(), false, "draft timer should wait until the fixed delay");
game._endlessT = CONFIG.powerup.chipMinEndlessTime;
assert.strictEqual(game.updateChipDraftTimer(), true, "draft timer should start a draft at the fixed delay");
assert.strictEqual(game.state, "chipselect", "draft timer should open selection UI");
assert.strictEqual(game._endlessStats.drafts, 1, "timed draft should be counted once");
assert.strictEqual(game._nextChipDraftAt, CONFIG.powerup.chipMinEndlessTime + CONFIG.powerup.chipDraftInterval, "next draft should be one fixed interval later");
for (const e of CONFIG.endless.events.filter(e => e.routeBias)) {
  const matching = draftIds.filter(id => game.draftCardRoute(game.cardInfo(id)) === e.routeBias);
  assert(matching.length, `event ${e.key} routeBias ${e.routeBias} has no matching draft cards`);
  game.endless = true; game._endlessEvent = e; game._endlessEventTimer = 10; game.bonuses = {}; game.chips = {}; game._chipChoices = []; game._rng = () => 0.999;
  game.drawChipChoices();
  assert(game._chipChoices.some(id => matching.includes(id)), `event ${e.key} draft should include one matching route card`);
  assert(game._chipChoices.some(id => id.startsWith("bonus:")), `event ${e.key} draft should include one permanent bonus option`);
  assert(hasSurvivalDraft(), `event ${e.key} draft should include one survival/HP option`);
}

const affixes = CONFIG.endless.boss.affixes;
unique(affixes.map(a => a.key), "boss affixes");
assert(affixes.some(a => a.key === "ewar"), "boss affixes should include electronic warfare pressure");
for (const a of affixes) {
  assert(a.name && a.desc, `boss affix ${a.key} needs readable text`);
  if (a.scoreMult) between(a.scoreMult, 1, 1.35, `boss affix ${a.key} scoreMult`);
  if (a.attack) {
    assert(["laser", "ring", "escort", "repair"].includes(a.attack), `boss affix ${a.key} has unknown attack ${a.attack}`);
    between(a.every || 0, 3, 12, `boss affix ${a.key} interval`);
  }
  if (a.count) between(a.count, 6, 24, `boss affix ${a.key} count`);
  if (a.speed) between(a.speed, 140, 360, `boss affix ${a.key} speed`);
  if (a.damageMult) between(a.damageMult, 0.5, 1.2, `boss affix ${a.key} damageMult`);
  if (a.maxAdds) between(a.maxAdds, 1, 6, `boss affix ${a.key} maxAdds`);
  if (a.enemy) assert(enemyKeys.has(a.enemy), `boss affix ${a.key} references missing enemy ${a.enemy}`);
  if (a.elite) assert(eliteTypes.includes(a.elite), `boss affix ${a.key} references missing elite ${a.elite}`);
  if (a.healPct) between(a.healPct, 0.01, 0.06, `boss affix ${a.key} healPct`);
}

const bonusKeys = new Set(Object.keys(CONFIG.bonuses));
for (const key of CONFIG.bonusOrder) assert(bonusKeys.has(key), `bonusOrder references missing bonus ${key}`);
for (const key of ["maxHp", "reinforcedHull", "armorPlating", "fieldRepair", "leech", "painConverter", "armorCaliber", "vitalReactor", "shieldAmplifier"]) {
  assert(bonusKeys.has(key), `missing survival/build bonus ${key}`);
}
assert(CONFIG.bonuses.armorCaliber.hpPerDamage > 0, "armorCaliber hpPerDamage must be positive");
between(CONFIG.bonuses.armorCaliber.maxDamage, 2, 8, "armorCaliber maxDamage");
assert(CONFIG.bonuses.vitalReactor.hpPerDamageMult > 0, "vitalReactor hpPerDamageMult must be positive");
between(CONFIG.bonuses.vitalReactor.damageMult, 0.02, 0.08, "vitalReactor damageMult");
between(CONFIG.bonuses.vitalReactor.maxDamageMult, 0.1, 0.4, "vitalReactor maxDamageMult");
between(CONFIG.bonuses.shieldAmplifier.damageMult, 0.08, 0.3, "shieldAmplifier damageMult");
game.bonuses = { shieldAmplifier: 1 }; game.chips = {}; game.player = { hp: 100, maxHp: 100, baseMaxHp: 100, shieldHp: 0 };
assert.strictEqual(game.playerDamage(100), 100, "shieldAmplifier should not add damage without shield");
game.player.shieldHp = 10;
assert(game.playerDamage(100) > 100, "shieldAmplifier should add damage while shielded");
between(CONFIG.bonuses.painConverter.energyPerHp, 0.5, 2, "painConverter energyPerHp");
between(CONFIG.bonuses.painConverter.maxEnergy, 15, 60, "painConverter maxEnergy");
between(CONFIG.bonuses.sideCannons.maxPairs, 1, 4, "sideCannons maxPairs");
between(CONFIG.bonuses.laserSplitter.maxPairs, 1, 5, "laserSplitter maxPairs");
between(CONFIG.bonuses.clusterWarheads.maxCount, CONFIG.bonuses.clusterWarheads.count, 8, "clusterWarheads maxCount");
game.bonuses = {}; assert.strictEqual(game.missileVolleyBonus(), 0, "missile route should not add volley before ready");
game.bonuses = { missileRack: 3 }; assert.strictEqual(game.missileVolleyBonus(), 1, "missile route should add one missile when ready");
assert(game.routeEffectText().includes("导弹+1"), "missile route resonance text should show the extra missile");

console.log(`balance check passed: ${CONFIG.endless.events.length} events, ${affixes.length} boss affixes, ${CONFIG.bonusOrder.length} bonuses`);
