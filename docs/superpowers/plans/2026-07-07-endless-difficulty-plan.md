# 无尽模式难度选择实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为标题页「无尽挑战」增加普通/地狱难度选择，应用不同的玩家/敌机/BOSS 数值与开局抽卡节奏，并记住上次选择。

**Architecture:** 采用配置中心式方案，新增 `CONFIG.endlessDifficulties` 难度表；`game.activeDiff` 对非 lite 无尽返回该表条目；`Player`、`Enemy`、`Boss` 及伤害计算统一乘以难度参数；新增 `endlessdiff` UI 状态用于二选一面板。

**Tech Stack:** 原生 HTML5 Canvas + JavaScript，无构建工具；校验脚本为 Node.js `scripts/check_balance.js`。

---

## 文件结构

| 文件 | 当前职责 | 本计划改动 |
|---|---|---|
| `src/config.js` | 所有数值配置中心 | 新增 `endlessDifficulties`；保留 `CONFIG.endless.hpMult` 兼容但不再被 `Player` 使用 |
| `src/services.js` | 本地存储设置 | 新增 `endlessDiff` 字段及读取 fallback |
| `src/game.js` | 主状态机、无尽模式逻辑、UI 绘制 | 新增 `_endlessDiffKey`、难度面板、`activeEndlessDiff`、修改 `activeDiff` 与多处数值应用 |
| `src/entities.js` | Player / Enemy / Boss 实体 | Player 与 Enemy 初始化应用难度参数 |
| `src/input.js` | 输入分发 | 标题页「无尽挑战」进入难度面板；新增 `endlessdiff` 状态输入 |
| `scripts/check_balance.js` | 静态校验 | 新增无尽难度 DPS/血量/曲线校验 |

---

## Task 1: 配置难度表

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: 在 `CONFIG` 对象内 `endless` 配置之前插入 `endlessDifficulties`**

在 `src/config.js` 中找到 `endless: {` 之前的位置，插入：

```js
  endlessDifficulties: {
    normal: {
      key: "normal", name: "普通 NORMAL", color: "#4dabf7",
      playerHpMult: 1, playerDmgMult: 1, startWings: 0, startPower: 0,
      startingDrafts: 2, draftInterval: 0,
      enemyHpMult: 0.65, bossHpMult: 0.70, enemySpeedMult: 1,
      enemyHpBoostMult: 2.0, enemyHpDoubleInterval: 180,
      dmgRampMult: 2.2, dmgDoubleInterval: 420,
      scoreMult: 1.0, fireMult: 1.0, dmgMult: 1.0, invuln: 1.2, startBombs: 3,
    },
    hell: {
      key: "hell", name: "地狱 HELL", color: "#ff6b6b",
      playerHpMult: 2, playerDmgMult: 2, startWings: 2, startPower: 2,
      startingDrafts: 5, draftInterval: 20,
      enemyHpMult: 1, bossHpMult: 1, enemySpeedMult: 1.15,
      enemyHpBoostMult: null, enemyHpDoubleInterval: null,
      dmgRampMult: null, dmgDoubleInterval: null,
      scoreMult: 1.5, fireMult: 1.0, dmgMult: 1.0, invuln: 1.2, startBombs: 3,
    },
  },
```

- [ ] **Step 2: 运行校验脚本确认配置合法**

Run: `node scripts/check_balance.js`
Expected: 无报错，当前仅检查现有配置。

- [ ] **Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat(config): add endless difficulty table (normal/hell)"
```

---

## Task 2: Settings 持久化

**Files:**
- Modify: `src/services.js`

- [ ] **Step 1: 找到 Settings 默认值定义位置**

在 `src/services.js` 中搜索 `const Settings =` 或 `defaults:`，找到默认值对象。

- [ ] **Step 2: 添加 endlessDiff 默认值**

在默认值对象中新增：

```js
endlessDiff: "normal",
```

- [ ] **Step 3: 在 `Settings.load()` 内部做 key fallback**

在 `Settings.load()` 中 `Object.assign(this.data, s)` 之后添加：

```js
if (!CONFIG.endlessDifficulties[this.data.endlessDiff]) {
  this.data.endlessDiff = "normal";
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services.js
git commit -m "feat(settings): persist last selected endless difficulty"
```

---

## Task 3: 核心难度接口

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 在 game 对象初始化区添加 `_endlessDiffKey`**

在 `src/game.js` 顶部状态字段区域（例如 `settleBtn` 附近）添加：

```js
_endlessDiffKey: "normal",
_nextDraftAt: 0,
_startingDraftsTotal: 0,
```

- [ ] **Step 2: 添加 `setEndlessDiff` 与 `activeEndlessDiff` 方法**

在 `game` 对象的方法区（`setShip` 之后）添加：

```js
setEndlessDiff(key) {
  const k = CONFIG.endlessDifficulties[key] ? key : "normal";
  this._endlessDiffKey = k;
  Settings.set("endlessDiff", k);
},
activeEndlessDiff() {
  if (!this.endless || this.endlessLite) {
    return {
      key: "", name: "", color: "#fff",
      playerHpMult: 1, playerDmgMult: 1, startWings: 0, startPower: 0,
      startingDrafts: 0, draftInterval: 0,
      enemyHpMult: 1, bossHpMult: 1, enemySpeedMult: 1,
      enemyHpBoostMult: null, enemyHpDoubleInterval: null,
      dmgRampMult: null, dmgDoubleInterval: null,
      scoreMult: 1, fireMult: 1, dmgMult: 1, invuln: 1.2, startBombs: 3,
    };
  }
  return CONFIG.endlessDifficulties[this._endlessDiffKey] || CONFIG.endlessDifficulties.normal;
},
```

- [ ] **Step 3: 修改 `activeDiff` getter**

将现有：

```js
get activeDiff() { return this.endless ? (this.endlessLite ? this.diff : CONFIG.difficulties[CONFIG.endless.diffKey]) : this.diff; },
```

替换为：

```js
get activeDiff() {
  if (!this.endless) return this.diff;
  if (this.endlessLite) return this.diff;
  return this.activeEndlessDiff();
},
```

- [ ] **Step 4: Commit**

```bash
git add src/game.js
git commit -m "feat(game): add activeEndlessDiff and replace activeDiff for endless"
```

---

## Task 4: 玩家属性应用难度参数

**Files:**
- Modify: `src/entities.js`

- [ ] **Step 1: 修改 `Player` 构造函数**

在 `src/entities.js` 的 `Player` 构造函数中，将：

```js
this.maxHp = Math.round(c.maxHp * ship.hpMult * (game.endless ? CONFIG.endless.hpMult : 1)); this.baseMaxHp = this.maxHp; this.hp = this.maxHp;
```

替换为：

```js
const diff = game.activeEndlessDiff();
this.maxHp = Math.round(c.maxHp * ship.hpMult * diff.playerHpMult); this.baseMaxHp = this.maxHp; this.hp = this.maxHp;
```

- [ ] **Step 2: 应用开局火力与僚机加成**

紧接着添加/修改：

```js
this.power = 1 + diff.startPower;
this.wings = clamp(ship.wings + diff.startWings, 0, CONFIG.wingMax);
```

- [ ] **Step 3: 确保 `bombs` 和 `invulnAmount` 仍来自 `activeDiff`**

确认以下行保持不变（因为它们从 `game.activeDiff` 读取，而 `activeDiff` 现在会返回 endless 难度表）：

```js
this.bombs = clamp(game.activeDiff.startBombs + ship.bombs, 0, CONFIG.player.maxBombs);
this.invulnAmount = game.activeDiff.invuln;
```

- [ ] **Step 4: Commit**

```bash
git add src/entities.js
git commit -m "feat(player): apply endless difficulty HP/power/wings bonuses"
```

---

## Task 5: 敌机属性应用难度参数

**Files:**
- Modify: `src/entities.js`

- [ ] **Step 1: 修改 `Enemy` 初始化中的速度倍率**

在 `src/entities.js` 的 `Enemy.init` 中，找到速度初始化处。原代码近似：

```js
this.speed = t.speed;
```

替换为：

```js
const diff = game.activeEndlessDiff();
this.speed = t.speed * diff.enemySpeedMult;
```

- [ ] **Step 2: 在无尽血量曲线之后应用血量倍率**

找到：

```js
const hpMult = game.endless ? game.endlessEnemyHpMult() : 1;
if (game.endless) this.hp = Math.max(1, Math.round(this.hp * hpMult), game.endlessEnemyHpFloor());
```

改为：

```js
const hpMult = game.endless ? game.endlessEnemyHpMult() : 1;
const diff = game.activeEndlessDiff();
if (game.endless) this.hp = Math.max(1, Math.round(this.hp * hpMult * diff.enemyHpMult), game.endlessEnemyHpFloor());
```

- [ ] **Step 3: Commit**

```bash
git add src/entities.js
git commit -m "feat(enemy): apply endless difficulty speed and HP multipliers"
```

---

## Task 6: BOSS 与后期曲线应用难度参数

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 修改 `spawnBoss` 中的 BOSS 血量**

在 `src/game.js` 的 `spawnBoss` 中，找到：

```js
this.maxHp = Math.round(def.hp * game.activeDiff.bossHpMult); this.hp = this.maxHp;
```

由于 `game.activeDiff` 现在对无尽模式返回 `endlessDifficulties` 条目，这里已经包含 `bossHpMult`。确认即可，无需额外改动。

- [ ] **Step 2: 修改 `endlessEnemyHpMult` 以读取难度覆盖值**

找到 `endlessEnemyHpMult()`，替换为：

```js
endlessEnemyHpMult() {
  if (!this.endless) return 1;
  const e = CONFIG.endless;
  const diff = this.activeEndlessDiff();
  const boostMult = diff.enemyHpBoostMult != null ? diff.enemyHpBoostMult : e.enemyHpBoostMult;
  const doubleInterval = diff.enemyHpDoubleInterval != null ? diff.enemyHpDoubleInterval : e.enemyHpDoubleInterval;
  const boostTime = e.enemyHpBoostTime == null ? Infinity : e.enemyHpBoostTime;
  const base = e.enemyHpBaseMult || 1;
  const late = this._endlessT >= boostTime
    ? boostMult * Math.pow(2, (this._endlessT - boostTime) / doubleInterval)
    : base;
  return Math.max(base, late) * (1 + this.endlessEventValue("enemyHpMult", 0));
},
```

- [ ] **Step 3: 修改 `endlessBulletDmgMult` 以读取难度覆盖值**

找到 `endlessBulletDmgMult()`，替换为：

```js
endlessBulletDmgMult() {
  if (this.endlessLite) return 1;
  const e = CONFIG.endless;
  const diff = this.activeEndlessDiff();
  const rampMult = diff.dmgRampMult != null ? diff.dmgRampMult : e.dmgRampMult;
  const doubleInterval = diff.dmgDoubleInterval != null ? diff.dmgDoubleInterval : e.dmgDoubleInterval;
  return this._endlessT >= e.dmgRampTime
    ? rampMult * Math.pow(2, (this._endlessT - e.dmgRampTime) / doubleInterval)
    : 1 + (rampMult - 1) * (this._endlessT / e.dmgRampTime);
},
```

- [ ] **Step 4: Commit**

```bash
git add src/game.js
git commit -m "feat(game): apply endless difficulty to boss HP and late-game curves"
```

---

## Task 7: 玩家伤害应用难度参数

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 找到 `playerDamage` 或最终伤害出口**

在 `src/game.js` 中搜索 `playerDamage(` 或 `mainBulletDamage(` 被调用后的统一伤害处理位置。

- [ ] **Step 2: 添加难度伤害倍率**

在最终取整之前添加：

```js
const diff = this.activeEndlessDiff();
damage *= diff.playerDmgMult;
```

如果存在多个出口，优先在 `spawnPlayerBullet` 生成后命中敌人计算伤害的统一位置处理；若无法统一，则分别在主炮、僚机、激光、导弹、追踪弹、炸弹、必杀技伤害计算后乘上 `this.activeEndlessDiff().playerDmgMult`。

- [ ] **Step 3: Commit**

```bash
git add src/game.js
git commit -m "feat(game): apply endless difficulty player damage multiplier"
```

---

## Task 8: 开局抽卡间隔

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 修改 `startEndless` 中的 `_startingDrafts` 初始化**

将：

```js
this._startingDrafts = this.endlessLite ? 0 : (CONFIG.endless.startingDrafts || 3);
```

替换为：

```js
const diff = this.activeEndlessDiff();
this._startingDrafts = this.endlessLite ? 0 : (diff.startingDrafts || 0);
this._startingDraftsTotal = this._startingDrafts;
this._nextDraftAt = 0;
```

- [ ] **Step 2: 修改 `beginStartingDraft` 使用 `_startingDraftsTotal` 显示总数**

将：

```js
beginStartingDraft() {
  this._startingDrafts--;
  const total = CONFIG.endless.startingDrafts || 3;
  this.beginChipDraft("开局强化 · 第" + (total - this._startingDrafts) + "/" + total + "件");
},
```

替换为：

```js
beginStartingDraft() {
  this._startingDrafts--;
  const total = Math.max(1, this._startingDraftsTotal || CONFIG.endless.startingDrafts || 3);
  this.beginChipDraft("开局强化 · 第" + (total - this._startingDrafts) + "/" + total + "件");
},
```

- [ ] **Step 2: 修改 `resumeAfterDraft` 支持间隔**

将：

```js
resumeAfterDraft() {
  if (this._startingDrafts > 0) { this.beginStartingDraft(); return; }
  this.state = "playing";
  if (this._inStartingDraft) { this._inStartingDraft = false; const b = this.endlessBannerText(); this.banner(b.text, b.sub); }
},
```

替换为：

```js
resumeAfterDraft() {
  if (this._startingDrafts > 0) {
    const diff = this.activeEndlessDiff();
    if (diff.draftInterval > 0) {
      this._nextDraftAt = this._endlessT + diff.draftInterval;
      this.state = "playing";
      return;
    }
    this.beginStartingDraft();
    return;
  }
  this.state = "playing";
  if (this._inStartingDraft) { this._inStartingDraft = false; const b = this.endlessBannerText(); this.banner(b.text, b.sub); }
},
```

- [ ] **Step 3: 在 `updateEndless` 中检查 `_nextDraftAt`**

在 `updateEndless` 函数开头（`_endlessT += dt;` 之后）添加：

```js
if (this._nextDraftAt > 0 && this._endlessT >= this._nextDraftAt && this.state === "playing" && !this.boss) {
  this._nextDraftAt = 0;
  this.beginStartingDraft();
}
```

- [ ] **Step 4: Commit**

```bash
git add src/game.js
git commit -m "feat(game): support spaced starting drafts for hell difficulty"
```

---

## Task 9: 难度选择 UI

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 新增矩形命中方法**

在 `titleEndlessRect` 附近添加：

```js
endlessDiffNormalRect() { const w = 300, h = 80, x = (CONFIG.WIDTH - w) / 2, y = 360; return { x, y, w, h }; },
endlessDiffHellRect()   { const w = 300, h = 80, x = (CONFIG.WIDTH - w) / 2, y = 460; return { x, y, w, h }; },
endlessDiffOutsidePanelRect() { return { x: 0, y: 0, w: CONFIG.WIDTH, h: CONFIG.HEIGHT }; },
```

- [ ] **Step 2: 新增 `drawEndlessDifficulty(ctx)` 方法**

在 `drawTitle` 之后添加：

```js
drawEndlessDifficulty(ctx) {
  const cx = CONFIG.WIDTH / 2, saved = Settings.data.endlessDiff || "normal";
  ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff"; ctx.font = "bold 30px 'Segoe UI', sans-serif"; ctx.fillText("选择无尽难度", cx, 310);

  const drawBtn = (r, key, label, sub, selected) => {
    const cfg = CONFIG.endlessDifficulties[key];
    UI.panel(ctx, r.x, r.y, r.w, r.h, 14, selected ? { accent: cfg.color } : { stroke: "rgba(255,255,255,.25)" });
    ctx.fillStyle = selected ? cfg.color : "#fff"; ctx.font = "bold 24px 'Segoe UI', sans-serif"; ctx.fillText(label, cx, r.y + 36);
    ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = "13px 'Segoe UI', sans-serif"; ctx.fillText(sub, cx, r.y + 64);
  };

  drawBtn(this.endlessDiffNormalRect(), "normal", "普通 NORMAL", "血量降低 · 后期平缓 · 节奏舒适", saved === "normal");
  drawBtn(this.endlessDiffHellRect(),   "hell",   "地狱 HELL",   "开局 2 僚机 2 火力 · 敌机 +15% · 高分高难", saved === "hell");

  ctx.fillStyle = "#adb5bd"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText("点击难度进入对局 · 点击空白返回首页", cx, 640);
  ctx.textAlign = "left";
},
```

- [ ] **Step 3: 在 `draw()` 中接入 `endlessdiff` 状态**

在 `src/game.js` 的 `draw()` 方法中找到状态分发逻辑，在 `if (this.state === "title")` 等分支附近添加：

```js
if (this.state === "endlessdiff") { this.drawEndlessDifficulty(ctx); return; }
```

- [ ] **Step 4: Commit**

```bash
git add src/game.js
git commit -m "feat(ui): add endless difficulty selection panel"
```

---

## Task 10: 输入处理

**Files:**
- Modify: `src/input.js`

- [ ] **Step 1: 修改标题页「无尽挑战」点击行为**

在 `src/input.js` 中找到：

```js
if (game.titleEndlessHit(p.x, p.y)) { game.startEndless(); return; }
```

替换为：

```js
if (game.titleEndlessHit(p.x, p.y)) { game.state = "endlessdiff"; return; }
```

- [ ] **Step 2: 新增 `endlessdiff` 状态分支**

在 `if (game.state === "title") { ... }` 块之后添加：

```js
if (game.state === "endlessdiff") {
  const inR = (r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  if (inR(game.endlessDiffNormalRect())) { game.setEndlessDiff("normal"); game.startEndless({ diff: "normal" }); return; }
  if (inR(game.endlessDiffHellRect()))   { game.setEndlessDiff("hell");   game.startEndless({ diff: "hell" });   return; }
  if (!inR({ x: 100, y: 280, w: 340, h: 420 })) { game.toTitle(); return; }
  return;
}
```

- [ ] **Step 3: 添加键盘 Esc 返回**

在 `window.addEventListener("keydown", ...)` 中，在静音处理附近添加：

```js
if (game.state === "endlessdiff" && e.key === "Escape") { game.toTitle(); e.preventDefault(); }
```

- [ ] **Step 4: Commit**

```bash
git add src/input.js
git commit -m "feat(input): wire endless difficulty selection panel"
```

---

## Task 11: 标题页文案更新

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 修改 `drawTitle` 中无尽按钮副标题**

将：

```js
this.drawTitleImageButton(ctx, this.titleEndlessRect(), "challenge", { label: "无尽挑战 CHALLENGE", sub: "难度固定 · 普通", color: "#ff922b", active: true, font: 26, radius: 16 });
```

替换为：

```js
this.drawTitleImageButton(ctx, this.titleEndlessRect(), "challenge", { label: "无尽挑战 CHALLENGE", sub: "普通 / 地狱", color: "#ff922b", active: true, font: 26, radius: 16 });
```

- [ ] **Step 2: Commit**

```bash
git add src/game.js
git commit -m "feat(ui): update title endless button subtitle"
```

---

## Task 12: 挑战码固定使用地狱难度

**Files:**
- Modify: `src/game.js`

- [ ] **Step 1: 修改挑战码弹窗的所有启动入口**

在 `showChallengeModal` 中，确保以下三处启动挑战模式的地方都先 `setEndlessDiff("hell")` 并传入 `diff: "hell"`：

1. 输入框为空时点击「开始」：

```js
close(); this.setEndlessDiff("hell"); this.startEndless({ diff: "hell", seed: Challenge.randomSeed(), challenge: true });
```

2. 粘贴并解码他人挑战码后：

```js
close(); this.setEndlessDiff("hell"); this.startEndless({ diff: "hell", seed: payload.seed, ship: payload.ship, challenge: true, target: payload });
```

3. 「新挑战」按钮：

```js
button("新挑战", "#1971c2", () => { close(); this.setEndlessDiff("hell"); this.startEndless({ diff: "hell", seed: Challenge.randomSeed(), challenge: true }); }),
```

4. 「每日」按钮仍调用 `startDailyChallenge()`。

- [ ] **Step 2: 修改 `startDailyChallenge`**

```js
startDailyChallenge() { this.setEndlessDiff("hell"); this.startEndless({ diff: "hell", seed: Challenge.dailySeed(), challenge: true, daily: true }); },
```

- [ ] **Step 3: Commit**

```bash
git add src/game.js
git commit -m "feat(challenge): force hell difficulty for challenge mode"
```

---

## Task 13: 校验脚本扩展

**Files:**
- Modify: `scripts/check_balance.js`

- [ ] **Step 1: 添加无尽难度 DPS/血量校验**

在文件末尾或合适位置添加：

```js
function checkEndlessDifficulty() {
  const diffs = CONFIG.endlessDifficulties;
  assert(diffs.normal && diffs.hell, "CONFIG.endlessDifficulties must have normal and hell");
  assert(diffs.normal.enemyHpMult < diffs.hell.enemyHpMult, "normal enemyHpMult should be lower than hell");
  assert(diffs.normal.bossHpMult < diffs.hell.bossHpMult, "normal bossHpMult should be lower than hell");
  assert(diffs.hell.playerDmgMult > 1, "hell playerDmgMult should be > 1");
  assert(diffs.hell.playerHpMult > 1, "hell playerHpMult should be > 1");
  assert(diffs.hell.startWings > 0, "hell startWings should be > 0");
  assert(diffs.hell.startPower > 0, "hell startPower should be > 0");
  assert(diffs.hell.startingDrafts > diffs.normal.startingDrafts, "hell should have more starting drafts");
  assert(diffs.hell.draftInterval > 0, "hell draftInterval should be positive");

  // DPS sanity: balanced ship at power 1 ~9 DPS, medium enemy should die in < 1s in normal
  const fireInterval = CONFIG.player.fireInterval * CONFIG.ships.balanced.fireMult;
  const dps = 1 / fireInterval;
  const mediumHpNormal = CONFIG.enemy.medium.hp * (CONFIG.endless.enemyHpBaseMult || 1) * diffs.normal.enemyHpMult;
  assert(mediumHpNormal / dps < 1, "normal medium enemy TTK at power 1 should be < 1 second");

  // Hell curve baseline: the old assertions in this file assumed the original CONFIG.endless
  // curve. Re-run them with hell difficulty so the baseline is preserved.
  const originalDiffKey = game ? game._endlessDiffKey : undefined;
  if (game) game._endlessDiffKey = "hell";
  // (existing curve assertions will then use CONFIG.endless defaults because hell overrides are null)
  if (game) game._endlessDiffKey = originalDiffKey;
}
checkEndlessDifficulty();
```

说明：如果 `scripts/check_balance.js` 中已有针对无尽曲线的具体断言，需要确保它们在地狱难度（即原基线）下运行，或在计算期望值时显式使用 `CONFIG.endlessDifficulties.hell` 的覆盖值。若 `game` 对象在校验脚本中不可用，则直接在相关断言处将 `CONFIG.endless` 的默认值作为期望值。例如，原断言期望 60s 时 `enemyHpMult` 为 1.55 的，应改为使用 `CONFIG.endless.enemyHpBaseMult` 计算。

- [ ] **Step 2: 运行校验脚本**

Run: `node scripts/check_balance.js`
Expected: 通过，输出类似 `Balance check passed.`。

- [ ] **Step 3: Commit**

```bash
git add scripts/check_balance.js
git commit -m "feat(balance): validate endless difficulty parameters"
```

---

## Task 14: 浏览器验证

**Files:** 无

- [ ] **Step 1: 启动本地静态服务器**

Run: `python -m http.server 4173 --bind 127.0.0.1`

- [ ] **Step 2: 打开游戏并验证普通难度**

Open: `http://127.0.0.1:4173/`

检查项：
- 标题页「无尽挑战」点击后显示普通/地狱二选一。
- 选择普通后进入对局，观察玩家血量是否约为 100（平衡型）。
- 击杀第一个中型敌机所需时间应明显短于更新前。

- [ ] **Step 3: 验证地狱难度**

检查项：
- 选择地狱后开局火力为 3（1+2）、僚机数为 3（平衡型 1+2）。
- 敌机移动速度更快。
- 开局后出现 5 次抽卡，每次间隔约 20 秒。

- [ ] **Step 4: 验证持久化**

刷新页面，再次点击「无尽挑战」，默认高亮上次选择的难度。

- [ ] **Step 5: 验证地图无尽关卡不受影响**

从关卡地图进入无尽关卡（∞），确认难度仍由地图难度选择器决定，不出现新的难度面板。

---

## 依赖关系

```
Task 1 (config) ──┐
Task 2 (settings)─┼→ Task 3 (game interface)
                  │       ↓
          Task 4 (player) / Task 5 (enemy) / Task 6 (curves)
                  │       ↓
          Task 7 (damage) / Task 8 (drafts)
                  │       ↓
          Task 9 (UI) / Task 10 (input) / Task 11 (title text)
                  │       ↓
          Task 12 (challenge)
                  │       ↓
          Task 13 (balance check) → Task 14 (browser verification)
```

建议按编号顺序执行，每个 task 独立 commit。
