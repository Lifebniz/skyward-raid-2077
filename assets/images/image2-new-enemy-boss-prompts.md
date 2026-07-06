# Image 2 新敌机与新 Boss 生成提示词

本文件对应根目录 `ENEMY_BOSS_DESIGN.md` 里的新增单位。把每个任务分别交给 image 2 生成，生成后保存到“目标路径”。这些是新文件，不覆盖现有素材；后续再在 `src/assets.js` 中登记。

## 全局要求

- 项目是竖屏 Canvas 空战游戏，画面是俯视视角，玩家在下方，敌人从上往下飞。
- 所有飞机和 Boss 都必须是俯视正交视角，机头朝图片下方，主体居中，左右对称为主。
- 输出 PNG。敌机尺寸 256 x 256，Boss 尺寸 1024 x 1024。
- 背景必须透明，不要黑底、白底、纯色底、阴影方块、文字、Logo、水印、UI 或边框。
- 风格：高质量 2D 科幻街机空战资产，半写实数字绘画，清晰剪影，金属材质，适量霓虹边缘光。
- 可读性优先：敌机缩小到游戏内几十像素时仍能分辨核心形状和功能部件。
- 不要低清像素风、照片、3D 渲染截图、厚重卡通贴纸、极简 SVG 图标、线框草图。
- 留透明安全边距：敌机主体占画布 70%-84%；Boss 主体占画布 78%-88%，不要裁切发光、翼尖、炮管或外圈结构。

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

目标路径：`assets/images/bosses/boss-09-iron-curtain-carrier.png`

```text
Generate a 1024x1024 transparent PNG sprite for a boss spaceship called Iron Curtain Carrier in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical, full body visible. Design: massive dark gray carrier flagship, very wide armored flight deck, thick rectangular-octagonal hull, side drone launch bays with small glowing hangar slits, heavy plating, command bridge core glowing cold blue near the upper center, reinforced lower prow, small turret nodes, orange warning lights used sparingly. It should read as a durable summoner carrier with armor windows and escort drones. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

### Boss 10 `tideCore` 引潮核心

目标路径：`assets/images/bosses/boss-10-tide-core.png`

```text
Generate a 1024x1024 transparent PNG sprite for a boss spaceship called Tide Core in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, symmetrical, full body visible. Design: black-blue circular ring warship, rotating gravity reactor in the center glowing deep cyan, three segmented outer armor rings, star-shaped inner frame, heavy dark navy armor, subtle gravitational distortion arcs, pale blue energy conduits, lower armored nose wedge, ominous cosmic silhouette. It should communicate gravity pull, tidal force, and area-control pressure. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

### Endless Boss `unstablePrototype` 失控原型机

目标路径：`assets/images/bosses/boss-endless-unstable-prototype.png`

```text
Generate a 1024x1024 transparent PNG sprite for an endless-mode boss spaceship called Unstable Prototype in a vertical top-down sci-fi arcade shooter. Orthographic top-down view, nose pointing downward, centered, deliberately asymmetrical but still readable, full body visible. Design: experimental modular warship assembled from mismatched armor plates, one side has a prism reflector wing, the other side has a carrier launch bay, exposed unstable reactor core glowing magenta-cyan, patchwork dark metal hull, temporary weapon pods, incomplete prototype frame, dangerous unfinished military test machine. Use cyan, violet, red, and dark gunmetal accents without becoming noisy. It should feel like a randomized boss that borrowed parts from other bosses. High-quality 2D digital painting, transparent background, safe padding, no black box, no text, no logo, no UI, no cropping.
```

## 生成后检查

- 敌机文件均为 256 x 256 PNG，Boss 文件均为 1024 x 1024 PNG。
- 所有图片都有透明通道，透明边缘干净，无黑底、白底、文字、水印。
- 机头朝下，主体居中，完整可见。
- 缩小预览时仍能看出单位职责：信标灯、投弹舱、相位翼、棱镜核心、牵引线圈、护盾投射器、吸附爪、Boss 核心结构。
- 生成文件保存到上方目标路径后，再另行更新 `src/assets.js` 接入；图片缺失时游戏仍可 Canvas 兜底。
