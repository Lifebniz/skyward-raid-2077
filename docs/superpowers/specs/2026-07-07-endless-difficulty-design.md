# 无尽模式难度选择设计

## 1. 背景与目标

当前标题页的「无尽挑战」入口直接进入固定难度的无尽模式。玩家反馈该难度过高，希望新增一个**普通难度**，并把当前体验保留为**地狱难度**。

**基线定义**：当前无尽挑战 = 地狱难度的基础曲线（敌人的血量、速度、伤害等全部沿用现有 `CONFIG.endless` 参数）。地狱难度会在该曲线之上再给玩家强力开局 buff，并加快节奏；普通难度则下调敌机/BOSS 血量，并把后期曲线增长调得更平滑。

设计目标：
- 标题页点击「无尽挑战」后弹出普通 / 地狱二选一。
- 普通难度通过玩家常态 DPS 反推，降低敌机和 BOSS 血量，后期增长更平缓。
- 地狱难度保留当前高压曲线，并给予玩家更强的开局加成（2 僚机、2 火力、血量翻倍、对敌伤害翻倍、敌机速度 +15%）。
- 记住上次选择，下次默认沿用。
- 地图入口的「无尽关卡（lite）」和常规关卡不受影响。

## 2. 方案总览

采用**配置中心式（方案 A）**：新增 `CONFIG.endlessDifficulties` 配置表，并在 `Player`、`Enemy`、`Boss` 初始化以及伤害计算时乘以对应难度参数。改动集中，便于后续调参。

关键原则：
- `endlessDifficulties` **替代**现有的 `CONFIG.difficulties[CONFIG.endless.diffKey]` 作为非 lite 无尽模式的难度来源。
- `endlessLite` 和常规关卡仍走原有 `game.activeDiff` 逻辑，不进入新的难度系统。

## 3. 难度参数

在 `src/config.js` 新增：

```js
endlessDifficulties: {
  normal: {
    key: "normal",
    name: "普通 NORMAL",
    color: "#4dabf7",
    // 玩家：保持现状（无尽不再额外削血量）
    playerHpMult: 1,
    playerDmgMult: 1,
    startWings: 0,
    startPower: 0,
    // 开局抽卡
    startingDrafts: 2,
    draftInterval: 0,
    // 敌人：血量按 DPS 推导下调，速度保持原曲线
    enemyHpMult: 0.65,
    bossHpMult: 0.70,
    enemySpeedMult: 1,
    // 后期曲线：更平缓
    enemyHpBoostMult: 2.0,
    enemyHpDoubleInterval: 180,
    dmgRampMult: 2.2,
    dmgDoubleInterval: 420,
    // 分数
    scoreMult: 1.0,
    fireMult: 1.0,
    dmgMult: 1.0,
    invuln: 1.2,
    startBombs: 3,
  },
  hell: {
    key: "hell",
    name: "地狱 HELL",
    color: "#ff6b6b",
    // 玩家：开局额外 +2 僚机、+2 火力；血量和伤害翻倍
    playerHpMult: 2,
    playerDmgMult: 2,
    startWings: 2,
    startPower: 2,
    // 开局抽卡
    startingDrafts: 5,
    draftInterval: 20,
    // 敌人：速度提升 15%，血量保持原无尽曲线
    enemyHpMult: 1,
    bossHpMult: 1,
    enemySpeedMult: 1.15,
    // 后期曲线：保持原配置
    enemyHpBoostMult: null,   // 使用 CONFIG.endless.enemyHpBoostMult 默认值 3
    enemyHpDoubleInterval: null,
    dmgRampMult: null,
    dmgDoubleInterval: null,
    // 分数
    scoreMult: 1.5,
    fireMult: 1.0,
    dmgMult: 1.0,
    invuln: 1.2,
    startBombs: 3,
  },
}
```

说明：
- 表中 `null` 表示沿用 `CONFIG.endless` 的默认值。
- `fireMult`、`dmgMult`、`invuln`、`startBombs` 与常规关卡难度表同义，用于统一 `activeDiff` 接口。
- 普通难度的 `playerHpMult: 1` 替代了原来的 `CONFIG.endless.hpMult: 0.7`，因此普通模式玩家血量相比当前会略有提升；这属于难度下调的一部分，符合「普通更简单」的目标。

## 4. 普通难度的 DPS 血量推导

以**平衡型战机**为基准（射速 1/0.11 ≈ 9.1 发/秒，单发 1 伤），估算各火力等级下的主炮 + 僚机 DPS（不含激光、导弹、追踪弹等副武器）：

| 火力 | 主炮弹数 | 主炮 DPS | 僚机数 | 僚机 DPS | 合计参考 DPS |
|---|---|---|---|---|---|
| 1 | 1 | 9.1 | 0 | 0 | 9 |
| 3 | 3 | 27.3 | 0 | 0 | 27 |
| 5 | 5 | 45.5 | 2 | 18.2 | 64 |
| 7 | 9 | 81.8 | 4 | 36.4 | 118 |

实际战斗中激光、导弹、追踪弹、芯片加成会进一步抬高 DPS。取游戏前 60 秒常见状态（火力 3–5，1–2 僚机，部分副武器）下玩家 DPS 约 40–70。

以中型敌机（medium，基础 HP 5）为例：
- 地狱难度：HP 5 × 无尽基础倍率 1.55 ≈ 8，TTK ≈ 0.11–0.20 s（前期）
- 普通难度：HP 8 × 0.65 ≈ 5，TTK ≈ 0.07–0.13 s

以大型敌机（large，基础 HP 16）为例：
- 地狱难度：HP 16 × 1.55 ≈ 25，TTK ≈ 0.35–0.63 s
- 普通难度：HP 25 × 0.65 ≈ 16，TTK ≈ 0.23–0.40 s

以第一个无尽 BOSS（近卫舰，基础 HP 400）为例：
- 地狱难度：HP 400 × 0.82（原难度 bossHpMult）≈ 328
- 普通难度：HP 328 × 0.70 ≈ 230

这些数值能把小怪 TTK 拉回 0.2–0.6 s，BOSS 战也不会变成纯血墙。0.65/0.70 作为初版调参值，后续通过 playtest 再细调。

## 5. 交互流程

1. 标题页点击「无尽挑战 CHALLENGE」后，游戏状态进入 `endlessdiff`（新增过渡状态）。
2. 屏幕中央弹出二选一面板：
   - 普通 NORMAL：标签「血量降低 · 后期平缓 · 节奏舒适」。
   - 地狱 HELL：标签「开局 2 僚机 2 火力 · 敌机 +15% · 高分高难」。
3. 默认高亮上次保存的难度（`Settings.data.endlessDiff`）。
4. 点击选项后调用 `game.setEndlessDiff(key)` 并 `game.startEndless({ diff: key })` 进入对局。
5. 下次点击「无尽挑战」直接显示该面板并默认上次选择。
6. 挑战码 / 每日挑战固定使用**地狱难度**，不经过该面板。

## 6. 状态与持久化

- 在 `src/services.js` 的 `Settings` 中新增 `endlessDiff` 字段，默认 `normal`。
- `game` 对象新增 `_endlessDiffKey` 属性，`startEndless` 时写入。
- 提供 `game.setEndlessDiff(key)` 方法，同时更新 `Settings`。
- `game.activeEndlessDiff()` 行为：
  - 若 `!this.endless || this.endlessLite`，返回**中性倍率对象**（所有倍率为 1，startWings/startPower/startingDrafts 为 0）。
  - 否则读取 `CONFIG.endlessDifficulties[this._endlessDiffKey]`，若 key 不存在则 fallback 到 `normal`。

中性倍率对象：

```js
{
  playerHpMult: 1, playerDmgMult: 1,
  startWings: 0, startPower: 0,
  startingDrafts: 0, draftInterval: 0,
  enemyHpMult: 1, bossHpMult: 1, enemySpeedMult: 1,
  enemyHpBoostMult: null, enemyHpDoubleInterval: null,
  dmgRampMult: null, dmgDoubleInterval: null,
  scoreMult: 1, fireMult: 1, dmgMult: 1,
  invuln: 1.2, startBombs: 3,
}
```

## 7. `activeDiff` 替换规则

原 `game.activeDiff` 逻辑：

```js
get activeDiff() {
  return this.endless
    ? (this.endlessLite ? this.diff : CONFIG.difficulties[CONFIG.endless.diffKey])
    : this.diff;
}
```

改为：

```js
get activeDiff() {
  if (!this.endless) return this.diff;
  if (this.endlessLite) return this.diff;
  return this.activeEndlessDiff();
}
```

这样非 lite 无尽直接使用 `endlessDifficulties` 作为难度来源，避免与 `CONFIG.difficulties[CONFIG.endless.diffKey]` 叠加。

## 8. 游戏内数值应用

### 8.1 玩家属性（`src/entities.js` 的 `Player`）

```js
const diff = game.activeEndlessDiff();
const baseDiff = game.activeDiff;   // 常规/无尽关卡共用：invuln、startBombs、fireMult、dmgMult
this.maxHp = Math.round(c.maxHp * ship.hpMult * diff.playerHpMult);
this.hp = this.maxHp;
this.power = 1 + diff.startPower;
this.wings = clamp(ship.wings + diff.startWings, 0, CONFIG.wingMax);
this.bombs = clamp(baseDiff.startBombs + ship.bombs, 0, CONFIG.player.maxBombs);
this.invulnAmount = baseDiff.invuln;
```

说明：
- 原 `CONFIG.endless.hpMult: 0.7` 不再直接用于 `Player`；普通难度的 `playerHpMult: 1` 使血量回到 ship 原始倍率，地狱的 `2` 使血量翻倍。
- `startPower` 和 `startWings` 是**额外加成**：普通 +0，地狱 +2。例如平衡型在地狱开局为 power=3、wings=3；攻击型为 power=3、wings=2。
- 僚机和火力均受现有上限约束。
- `baseDiff` 仍由 `game.activeDiff` 提供，因此 `endlessLite` 和常规关卡保持原有行为（地图难度 / 关卡难度），不会被无尽难度表覆盖。

### 8.2 敌机属性（`src/entities.js` 的 `Enemy`）

```js
const diff = game.activeEndlessDiff();
this.speed *= diff.enemySpeedMult;
// 原无尽血量曲线已经乘完后，再乘难度血量倍率
this.hp = Math.max(1, Math.round(this.hp * diff.enemyHpMult));
```

### 8.3 BOSS 属性（`src/game.js` 的 `spawnBoss`）

```js
const diff = game.activeEndlessDiff();
this.maxHp = Math.round(def.hp * diff.bossHpMult);
this.hp = this.maxHp;
this._fireScale = diff.fireMult;
```

### 8.4 玩家伤害（`src/game.js`）

在 `playerDamage()`（或等价的最终伤害出口）中：

```js
const diff = game.activeEndlessDiff();
damage *= diff.playerDmgMult;
```

确保该乘数在所有加成之后、最终取整之前应用，从而对所有玩家伤害源（主炮、僚机、激光、导弹、追踪弹、炸弹、必杀技）统一生效。

### 8.5 敌弹伤害与后期曲线

原 `endlessBulletDmgMult()` 读取 `CONFIG.endless.dmgRampMult` 和 `CONFIG.endless.dmgDoubleInterval`。改为：

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
}
```

类似地，`endlessEnemyHpMult()` 也使用 `diff.enemyHpBoostMult` 和 `diff.enemyHpDoubleInterval` 覆盖默认值，实现普通难度的后期曲线平滑。

说明：由于普通难度的 `enemyHpBoostMult` 低于地狱，后期普通敌机血量相对地狱的比例会低于 65%（例如 ramp 封顶后约为 43%），这正是「后期曲线更平缓」的预期表现。验收标准中的 65% 指**基础倍率和 ramp 前中期的相对比例**。

## 9. 开局抽卡

- 普通难度：`startingDrafts: 2`，两次选择连续进行（`draftInterval: 0`），与现有体验一致。
- 地狱难度：`startingDrafts: 5`，两次选择之间间隔 `draftInterval: 20` 秒。

实现：
- `startEndless` 中设置 `this._startingDrafts = diff.startingDrafts`。
- `resumeAfterDraft` 中：若剩余次数 > 0：
  - `draftInterval === 0`：立即开始下一轮（现有行为）。
  - `draftInterval > 0`：设置 `_nextDraftAt = this._endlessT + diff.draftInterval`，回到 `playing`。
- `updateEndless` 中检查：若 `_nextDraftAt > 0` 且 `this._endlessT >= _nextDraftAt` 且 `state === "playing"` 且无其他面板/BOSS 正在占用屏幕，则清空 `_nextDraftAt` 并开始下一轮 draft。

暂停行为：draft 间隔基于 `_endlessT`，暂停时 `_endlessT` 不推进，因此自然暂停计时；恢复后继续。无需额外处理。

## 10. 分数结算

`settleEndless` 中最终分数已经乘以 `this.activeDiff.scoreMult`。地狱 `scoreMult: 1.5` 会直接让结算分提高 50%，体现高风险高收益。

## 11. UI 绘制

新增 `drawEndlessDifficulty(ctx)` 方法。

面板尺寸：
- 面板宽度 340px，高度 420px，居中：`x = (CONFIG.WIDTH - 340) / 2 = 100`，`y = 280`。

内容：
- 标题「选择无尽难度」，y = 310。
- 普通按钮：`{ x: 120, y: 360, w: 300, h: 80 }`，显示「普通 NORMAL」和标签「血量降低 · 后期平缓」。
- 地狱按钮：`{ x: 120, y: 460, w: 300, h: 80 }`，显示「地狱 HELL」和标签「开局 2 僚机 2 火力 · 敌机 +15%」。
- 选中项边框高亮，未选中项半透明。
- 底部提示「点击难度进入对局 · 点击空白返回首页」，y = 640。

命中方法：
- `endlessDiffNormalRect()`
- `endlessDiffHellRect()`
- `endlessDiffOutsidePanelRect()`：面板外部遮罩区域；点击该范围返回标题页。

取消行为：难度面板为强制选择。点击面板外部区域或按 `Esc` 键返回标题页；点击面板内部非按钮区域不触发任何操作。

## 12. 输入处理

在 `src/input.js` 中：
- 标题页点击「无尽挑战」改为 `game.state = "endlessdiff"`，不再直接 `startEndless()`。
- 新增 `game.state === "endlessdiff"` 分支：
  - 点击普通 → `game.setEndlessDiff("normal"); game.startEndless({ diff: "normal" });`
  - 点击地狱 → `game.setEndlessDiff("hell"); game.startEndless({ diff: "hell" });`
  - 点击面板外部区域 → `game.toTitle();`
- 键盘事件：在 `endlessdiff` 状态下按 `Esc` 键 → `game.toTitle();`
- 挑战码按钮（`titleChallengeHit`）保持进入挑战码弹窗，弹窗内的「新挑战 / 每日」固定使用地狱难度。

## 13. 改动文件清单

| 文件 | 改动内容 |
|---|---|
| `src/config.js` | 新增 `endlessDifficulties`；`CONFIG.endless.hpMult` 留作兼容但不再被 `Player` 直接使用。 |
| `src/services.js` | `Settings` 新增 `endlessDiff` 字段及默认值；读取时做 key fallback。 |
| `src/game.js` | 新增 `_endlessDiffKey`、二选一面板绘制/命中、`setEndlessDiff`、`activeEndlessDiff`、修改 `activeDiff`、`startEndless`、`resumeAfterDraft`、`updateEndless`、`spawnBoss`、`endlessEnemyHpMult`、`endlessBulletDmgMult`、`settleEndless`、标题页绘制文案。 |
| `src/entities.js` | `Player` 初始化应用难度参数；`Enemy` 初始化应用速度/血量倍率。 |
| `src/input.js` | 标题页「无尽挑战」分发到难度面板；新增 `endlessdiff` 状态输入处理。 |
| `scripts/check_balance.js` | 新增无尽难度 DPS/血量/曲线静态校验。 |

## 14. 验收标准

- [ ] 标题页点击「无尽挑战」出现普通 / 地狱二选一。
- [ ] 选择后进入无尽模式，玩家/敌机数值符合对应难度。
- [ ] 普通难度敌机基础血量约为地狱的 65%，BOSS 基础血量约为地狱的 70%；因普通后期曲线更平缓，后期实际比例会进一步降低。
- [ ] 普通难度后期血量/伤害增长曲线比地狱更平缓。
- [ ] 地狱难度开局额外 +2 僚机、+2 火力、玩家血量翻倍、对敌伤害翻倍、敌机速度 +15%。
- [ ] 地狱难度 5 次开局选择，间隔 20 秒；普通难度 2 次开局选择，连续进行。
- [ ] 记住上次选择，下次默认高亮。
- [ ] 地图入口的无尽关卡（lite）不受影响。
- [ ] 挑战码 / 每日挑战固定使用地狱难度。
- [ ] `node scripts/check_balance.js` 通过。
