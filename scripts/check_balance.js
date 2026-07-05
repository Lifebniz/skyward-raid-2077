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

const enemyKeys = new Set(Object.keys(CONFIG.enemy));
const eliteTypes = CONFIG.elite.types || [];
unique(eliteTypes, "elite types");
assert(eliteTypes.length >= 4, "elite type variety should include at least 4 types");
for (const key of eliteTypes) {
  const e = CONFIG.elite[key];
  assert(e && e.name && e.color, `elite ${key} needs readable text`);
  if (e.hpMult) between(e.hpMult, 0.75, 1.35, `elite ${key} hpMult`);
  if (e.speedMult) between(e.speedMult, 1, 1.45, `elite ${key} speedMult`);
  if (e.fireMult) between(e.fireMult, 0.6, 1, `elite ${key} fireMult`);
  if (e.regenEvery) between(e.regenEvery, 1.5, 4, `elite ${key} regenEvery`);
  if (e.regenPct) between(e.regenPct, 0.03, 0.12, `elite ${key} regenPct`);
}
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

const draftIds = CONFIG.chipOrder.map(k => "chip:" + k).concat(CONFIG.bonusOrder.map(k => "bonus:" + k));
for (const e of CONFIG.endless.events.filter(e => e.routeBias)) {
  const matching = draftIds.filter(id => game.draftCardRoute(game.cardInfo(id)) === e.routeBias);
  assert(matching.length, `event ${e.key} routeBias ${e.routeBias} has no matching draft cards`);
  game.endless = true; game._endlessEvent = e; game._endlessEventTimer = 10; game.bonuses = {}; game.chips = {}; game._chipChoices = []; game._rng = () => 0.999;
  game.drawChipChoices();
  assert(game._chipChoices.some(id => matching.includes(id)), `event ${e.key} draft should include one matching route card`);
}

const affixes = CONFIG.endless.boss.affixes;
unique(affixes.map(a => a.key), "boss affixes");
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
  if (a.enemy) assert(enemyKeys.has(a.enemy), `boss affix ${a.key} references missing enemy ${a.enemy}`);
  if (a.elite) assert(eliteTypes.includes(a.elite), `boss affix ${a.key} references missing elite ${a.elite}`);
  if (a.healPct) between(a.healPct, 0.01, 0.06, `boss affix ${a.key} healPct`);
}

const bonusKeys = new Set(Object.keys(CONFIG.bonuses));
for (const key of CONFIG.bonusOrder) assert(bonusKeys.has(key), `bonusOrder references missing bonus ${key}`);
for (const key of ["maxHp", "reinforcedHull", "armorPlating", "fieldRepair", "leech", "painConverter", "armorCaliber", "vitalReactor"]) {
  assert(bonusKeys.has(key), `missing survival/build bonus ${key}`);
}
assert(CONFIG.bonuses.armorCaliber.hpPerDamage > 0, "armorCaliber hpPerDamage must be positive");
between(CONFIG.bonuses.armorCaliber.maxDamage, 2, 8, "armorCaliber maxDamage");
assert(CONFIG.bonuses.vitalReactor.hpPerDamageMult > 0, "vitalReactor hpPerDamageMult must be positive");
between(CONFIG.bonuses.vitalReactor.damageMult, 0.02, 0.08, "vitalReactor damageMult");
between(CONFIG.bonuses.vitalReactor.maxDamageMult, 0.1, 0.4, "vitalReactor maxDamageMult");
between(CONFIG.bonuses.painConverter.energyPerHp, 0.5, 2, "painConverter energyPerHp");
between(CONFIG.bonuses.painConverter.maxEnergy, 15, 60, "painConverter maxEnergy");
between(CONFIG.bonuses.sideCannons.maxPairs, 1, 4, "sideCannons maxPairs");
between(CONFIG.bonuses.laserSplitter.maxPairs, 1, 5, "laserSplitter maxPairs");
between(CONFIG.bonuses.clusterWarheads.maxCount, CONFIG.bonuses.clusterWarheads.count, 8, "clusterWarheads maxCount");

console.log(`balance check passed: ${CONFIG.endless.events.length} events, ${affixes.length} boss affixes, ${CONFIG.bonusOrder.length} bonuses`);
