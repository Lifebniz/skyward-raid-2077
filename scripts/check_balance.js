"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const sandbox = { console, Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("src/config.js", "utf8") + "\nglobalThis.CONFIG = CONFIG;", sandbox);
const { CONFIG } = sandbox;

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
  if (e.enemyType) assert(enemyKeys.has(e.enemyType), `event ${e.key} references missing enemy ${e.enemyType}`);
  if (e.enemyChance != null) between(e.enemyChance, 0, 0.75, `event ${e.key} enemyChance`);
  if (e.forceDrop) assert(drops.has(e.forceDrop), `event ${e.key} has invalid forceDrop ${e.forceDrop}`);
  if (e.powerupChanceAdd != null) between(CONFIG.endless.powerupChance + e.powerupChanceAdd, 0, 0.4, `event ${e.key} total powerup chance`);
  if (e.enemyHpMult != null) between(e.enemyHpMult, 0, 0.6, `event ${e.key} enemyHpMult`);
  if (e.laserEvery) {
    between(e.laserEvery, 3, 7, `event ${e.key} laserEvery`);
    between(e.warn || 0, 0.4, 1.2, `event ${e.key} laser warn`);
    between(e.width || 0, 20, 70, `event ${e.key} laser width`);
  }
}

const affixes = CONFIG.endless.boss.affixes;
unique(affixes.map(a => a.key), "boss affixes");
for (const a of affixes) {
  assert(a.name && a.desc, `boss affix ${a.key} needs readable text`);
  if (a.scoreMult) between(a.scoreMult, 1, 1.35, `boss affix ${a.key} scoreMult`);
  if (a.attack) {
    assert(["laser", "escort", "repair"].includes(a.attack), `boss affix ${a.key} has unknown attack ${a.attack}`);
    between(a.every || 0, 3, 12, `boss affix ${a.key} interval`);
  }
  if (a.enemy) assert(enemyKeys.has(a.enemy), `boss affix ${a.key} references missing enemy ${a.enemy}`);
  if (a.healPct) between(a.healPct, 0.01, 0.06, `boss affix ${a.key} healPct`);
}

const bonusKeys = new Set(Object.keys(CONFIG.bonuses));
for (const key of CONFIG.bonusOrder) assert(bonusKeys.has(key), `bonusOrder references missing bonus ${key}`);
for (const key of ["maxHp", "reinforcedHull", "armorPlating", "fieldRepair", "leech", "armorCaliber"]) {
  assert(bonusKeys.has(key), `missing survival/build bonus ${key}`);
}
assert(CONFIG.bonuses.armorCaliber.hpPerDamage > 0, "armorCaliber hpPerDamage must be positive");
between(CONFIG.bonuses.armorCaliber.maxDamage, 2, 8, "armorCaliber maxDamage");

console.log(`balance check passed: ${CONFIG.endless.events.length} events, ${affixes.length} boss affixes, ${CONFIG.bonusOrder.length} bonuses`);
