# Image 2 资源重绘提示词

把下面每个任务分别交给 image 2 生成。生成后直接覆盖对应文件路径。不要改文件名、目录、尺寸或透明度要求。

## 全局要求

- 项目是竖屏 Canvas 空战游戏，画面是俯视视角，玩家在下方，敌人从上往下飞。
- 美术风格：高质量 2D 科幻街机空战资产，半写实数字绘画，清晰剪影，霓虹边缘光，干净金属材质，比原来的 Canvas 几何图形更精致。
- 不要文字、Logo、水印、UI、边框、签名、真实品牌、人物。
- 不要做成低清像素风、3D 渲染截图、照片、厚重卡通贴纸、极简 SVG 图标或原始 Canvas 线框。
- 颜色要保留原识别：小敌机红粉，中敌机橙色，大敌机玫红，首个 Boss 紫色；背景五个世界分别是蓝、沙漠橙、深空紫、深渊红绿、虚空紫青。
- 游戏可读性优先：背景暗一些、细节不要抢眼；飞机主体边缘清楚，透明边缘干净，不要被裁切。

## 背景图通用要求

- 输出 PNG，尺寸必须是 1080 x 1920。
- `*-base.png`：不透明背景，完整填满画布，没有透明通道。
- `*-mid.png` 和 `*-fg.png`：透明 PNG，只画中景或前景元素，其他区域必须透明，不要填黑底或纯色底。
- 每个背景都要适合竖向循环滚动：顶部和底部不要出现明显断裂的大型独立物体；元素分布要能在上下拼接时自然延续。
- 保留竖屏中间约 35% 宽度的飞行通道，中心区域可以有弱光、道路、能量带或云雾，但不要塞高对比障碍物。
- 背景整体对比低于飞机和子弹，避免纯白大块、强烈噪点、过密线条。

### `assets/images/backgrounds/world-01-base.png`

提示词：

```text
Generate a 1080x1920 opaque PNG background for a vertical scrolling top-down sci-fi arcade shooter. World 1: coastal megacity approach, cool blue and cyan palette. Orthographic top-down view, dark ocean and city roof plates on both sides, a subtle central flight corridor with soft cyan runway lights and pale mist, futuristic harbor platforms, clean readable silhouettes, high-quality 2D digital painting, polished game background, no text, no logo, no UI. Keep the center lane relatively calm and darker for gameplay readability. Make the top and bottom edges vertically tiling friendly, with no obvious cut-off landmark.
```

### `assets/images/backgrounds/world-01-mid.png`

提示词：

```text
Generate a 1080x1920 transparent PNG midground overlay for World 1 of a vertical scrolling top-down sci-fi shooter. Only draw semi-transparent cyan clouds, distant floating platform silhouettes, faint holographic lane markers, soft mist bands, and small blue light glows. Leave most of the canvas transparent. No black background, no solid fill, no text, no UI. Keep the center gameplay lane readable. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-01-fg.png`

提示词：

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 1 of a vertical scrolling top-down sci-fi shooter. Only draw sparse cyan and ice-blue rain streaks, tiny light particles, and a few fast motion lines running mostly vertical. Leave the rest transparent. No black background, no solid fill, no text, no UI. Do not make the streaks too dense; the gameplay must stay readable. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-02-base.png`

提示词：

```text
Generate a 1080x1920 opaque PNG background for a vertical scrolling top-down sci-fi arcade shooter. World 2: desert canyon assault, warm orange, amber, rust, and dark brown palette. Orthographic top-down view, canyon walls and angular sci-fi mining platforms along the left and right edges, a calmer central flight corridor like a pale sand road or dry riverbed, subtle heat haze and dust, high-quality 2D digital painting, polished game background, no text, no logo, no UI. Keep the center lane readable and not too bright. Make the top and bottom edges vertically tiling friendly.
```

### `assets/images/backgrounds/world-02-mid.png`

提示词：

```text
Generate a 1080x1920 transparent PNG midground overlay for World 2 of a vertical scrolling top-down sci-fi shooter. Only draw translucent orange dust clouds, soft sand haze, distant hovering desert platforms, faint amber light strips, and sparse canyon shadow shapes. Leave most of the canvas transparent. No black background, no solid fill, no text, no UI. Keep the center lane readable. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-02-fg.png`

提示词：

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 2 of a vertical scrolling top-down sci-fi shooter. Only draw sparse amber and orange sand streaks, dust particles, and thin vertical motion lines. Leave the rest transparent. No black background, no solid fill, no text, no UI. Avoid dense sand noise. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-03-base.png`

提示词：

```text
Generate a 1080x1920 opaque PNG background for a vertical scrolling top-down sci-fi arcade shooter. World 3: night sky decisive battle, deep navy, violet, and electric purple palette. Orthographic top-down view above a futuristic orbital city or stratosphere highway, dark star field, subtle central luminous corridor, thin purple energy rails, distant aircraft-route lights, high-quality 2D digital painting, polished game background, no text, no logo, no UI. Keep the center lane playable and not over-detailed. Make the top and bottom edges vertically tiling friendly.
```

### `assets/images/backgrounds/world-03-mid.png`

提示词：

```text
Generate a 1080x1920 transparent PNG midground overlay for World 3 of a vertical scrolling top-down sci-fi shooter. Only draw soft purple nebula clouds, faint diagonal laser-beam trails, small diamond-shaped floating panels, and distant violet energy haze. Leave most of the canvas transparent. No black background, no solid fill, no text, no UI. Keep the center lane readable. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-03-fg.png`

提示词：

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 3 of a vertical scrolling top-down sci-fi shooter. Only draw sparse violet, blue, and magenta star streaks, tiny glowing particles, and fast vertical motion lines. Leave the rest transparent. No black background, no solid fill, no text, no UI. Keep it light enough for bullets and enemies to remain clear. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-04-base.png`

提示词：

```text
Generate a 1080x1920 opaque PNG background for a vertical scrolling top-down sci-fi arcade shooter. World 4: abyss forbidden zone, dark crimson, black red, toxic neon green palette. Orthographic top-down view of a hostile biomechanical chasm, jagged vertical walls, alien energy vines and reactor veins along the sides, a dangerous but readable central flight corridor, subtle red fog, high-quality 2D digital painting, polished game background, no text, no logo, no UI. Keep bright green details mostly near the sides so the center remains playable. Make the top and bottom edges vertically tiling friendly.
```

### `assets/images/backgrounds/world-04-mid.png`

提示词：

```text
Generate a 1080x1920 transparent PNG midground overlay for World 4 of a vertical scrolling top-down sci-fi shooter. Only draw translucent crimson fog bands, dark jagged shard silhouettes, thin neon-green energy vein fragments, and ominous red glow patches. Leave most of the canvas transparent. No black background, no solid fill, no text, no UI. Avoid covering the center lane too much. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-04-fg.png`

提示词：

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 4 of a vertical scrolling top-down sci-fi shooter. Only draw sparse red and toxic-green glitch streaks, falling ember particles, and thin vertical energy scratches. Leave the rest transparent. No black background, no solid fill, no text, no UI. Keep the overlay sparse for gameplay readability. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-05-base.png`

提示词：

```text
Generate a 1080x1920 opaque PNG background for a vertical scrolling top-down sci-fi arcade shooter. World 5: void corridor, black-violet deep space, indigo, purple, and cyan palette. Orthographic top-down view of a cosmic hyperspace corridor, dark star field, subtle central pale energy lane, distant geometric void architecture, floating polygon ruins along the sides, high-quality 2D digital painting, polished game background, no text, no logo, no UI. Keep the center lane readable and not too bright. Make the top and bottom edges vertically tiling friendly.
```

### `assets/images/backgrounds/world-05-mid.png`

提示词：

```text
Generate a 1080x1920 transparent PNG midground overlay for World 5 of a vertical scrolling top-down sci-fi shooter. Only draw translucent purple nebula ribbons, floating hexagon and triangle debris, cyan edge glows, and distant dimensional distortion bands. Leave most of the canvas transparent. No black background, no solid fill, no text, no UI. Keep the center lane readable. Vertically tiling friendly.
```

### `assets/images/backgrounds/world-05-fg.png`

提示词：

```text
Generate a 1080x1920 transparent PNG foreground speed overlay for World 5 of a vertical scrolling top-down sci-fi shooter. Only draw sparse cyan, violet, and blue hyperspace streaks, tiny glowing star particles, and thin vertical motion trails. Leave the rest transparent. No black background, no solid fill, no text, no UI. Do not make the streaks dense. Vertically tiling friendly.
```

## 敌机和 Boss 通用要求

- 敌机输出 PNG，尺寸必须是 256 x 256，透明背景。
- `boss-01-guard.png` 输出 PNG，尺寸必须是 768 x 768，透明背景。
- 俯视视角，机头朝图片下方，左右对称，居中摆放。
- 飞机主体占画布 70% 到 86%，四周留透明安全边距，不要裁切发光、机翼或炮管。
- 外轮廓必须清楚，适合缩小到游戏内几十像素显示。
- 允许柔和阴影和外发光，但只能在透明通道里，不能带黑色方底。

### `assets/images/enemies/enemy-small.png`

提示词：

```text
Generate a 256x256 transparent PNG sprite for a small enemy interceptor in a vertical top-down sci-fi arcade shooter. Top-down orthographic aircraft, nose pointing downward, centered, symmetrical. Keep the existing identity: compact magenta-red fighter, sharp narrow triangular body, swept blade wings, pale pink glass cockpit or sensor dome near the upper center, darker crimson central fuselage, thin white/cyan rim light, subtle metal shading, clean silhouette, high-quality 2D digital painting. Transparent background, no shadow box, no text, no logo, no UI. Leave safe padding around the aircraft.
```

### `assets/images/enemies/enemy-medium.png`

提示词：

```text
Generate a 256x256 transparent PNG sprite for a medium enemy fighter in a vertical top-down sci-fi arcade shooter. Top-down orthographic aircraft, nose pointing downward, centered, symmetrical. Keep the existing identity: orange and amber agile fighter, star-like swept wings, pointed lower nose, twin angular side fins, warm beige cockpit canopy near the upper center, dark bronze central fuselage, small white/cyan edge highlights, polished metal panels, clean readable silhouette, high-quality 2D digital painting. Transparent background, no shadow box, no text, no logo, no UI. Leave safe padding around the aircraft.
```

### `assets/images/enemies/enemy-large.png`

提示词：

```text
Generate a 256x256 transparent PNG sprite for a large heavy enemy gunship in a vertical top-down sci-fi arcade shooter. Top-down orthographic aircraft, nose pointing downward, centered, symmetrical. Keep the existing identity: heavy rose-pink bomber, broad armored side pods, large angular wings folding toward a sharp lower nose, pale pink round cockpit or energy dome near the upper center, dark burgundy central spine, two rounded lower engine housings, thin white/cyan rim light, subtle panel lines and metal shading, powerful but readable silhouette, high-quality 2D digital painting. Transparent background, no shadow box, no text, no logo, no UI. Leave safe padding around the aircraft.
```

### `assets/images/bosses/boss-01-guard.png`

提示词：

```text
Generate a 768x768 transparent PNG sprite for the first boss guard frigate in a vertical top-down sci-fi arcade shooter. Top-down orthographic boss aircraft, nose pointing downward, centered, symmetrical, fills about 82 percent of the canvas width with safe transparent padding. Keep the existing identity: massive purple delta-wing guard ship, wide angular wing plates, central dark violet armored hull, sharp lower nose, red glowing reactor core near the center, red side weapon nodes, black antenna-like cannons on both upper sides, small lower thruster pods, thin cyan-white rim highlights, purple neon edge glow, layered armor panels, intimidating flagship silhouette, high-quality 2D digital painting. Transparent background, no black square, no text, no logo, no UI, no cropping.
```

## 覆盖后检查

- 文件路径和文件名完全不变。
- 背景全部是 1080 x 1920。
- 敌机全部是 256 x 256。
- Boss 是 768 x 768。
- `base` 背景不透明；`mid`、`fg`、敌机、Boss 有透明通道。
- PNG 周围没有黑底、白底、文字、水印或裁切。
