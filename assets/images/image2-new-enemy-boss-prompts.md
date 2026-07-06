# Image 2 新敌机与新 Boss 生成提示词

本文件对应根目录 `ENEMY_BOSS_DESIGN.md` 和当前代码里已经出现的新增世界、玩家僚机、敌机、Boss、机制效果。把每个任务分别交给 image 2 生成，生成后保存到“目标路径”。敌机和 Boss 路径应与 `src/assets.js` 保持一致；世界 6-8 背景、玩家僚机和机制效果生成后还需要另行登记到 `src/assets.js` 才会被游戏使用。

## 全局要求

- 项目是竖屏 Canvas 空战游戏，画面是俯视视角，玩家在下方，敌人从上往下飞。
- 所有飞机和 Boss 都必须是俯视正交视角，主体居中，左右对称为主。敌机和 Boss 机头朝图片下方；玩家僚机机头朝图片上方。
- 输出 PNG。背景尺寸 1080 x 1920，敌机尺寸 256 x 256，机制效果尺寸按条目要求，Boss 尺寸 1024 x 1024。
- 敌机、Boss、机制效果必须透明背景，不要黑底、白底、纯色底、阴影方块、文字、Logo、水印、UI 或边框。背景图按 `base/mid/fg` 各自要求处理。
- 风格：高质量 2D 科幻街机空战资产，半写实数字绘画，清晰剪影，金属材质，适量霓虹边缘光。
- 可读性优先：敌机缩小到游戏内几十像素时仍能分辨核心形状和功能部件。
- 不要低清像素风、照片、3D 渲染截图、厚重卡通贴纸、极简 SVG 图标、线框草图。
- 留透明安全边距：敌机主体占画布 70%-84%；Boss 主体占画布 78%-88%，不要裁切发光、翼尖、炮管或外圈结构。

## 地区背景

背景通用要求：

- 每个世界三层：`base` 为不透明完整底图，`mid` 和 `fg` 为透明 PNG 叠加层。
- 三层都必须是 1080 x 1920，适合竖向循环滚动，顶部和底部不要出现明显断裂的大型主体。
- 保留中间约 35% 宽度的飞行通道，中心可以有弱光、雾、航道线，但不要高对比障碍物。
- 背景对比度低于飞机、子弹和 HUD，不要纯白大块、密集噪点或抢眼文字。

### 世界 6 棱镜空域 `world-06-base.png`

目标路径：`assets/images/backgrounds/world-06-base.png`

```text
Generate a 1080x1920 opaque PNG base background for World 6 of a vertical scrolling top-down sci-fi arcade shooter. Theme: prism airspace and refracted light corridors, matching the Prism Judge boss. Orthographic top-down view above a high-altitude crystalline city, dark blue-violet sky base, distant glass-like platforms along the left and right edges, subtle central flight lane with pale cyan and violet light refraction, angular mirror pylons, soft haze, polished 2D digital painting. Keep the center readable and darker than enemies. No text, no logo, no UI. Vertically tiling friendly with no obvious cut-off landmark.
```

### 世界 6 棱镜空域 `world-06-mid.png`

目标路径：`assets/images/backgrounds/world-06-mid.png`

```text
Generate a 1080x1920 transparent PNG midground overlay for World 6 prism airspace in a vertical scrolling top-down sci-fi shooter. Only draw translucent violet-cyan prism flares, faint diagonal refracted light bands, small floating mirror shards, distant hexagonal platform silhouettes, and soft glassy haze. Leave most of the canvas transparent, no black background, no solid fill, no text, no UI. Keep the center gameplay lane readable. Vertically tiling friendly.
```

### 世界 6 棱镜空域 `world-06-fg.png`

目标路径：`assets/images/backgrounds/world-06-fg.png`

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 6 prism airspace in a vertical scrolling top-down sci-fi shooter. Only draw sparse cyan, violet, and white light streaks, tiny refracted glints, thin vertical motion lines, and a few subtle prism spark particles. Leave the rest transparent, no black background, no solid fill, no text, no UI. Keep it sparse for bullet readability. Vertically tiling friendly.
```

### 世界 7 铁幕舰队 `world-07-base.png`

目标路径：`assets/images/backgrounds/world-07-base.png`

```text
Generate a 1080x1920 opaque PNG base background for World 7 of a vertical scrolling top-down sci-fi arcade shooter. Theme: iron curtain carrier fleet, industrial warship airspace, matching the Iron Curtain Carrier boss. Orthographic top-down view above massive dark gray carrier decks, armored runway plates, hangar structures and escort fleet silhouettes along the edges, cold blue command lights, muted orange warning lights, smoky metal atmosphere. Preserve a central flight corridor with lower contrast. High-quality 2D digital painting, no text, no logo, no UI. Vertically tiling friendly.
```

### 世界 7 铁幕舰队 `world-07-mid.png`

目标路径：`assets/images/backgrounds/world-07-mid.png`

```text
Generate a 1080x1920 transparent PNG midground overlay for World 7 iron carrier fleet in a vertical scrolling top-down sci-fi shooter. Only draw translucent smoke bands, distant aircraft deck silhouettes, small escort drone shadows, blue hangar light strips, and muted gray industrial haze. Leave most of the canvas transparent, no black background, no solid fill, no text, no UI. Keep the center lane readable. Vertically tiling friendly.
```

### 世界 7 铁幕舰队 `world-07-fg.png`

目标路径：`assets/images/backgrounds/world-07-fg.png`

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 7 iron carrier fleet in a vertical scrolling top-down sci-fi shooter. Only draw sparse steel-gray smoke wisps, orange ember flecks, cold blue tracer streaks, and thin vertical motion scratches. Leave the rest transparent, no black background, no solid fill, no text, no UI. Do not make it dense or noisy. Vertically tiling friendly.
```

### 世界 8 引潮核心区 `world-08-base.png`

目标路径：`assets/images/backgrounds/world-08-base.png`

```text
Generate a 1080x1920 opaque PNG base background for World 8 of a vertical scrolling top-down sci-fi arcade shooter. Theme: gravity tide core and cosmic control zone, matching the Tide Core boss. Orthographic top-down view through a black-blue gravitational corridor, deep space, faint circular gravity rings, segmented orbital structures along the sides, cyan energy currents bending toward a central lane, subtle tidal distortion arcs. Dark, readable, polished 2D digital painting, no text, no logo, no UI. Keep the center lane clear and playable. Vertically tiling friendly.
```

### 世界 8 引潮核心区 `world-08-mid.png`

目标路径：`assets/images/backgrounds/world-08-mid.png`

```text
Generate a 1080x1920 transparent PNG midground overlay for World 8 gravity tide core in a vertical scrolling top-down sci-fi shooter. Only draw translucent cyan gravity arcs, soft blue nebula ribbons, faint circular wavefronts, tiny orbiting debris, and distant ring-structure fragments. Leave most of the canvas transparent, no black background, no solid fill, no text, no UI. Keep the central gameplay lane readable. Vertically tiling friendly.
```

### 世界 8 引潮核心区 `world-08-fg.png`

目标路径：`assets/images/backgrounds/world-08-fg.png`

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 8 gravity tide core in a vertical scrolling top-down sci-fi shooter. Only draw sparse cyan and deep-blue hyperspace streaks, small bending star particles, thin vertical motion trails, and a few curved gravity glints. Leave the rest transparent, no black background, no solid fill, no text, no UI. Keep it sparse and readable. Vertically tiling friendly.
```

## 玩家僚机

僚机通用要求：

- 输出 256 x 256 透明 PNG。后续实际绘制时可裁透明边界并缩放到 28-40px。
- 玩家僚机属于玩家阵营，机头必须朝图片上方，和敌机方向相反。
- 需要比主战机更小、更轻、更像无人僚机，避免抢主机视觉中心。
- 外轮廓清楚，带一点尾焰或推进器结构，但不要画正在发射的子弹。
- 四个机型变体可以都生成；如果只想先接一个通用款，优先使用 `player-wingman-balanced.png`。

### 通用/平衡型僚机

目标路径：`assets/images/ships/player-wingman-balanced.png`

```text
Generate a 256x256 transparent PNG sprite for a player allied wingman drone in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing upward, centered, symmetrical, full body visible. Design: compact blue-cyan escort fighter, smaller than the main player ship, delta body, small swept wings, pale cockpit or sensor slit, twin rear thrusters, clean friendly silhouette, white-cyan rim light, polished metal panels, readable at tiny in-game size. It should look like a balanced support wingman flying beside the player. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no bullets.
```

### 攻击型僚机

目标路径：`assets/images/ships/player-wingman-attacker.png`

```text
Generate a 256x256 transparent PNG sprite for a player allied attack wingman drone in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing upward, centered, symmetrical, full body visible. Design: compact red-orange escort fighter, slim twin-prong attack frame, sharp forward nose, small side cannon pods, swept blade wings, hot engine glow at the rear, aggressive but friendly silhouette, polished metal with white highlights. It should clearly match an attack-type player ship without looking like an enemy. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no bullets.
```

### 防御型僚机

目标路径：`assets/images/ships/player-wingman-defender.png`

```text
Generate a 256x256 transparent PNG sprite for a player allied defender wingman drone in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing upward, centered, symmetrical, full body visible. Design: compact green-teal escort drone, sturdy armored body, short broad wings, small shield projector nodes on both sides, rounded reinforced nose, subtle protective cyan-green glow, twin rear thrusters, friendly durable silhouette. It should read as a defensive support wingman. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no bullets.
```

### 侦查型僚机

目标路径：`assets/images/ships/player-wingman-scout.png`

```text
Generate a 256x256 transparent PNG sprite for a player allied scout wingman drone in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing upward, centered, symmetrical, full body visible. Design: compact yellow-gold scout escort fighter, very slim dart-shaped body, small sensor nose, narrow swept fins, lightweight frame, faint optical-camouflage shimmer on the edges, bright but friendly silhouette, tiny rear thrusters. It should look fast and agile beside the player ship. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no bullets.
```

### 僚机补给图标

目标路径：`assets/images/effects/effect-wing-powerup.png`

```text
Generate a 256x256 transparent PNG pickup icon for a wingman upgrade in a vertical sci-fi arcade shooter. Design: friendly small escort-drone emblem, two tiny upward-facing wingman silhouettes orbiting a bright white-blue core, soft gray-blue square-free glow, readable as a collectible upgrade, polished arcade game icon style. Transparent background, centered, safe padding, no text, no numbers, no logo, no UI panel.
```

## 普通敌机

### `beacon` 信标机

目标路径：`assets/images/enemies/enemy-beacon.png`

```text
Generate a 256x256 transparent PNG sprite for a beacon enemy aircraft in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, mostly symmetrical. Design: dark navy narrow scout drone, slim elongated fuselage, small swept antenna fins, bright yellow signal beacon lamp on the upper-center hull, subtle red targeting sensor under the body, thin cyan rim light, clean metal panels, readable arcade shooter silhouette. It should look like a target-marking reconnaissance unit, fragile but important. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

### `mineLayer` 布雷机

目标路径：`assets/images/enemies/enemy-mine-layer.png`

```text
Generate a 256x256 transparent PNG sprite for a mine-layer enemy aircraft in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical. Design: orange and black armored bomber drone, compact heavy hull, two obvious round bomb bay doors on the lower half, dark graphite armor plates, small amber warning stripe shapes painted on the wings, blunt reinforced nose, short side wings, subtle orange engine glow, clean readable silhouette. It should immediately read as a slow area-denial mine carrier. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

### `phaseWing` 相位翼

目标路径：`assets/images/enemies/enemy-phase-wing.png`

```text
Generate a 256x256 transparent PNG sprite for a phase-wing enemy interceptor in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical. Design: purple and white blade-wing fighter, narrow central fuselage, folded knife-like side wings, sharp triangular lower nose, pale violet cockpit shard, faint translucent phase afterimage along the wing edges, magenta-blue energy seams, fast aggressive silhouette, polished metal shading. It should look like it can blink sideways before firing. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

### `mirrorDrone` 折镜无人机

目标路径：`assets/images/enemies/enemy-mirror-drone.png`

```text
Generate a 256x256 transparent PNG sprite for a mirror drone enemy in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical. Design: silver and cyan diamond-shaped drone, faceted reflective armor, central prism crystal core glowing cyan-white, four small angular stabilizer fins, glossy mirrored panel highlights, thin bright outline, compact small body with very clear geometric silhouette. It should read as a projectile-reflecting prism unit, not a normal fighter. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

### `tether` 牵引机

目标路径：`assets/images/enemies/enemy-tether.png`

```text
Generate a 256x256 transparent PNG sprite for a tether enemy aircraft in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical. Design: teal-green electromagnetic saucer fighter, circular compact central hull, two side coil emitters shaped like ring magnets, glowing cyan-green energy nodes, short stabilizer fins, subtle curved field lines engraved into the armor, dark teal metal underside, clean readable silhouette. It should look like a soft-control tractor-beam unit that pulls the player. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

### `warden` 监押机

目标路径：`assets/images/enemies/enemy-warden.png`

```text
Generate a 256x256 transparent PNG sprite for a warden enemy guard aircraft in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical. Design: blue-gray heavy guard drone, reinforced square-octagonal hull, four corner shield projector modules, pale blue shield glow in small emitter lenses, thick armor plates, short broad wings, protected convoy-core silhouette, calm but durable appearance. It should clearly read as a support unit that grants armor to nearby enemies. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

### `harvester` 收割机

目标路径：`assets/images/enemies/enemy-harvester.png`

```text
Generate a 256x256 transparent PNG sprite for a harvester enemy raider aircraft in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, slightly predatory but balanced silhouette. Design: dark gold and black fast raider drone, sleek narrow body, claw-like collector arms or magnetic grabber under the lower hull, small cargo pod near the rear, sharp swept wings, amber intake glow, polished worn metal, readable high-speed looter silhouette. It should look like it steals dropped items and tries to escape. High-quality 2D digital painting, transparent background, full body visible, safe padding, no black box, no text, no logo, no UI.
```

## Boss

### Boss 8 `prismJudge` 棱镜审判者

目标路径：`assets/images/bosses/boss-08-prism-judge.png`

```text
Generate a 1024x1024 transparent PNG sprite for a boss spaceship called Prism Judge in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, mostly symmetrical, full body visible. Design: elegant silver-white hexagonal warship, large central crystal prism core glowing cyan and violet, two detached floating reflector wings on the left and right, layered polished armor plates, thin gold and cyan energy seams, angular ceremonial but dangerous silhouette, underside laser emitter aligned with the lower nose, subtle purple-blue rim glow. It should communicate light beams, refraction, and precise judgement. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

### Boss 9 `ironCurtainCarrier` 铁幕空母

目标路径：`assets/images/bosses/boss-09-iron-carrier.png`

```text
Generate a 1024x1024 transparent PNG sprite for a boss spaceship called Iron Curtain Carrier in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical, full body visible. Design: massive dark gray carrier flagship, very wide armored flight deck, thick rectangular-octagonal hull, side drone launch bays with small glowing hangar slits, heavy plating, command bridge core glowing cold blue near the upper center, reinforced lower prow, small turret nodes, orange warning lights used sparingly. It should read as a durable summoner carrier with armor windows and escort drones. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

### Boss 10 `tideCore` 引潮核心

目标路径：`assets/images/bosses/boss-10-tide-core.png`

```text
Generate a 1024x1024 transparent PNG sprite for a boss spaceship called Tide Core in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical, full body visible. Design: black-blue circular ring warship, rotating gravity reactor in the center glowing deep cyan, three segmented outer armor rings, star-shaped inner frame, heavy dark navy armor, subtle gravitational distortion arcs, pale blue energy conduits, lower armored nose wedge, ominous cosmic silhouette. It should communicate gravity pull, tidal force, and area-control pressure. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

### Endless Boss `unstablePrototype` 失控原型机

目标路径：`assets/images/bosses/boss-11-unstable-prototype.png`

```text
Generate a 1024x1024 transparent PNG sprite for an endless-mode boss spaceship called Unstable Prototype in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, deliberately asymmetrical but still readable, full body visible. Design: experimental modular warship assembled from mismatched armor plates, one side has a prism reflector wing, the other side has a carrier launch bay, exposed unstable reactor core glowing magenta-cyan, patchwork dark metal hull, temporary weapon pods, incomplete prototype frame, dangerous unfinished military test machine. Use cyan, violet, red, and dark gunmetal accents without becoming noisy. It should feel like a randomized boss that borrowed parts from other bosses. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

## 可选机制效果图

这些机制当前可以继续用 Canvas 兜底绘制；如果希望统一换成图片资产，再生成本节文件并在代码中接入。`effect-wing-powerup.png` 已在“玩家僚机”章节列出。

### 信标锁定准星

目标路径：`assets/images/effects/effect-beacon-crosshair.png`

```text
Generate a 256x256 transparent PNG VFX sprite for a beacon target marker in a vertical sci-fi arcade shooter. Design: clean red-orange targeting crosshair, thin circular reticle, four short bracket marks, small glowing center dot, subtle yellow warning glow, readable over dark and bright backgrounds. Flat game VFX style with polished glow, no text, no numbers, no logo, no UI panel, transparent background, centered, safe padding.
```

### 浮雷

目标路径：`assets/images/effects/effect-floating-mine.png`

```text
Generate a 256x256 transparent PNG VFX/object sprite for a floating mine in a vertical top-down sci-fi arcade shooter. Top-down small spherical mine, orange-black armored shell, red blinking trigger core, tiny hazard fins, subtle circular energy aura, readable at small size, dangerous but compact. High-quality 2D game asset, transparent background, centered, full object visible, no text, no logo, no UI.
```

### 相位虚影

目标路径：`assets/images/effects/effect-phase-ghost.png`

```text
Generate a 256x256 transparent PNG VFX sprite for a phase blink warning ghost in a vertical sci-fi arcade shooter. Design: translucent purple-white outline of a blade-wing interceptor silhouette, faint duplicated edges, glitchy violet energy shimmer, no solid body, soft opacity suitable for showing a future teleport location. Transparent background, centered, no text, no logo, no UI.
```

### 牵引光束节点

目标路径：`assets/images/effects/effect-tether-beam-node.png`

```text
Generate a 256x256 transparent PNG VFX sprite for an electromagnetic tether beam node in a vertical sci-fi arcade shooter. Design: teal-green energy ring with two small coil arcs, thin radial pull lines, soft cyan glow, clean circular tractor-beam motif, readable but not overpowering. Transparent background, centered, no text, no logo, no UI.
```

### 重力预警环

目标路径：`assets/images/effects/effect-gravity-ring.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a gravity warning ring in a vertical sci-fi arcade shooter. Design: blue-cyan circular shock ring, segmented tidal wave arcs, subtle inward arrows suggested by light flow but no actual text or icons, transparent center, soft outer glow, suitable for scaling large over gameplay. Transparent background, centered, no text, no logo, no UI.
```

### 棱爆侧弹光片

目标路径：`assets/images/effects/effect-prism-burst-shard.png`

```text
Generate a 256x256 transparent PNG projectile/VFX sprite for a prism burst side projectile in a vertical sci-fi arcade shooter. Design: small faceted violet-cyan crystal light shard, elongated diamond shape, bright white core, refracted purple and cyan edges, soft glow, readable at small size. Transparent background, centered, no text, no logo, no UI.
```

## 生成后检查

- 背景文件均为 1080 x 1920 PNG；`base` 不透明，`mid` 和 `fg` 透明。
- 玩家僚机、敌机文件均为 256 x 256 PNG，机制效果按条目尺寸输出，Boss 文件均为 1024 x 1024 PNG。
- 除 `base` 背景外，所有图片都有透明通道，透明边缘干净，无黑底、白底、文字、水印。
- 玩家僚机机头朝上；敌机和 Boss 机头朝下；主体居中，完整可见。
- 缩小预览时仍能看出单位职责：玩家僚机、信标灯、投弹舱、相位翼、棱镜核心、牵引线圈、护盾投射器、吸附爪、Boss 核心结构、地区主题。
- 敌机和 Boss 文件路径要与 `src/assets.js` 一致；世界 6-8 背景、玩家僚机和可选机制效果生成后，再另行更新 `src/assets.js` 接入。图片缺失时游戏仍可 Canvas 兜底。
