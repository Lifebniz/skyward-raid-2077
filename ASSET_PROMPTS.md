# Art Asset Prompts

本文档用于生成《空中突袭 2077》的美术素材。当前游戏是竖屏 Canvas 空战，画布比例 `9:16`，逻辑尺寸 `540x960`。建议生成更高清的 `1080x1920`，再交给我裁切、压缩和接入。

## 通用风格

核心风格:

```text
top-down vertical scrolling sci-fi arcade shooter game art, readable silhouettes, polished semi-realistic 2D digital painting, clean shapes, crisp edges, luminous energy accents, metal panels, high contrast, no text, no logo, no UI
```

通用负面提示词:

```text
text, logo, watermark, UI, cockpit view, side view, first person view, blurry, noisy, low resolution, cropped subject, cut off wings, photorealistic aircraft photo, messy background behind sprite, asymmetric accidental deformation
```

透明素材通用要求:

```text
isolated object, transparent background, centered, full body visible, top-down view, nose pointing up, game sprite, clean alpha edge, 20 percent padding around the object, no cast shadow outside the object
```

如果你的生成工具不支持透明背景，就用纯色背景:

```text
isolated object on a flat pure green background (#00ff00), no shadow, no glow touching the background
```

## 我能不能自动抠图

可以。你给我 PNG/JPG 后，我可以做这些处理:

- 把纯色背景、浅色背景或复杂背景抠成透明 PNG。
- 裁切到紧贴主体但保留统一留白。
- 统一尺寸，比如玩家机 `512x512`、普通敌机 `256x256`、Boss `768x768`。
- 检查透明边缘、黑边、白边和残留背景。
- 后续把图片接入 Canvas，并保留代码图形作为失败兜底。

为了抠图更干净，生成时尽量做到:

- 主体和背景颜色对比强。
- 不要让尾焰、发光、烟雾贴住背景边缘。
- 不要生成投影落在地面上。
- 不要把多个单位放在同一张图里，除非明确要做 spritesheet。

## 交付命名建议

先按这些名字给我最省事:

```text
assets/images/backgrounds/world-01-base.png
assets/images/backgrounds/world-01-mid.png
assets/images/backgrounds/world-01-fg.png
assets/images/ships/player-balanced.png
assets/images/ships/player-attacker.png
assets/images/ships/player-defender.png
assets/images/ships/player-scout.png
assets/images/enemies/enemy-small.png
assets/images/enemies/enemy-medium.png
assets/images/enemies/enemy-large.png
assets/images/bosses/boss-01-guard.png
```

## 背景生成规则

背景建议拆成三层:

- `base`: 不透明底图，尺寸 `1080x1920`，负责世界气氛。
- `mid`: 透明 PNG，尺寸 `1080x1920`，中景云层、平台、舰队影子、地貌块，用于慢速视差。
- `fg`: 透明 PNG，尺寸 `1080x1920`，高速线条、碎片、近景光带，用于快速视差。

背景不要有太强的地平线。这个游戏是俯视卷轴，不是横版飞行。

## 世界 1: 近海突破

底图:

```text
top-down vertical scrolling sci-fi shooter background, futuristic coastal megacity above deep ocean, dark blue morning sky reflected on water, distant harbor platforms, subtle neon blue lights, readable vertical flight path, 9:16 composition, polished 2D game background, no text, no UI
```

中景透明层:

```text
transparent PNG parallax layer for a vertical shooter, floating offshore platforms, small cloud wisps, faint bridge segments, blue cyan holographic runway blocks, top-down view, sparse layout, tileable vertically, no text, no UI
```

前景透明层:

```text
transparent PNG foreground speed layer, thin rain-like speed streaks, small blue light particles, subtle mist trails, vertical motion feeling, sparse and readable, no text, no UI
```

## 世界 2: 大漠强袭

底图:

```text
top-down vertical scrolling sci-fi shooter background, desert canyon military zone, orange sandstorm haze, buried futuristic ruins, armored outposts, warm amber light, readable central flight lane, 9:16 composition, polished 2D game background, no text, no UI
```

中景透明层:

```text
transparent PNG parallax layer, desert dust clouds, half-buried metal platforms, small radar dishes, drifting sand ribbons, top-down vertical shooter, tileable vertically, no text, no UI
```

前景透明层:

```text
transparent PNG foreground speed layer, fast sand particles, amber streaks, tiny debris fragments, sparse enough for gameplay readability, no text, no UI
```

## 世界 3: 夜空决战

底图:

```text
top-down vertical scrolling sci-fi shooter background, high altitude night battle above a futuristic city, dark indigo sky, distant city lights far below, purple blue clouds, orbital defense grid, readable central lane, 9:16 composition, polished 2D game background, no text, no UI
```

中景透明层:

```text
transparent PNG parallax layer, purple storm clouds, distant drone silhouettes, soft neon grid fragments, top-down vertical shooter, tileable vertically, no text, no UI
```

前景透明层:

```text
transparent PNG foreground speed layer, blue violet speed streaks, tiny sparks, electric particles, sparse, crisp, no text, no UI
```

## 世界 4: 深渊禁地

底图:

```text
top-down vertical scrolling sci-fi shooter background, forbidden abyss biomechanical fortress, dark crimson atmosphere, black red clouds, alien metal trenches, glowing green toxic fissures, ominous but readable, 9:16 composition, polished 2D game background, no text, no UI
```

中景透明层:

```text
transparent PNG parallax layer, jagged alien metal plates, red fog bands, green energy vents, floating biomechanical fragments, top-down vertical shooter, tileable vertically, no text, no UI
```

前景透明层:

```text
transparent PNG foreground speed layer, crimson streaks, green embers, small black debris, sparse and readable, no text, no UI
```

## 世界 5: 虚空回廊

底图:

```text
top-down vertical scrolling sci-fi shooter background, cosmic void corridor, deep black purple space, warped neon pathways, distant stars, geometric energy gates, mysterious final zone, readable central lane, 9:16 composition, polished 2D game background, no text, no UI
```

中景透明层:

```text
transparent PNG parallax layer, floating purple geometric gate pieces, translucent nebula ribbons, distant asteroid silhouettes, top-down vertical shooter, tileable vertically, no text, no UI
```

前景透明层:

```text
transparent PNG foreground speed layer, violet speed lines, star particles, small glowing shards, sparse, high contrast, no text, no UI
```

## 玩家战机

玩家机生成尺寸建议 `512x512`，透明 PNG。四种机型要共享同一美术语言，但剪影明显不同。

平衡型:

```text
top-down player spaceship sprite, nose pointing up, balanced delta wing fighter, blue white armor, single glowing cockpit, compact arcade shooter silhouette, polished sci-fi metal, transparent background, centered, full body visible, 512x512, no text, no UI
```

攻击型:

```text
top-down player spaceship sprite, nose pointing up, aggressive twin-engine attack fighter, red armor, sharp split wings, visible weapon pods, glowing orange thrusters, transparent background, centered, full body visible, 512x512, no text, no UI
```

防御型:

```text
top-down player spaceship sprite, nose pointing up, heavy armored defender fighter, teal green armor, broad shield-like wings, thick plating, sturdy silhouette, transparent background, centered, full body visible, 512x512, no text, no UI
```

侦查型:

```text
top-down player spaceship sprite, nose pointing up, fast scout interceptor, yellow gold accents, narrow dart shape, sleek small silhouette, stealth panels, transparent background, centered, full body visible, 512x512, no text, no UI
```

## 普通敌机

普通敌机建议 `256x256`，透明 PNG，全部朝下或朝玩家方向。为了接入简单，先统一画成“机头朝下”的敌机。

小型机:

```text
top-down enemy spaceship sprite, nose pointing down, small fast drone fighter, red armor, simple sharp silhouette, one glowing core, transparent background, centered, full body visible, 256x256, no text, no UI
```

中型机:

```text
top-down enemy spaceship sprite, nose pointing down, medium assault fighter, orange armor, twin tail fins, central cockpit core, readable arcade shooter silhouette, transparent background, centered, full body visible, 256x256, no text, no UI
```

大型机:

```text
top-down enemy spaceship sprite, nose pointing down, large heavy bomber, pink magenta armor, wide body, side pods, thick metal plating, transparent background, centered, full body visible, 256x256, no text, no UI
```

重炮机:

```text
top-down enemy spaceship sprite, nose pointing down, heavy gunner aircraft, blue violet armor, boxy armored hull, two visible cannons, glowing white core, transparent background, centered, full body visible, 256x256, no text, no UI
```

分裂机:

```text
top-down enemy spaceship sprite, nose pointing down, modular splitter drone, green cyan armor, three connected circular pods, segmented mechanical body, transparent background, centered, full body visible, 256x256, no text, no UI
```

狙击机:

```text
top-down enemy spaceship sprite, nose pointing down, sniper aircraft, magenta armor, long narrow barrel, precise thin silhouette, glowing targeting lens, transparent background, centered, full body visible, 256x256, no text, no UI
```

雷机:

```text
top-down enemy mine drone sprite, circular detonator aircraft, yellow black hazard armor, cross warning pattern, compact explosive silhouette, transparent background, centered, full body visible, 256x256, no text, no UI
```

幻影机:

```text
top-down enemy spaceship sprite, nose pointing down, phantom interceptor, cyan armor, narrow body, blade-like side wings, slightly translucent energy edges, transparent background, centered, full body visible, 256x256, no text, no UI
```

母舰机:

```text
top-down enemy carrier aircraft sprite, nose pointing down, purple armored mini carrier, thick hull, side launch bays, heavy but smaller than boss, transparent background, centered, full body visible, 256x256, no text, no UI
```

## Boss

Boss 建议 `768x768` 或 `1024x1024`，透明 PNG。Boss 可以有更多细节，但剪影必须清楚。

近卫舰:

```text
top-down boss spaceship sprite, nose pointing down, fortress guard flagship, purple magenta delta hull, heavy armor plates, side cannons, glowing red core, arcade shooter boss, transparent background, centered, full body visible, 768x768, no text, no UI
```

旋刃:

```text
top-down boss spaceship sprite, cross shaped rotating blade warship, blue cyan armor, four blade wings, glowing central reactor, sharp mechanical silhouette, transparent background, centered, full body visible, 768x768, no text, no UI
```

轰炸机:

```text
top-down boss spaceship sprite, massive hexagonal bomber fortress, orange armor, missile bays, heavy plating, industrial military design, glowing red core, transparent background, centered, full body visible, 768x768, no text, no UI
```

深渊君王:

```text
top-down boss spaceship sprite, abyss king biomechanical star-shaped warship, black red green armor, alien metal ribs, toxic green reactor, ominous silhouette, transparent background, centered, full body visible, 768x768, no text, no UI
```

虚空吞噬者:

```text
top-down final boss spaceship sprite, octagonal void devourer fortress, black purple armor, cosmic energy core, geometric armor plates, sinister elegant silhouette, transparent background, centered, full body visible, 1024x1024, no text, no UI
```

## 子弹、导弹和特效

这些可以先不生成，Canvas 代码画出来已经够用。后续如果要换成图片，优先生成小型 spritesheet。

导弹:

```text
top-down missile game sprite, nose pointing up, small silver missile, orange engine flame, transparent background, centered, 256x256, no text, no UI
```

激光命中特效:

```text
transparent PNG game VFX sprite, blue white laser impact burst, circular sparks, crisp energy particles, centered, no background, no text, no UI
```

爆炸序列:

```text
sprite sheet, 4 columns 4 rows, arcade sci-fi explosion animation, orange yellow fireball with smoke, transparent background, consistent centered frames, no text, no UI
```

## 首批优先级

建议第一批只生成这些，先验证接入质量:

1. 五个 `base` 背景。
2. 五个 `mid` 透明视差层。
3. 四架玩家机。
4. 三个基础敌机: 小型机、中型机、大型机。

这批完成后，再补 Boss 和更多敌机。这样可以最快把整体观感拉起来，同时不让素材管理一开始就变重。

## 接入到游戏

图片素材接入点在 `src/assets.js`。游戏只会加载清单中登记的图片，所以现在没有素材时不会产生 404，也不会影响直接打开 HTML。

登记示例:

```js
manifest: {
  player: {
    balanced: "assets/images/ships/player-balanced.png",
  },
  enemy: {
    small: "assets/images/enemies/enemy-small.png",
  },
  boss: {
    0: "assets/images/bosses/boss-01-guard.png",
  },
  background: {
    1: {
      base: "assets/images/backgrounds/world-01-base.png",
      mid: "assets/images/backgrounds/world-01-mid.png",
      fg: "assets/images/backgrounds/world-01-fg.png",
    },
  },
}
```

当前已支持图片兜底:

- 五个世界背景的 `base / mid / fg` 三层视差图。
- 玩家机型选择页和游戏内玩家机体。
- 普通敌机。
- Boss 战斗机体和图鉴预览。
