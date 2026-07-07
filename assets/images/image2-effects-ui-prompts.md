# Image 2 机制特效与技能 UI 生成提示词

把下面每个任务分别交给 image 2 生成。生成后保存到“目标路径”；已有同名文件就直接覆盖。当前代码里有些特效/UI 仍是 Canvas 兜底绘制，图片生成后还需要后续在 `src/assets.js` 或 UI 绘制逻辑里接入。

## 全局要求

- 项目是竖屏 Canvas 空战游戏，俯视正交视角，玩家在下方，敌人从上往下飞。
- 本文所有特效、图标、UI 资源默认输出 PNG，透明背景；不要黑底、白底、纯色底、文字、数字、Logo、水印、真实品牌。
- 视觉风格：高质量 2D 科幻街机空战资产，半写实数字绘画，清晰剪影，干净发光，适合在深色和亮色背景上叠加。
- 游戏可读性优先：特效不要铺满实心烟雾，不要遮住玩家、敌机和子弹；中心区域尽量留透明或半透明。
- UI 图标要能在 24-48px 尺寸下识别，形状比细节更重要。除非条目特别说明，不要画圆形按钮底、卡片底、边框或文字，只画中心符号和轻微透明光晕。
- 建议尺寸：小型物体/道具/图标 256 x 256；范围预警、爆炸环、护盾反馈 512 x 512；竖向激光预警条 512 x 1024。

## 地雷与区域封锁特效

### 浮雷本体

目标路径：`assets/images/effects/effect-floating-mine.png`

```text
Generate a 256x256 transparent PNG gameplay object sprite for a floating mine in a vertical top-down sci-fi arcade shooter. Top-down compact spherical mine, orange-black armored shell, red blinking trigger core, small triangular hazard fins, subtle circular energy aura, dangerous but readable at tiny in-game size. Keep the object centered with safe transparent padding. High-quality 2D game asset, no black background, no white background, no text, no numbers, no logo, no UI panel.
```

### 浮雷武装状态

目标路径：`assets/images/effects/effect-mine-armed.png`

```text
Generate a 256x256 transparent PNG armed-state variant of a floating sci-fi mine for a vertical top-down arcade shooter. Same compact orange-black mine silhouette, but with a brighter red hot core, tiny warning LEDs, expanded small trigger spikes, and a tense pulsing orange aura. It should read as "about to trigger" without becoming a huge explosion. Centered, safe padding, transparent background, no text, no numbers, no logo, no UI.
```

### 浮雷触发预警圈

目标路径：`assets/images/effects/effect-mine-warning-pulse.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a mine trigger warning pulse in a vertical sci-fi arcade shooter. Design: thin orange-red circular danger ring with broken hazard segments, small outward pulse glow, transparent center, very light radial energy noise, readable over gameplay but not blocking bullets. No solid fill, no black background, no text, no numbers, no logo, no UI panel. Centered and scalable.
```

### 浮雷爆炸冲击环

目标路径：`assets/images/effects/effect-mine-explosion-ring.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a compact mine explosion shock ring in a vertical sci-fi arcade shooter. Design: orange-white center flash fading into a clean circular shockwave, small angular shrapnel sparks around the ring, hot ember fragments, transparent outer edges, readable and not smoky. Keep the middle flash semi-transparent so gameplay remains visible. No text, no logo, no UI, no square background.
```

### 浮雷碎片

目标路径：`assets/images/effects/effect-mine-shrapnel.png`

```text
Generate a 256x256 transparent PNG projectile/VFX sprite for mine shrapnel in a vertical sci-fi arcade shooter. Design: several small orange-red metal fragments and sparks flying outward from center, sharp angular pieces, hot white edges, subtle motion streaks, sparse enough to layer with other bullets. Transparent background, centered, no text, no logo, no UI.
```

### 爆雷弹环提示

目标路径：`assets/images/effects/effect-detonator-ring-warning.png`

```text
Generate a 512x512 transparent PNG warning VFX sprite for an enemy detonator ring attack in a vertical top-down sci-fi shooter. Design: amber circular outline made of 14 faint bullet ghost dots, thin expanding ring, small danger glints at regular intervals, transparent center, clear but not overwhelming. It should preview a radial bullet burst. No text, no numbers, no logo, no UI, no background fill.
```

### 通用危险区标记

目标路径：`assets/images/effects/effect-hazard-zone-orange.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a generic orange hazard zone marker in a vertical sci-fi arcade shooter. Design: thin semi-transparent orange warning circle, four subtle chevron brackets around the edge, faint heat shimmer, transparent center, no text or symbols that look like letters. It must remain readable at small scale and not block bullets. No black background, no UI panel, no watermark.
```

## 火焰与燃烧特效

### 持续火区

目标路径：`assets/images/effects/effect-fire-zone.png`

```text
Generate a 512x512 transparent PNG area VFX sprite for a persistent fire damage zone in a vertical top-down sci-fi arcade shooter. Design: circular patch of low sci-fi plasma flames, orange and red heat glow, bright yellow inner flickers, sparse ember particles, transparent center gaps so bullets remain visible, soft fading edge. It should look dangerous but not like an opaque explosion cloud. No black background, no text, no logo, no UI.
```

### 火区预警圈

目标路径：`assets/images/effects/effect-fire-warning-ring.png`

```text
Generate a 512x512 transparent PNG warning VFX sprite for an incoming fire zone in a vertical sci-fi arcade shooter. Design: thin orange warning ring with heat-haze ripples, small red ember dots around the circumference, transparent center, subtle pulsing glow. It should clearly preview where fire will appear. No text, no numbers, no logo, no UI panel, no solid background.
```

### 火焰爆发

目标路径：`assets/images/effects/effect-flame-burst.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a short flame burst in a vertical sci-fi arcade shooter. Design: radial orange-white plasma flare, red outer tongues of flame, small ember sparks, clean arcade readability, transparent outer edge. Keep it compact and not smoky, suitable for a brief hit or zone spawn animation. No text, no logo, no UI, no background box.
```

### 灼烧状态边缘

目标路径：`assets/images/effects/effect-burn-status-overlay.png`

```text
Generate a 512x512 transparent PNG status overlay sprite for a burning target in a vertical sci-fi arcade shooter. Design: incomplete circular ring of small orange embers and red heat cracks around the perimeter, transparent center for showing a ship underneath, soft animated-looking flicker frozen in one frame. No text, no numbers, no logo, no UI panel, no solid fill.
```

### 火星粒子

目标路径：`assets/images/effects/effect-ember-particle.png`

```text
Generate a 256x256 transparent PNG particle cluster for fire embers in a vertical sci-fi arcade shooter. Design: a sparse group of tiny orange, red, and yellow glowing embers with short upward motion streaks, no smoke cloud, no background, no text, no logo. Keep the cluster centered but mostly transparent so it can be spawned repeatedly.
```

### 火焰技能 UI 图标

目标路径：`assets/images/ui/icons/icon-skill-fire.png`

```text
Generate a 256x256 transparent PNG skill icon symbol for a fire ability in a sci-fi arcade shooter UI. Design: stylized orange-red plasma flame wrapped around a small bright energy core, clean silhouette, strong readable shape at 32px, subtle glow only, no circular button background, no text, no numbers, no logo, no UI frame.
```

## 冰冻与减速特效

### 持续冰区

目标路径：`assets/images/effects/effect-ice-zone.png`

```text
Generate a 512x512 transparent PNG area VFX sprite for a persistent ice slow zone in a vertical top-down sci-fi arcade shooter. Design: circular cyan-blue frost field, thin crystalline cracks, pale white frozen mist, small ice shards near the edge, transparent center gaps for gameplay readability, soft fading edge. It should communicate slow/freeze, not water. No text, no logo, no UI, no background fill.
```

### 冰区预警圈

目标路径：`assets/images/effects/effect-frost-warning-ring.png`

```text
Generate a 512x512 transparent PNG warning VFX sprite for an incoming frost slow zone in a vertical sci-fi arcade shooter. Design: thin cyan-blue circular warning ring, segmented frost crystals around the edge, soft cold glow, transparent center, very light snow-like sparkle. Clear but not distracting. No text, no numbers, no logo, no UI panel, no solid background.
```

### 冰冻爆发

目标路径：`assets/images/effects/effect-freeze-burst.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a freeze burst in a vertical sci-fi arcade shooter. Design: radial white-cyan flash, sharp ice shards expanding outward, light blue frost mist, transparent outer edges, crisp arcade readability. Keep it clean and semi-transparent, suitable for a slow effect trigger. No text, no logo, no UI, no background box.
```

### 冰冻状态边缘

目标路径：`assets/images/effects/effect-frozen-status-overlay.png`

```text
Generate a 512x512 transparent PNG status overlay sprite for a frozen or slowed target in a vertical sci-fi arcade shooter. Design: incomplete circular frame of pale cyan ice crystals and frost cracks around the perimeter, transparent center for showing a ship underneath, subtle cold glow, tiny snow particles. No text, no numbers, no logo, no UI panel, no solid fill.
```

### 冰晶弹片

目标路径：`assets/images/effects/effect-frost-shard-projectile.png`

```text
Generate a 256x256 transparent PNG projectile/VFX sprite for a frost shard in a vertical sci-fi arcade shooter. Design: small elongated cyan-white ice crystal shard, faceted geometry, bright white core, pale blue edge glow, subtle motion trail, readable at small size. Transparent background, centered, no text, no logo, no UI.
```

### 冰冻技能 UI 图标

目标路径：`assets/images/ui/icons/icon-skill-ice.png`

```text
Generate a 256x256 transparent PNG skill icon symbol for an ice/frost ability in a sci-fi arcade shooter UI. Design: stylized cyan snowflake crystal over a small glowing blue core, sharp clean silhouette, readable at 32px, subtle frost glow, no circular button background, no text, no numbers, no logo, no UI frame.
```

## 交互与命中反馈特效

### 普通命中火花

目标路径：`assets/images/effects/effect-hit-spark.png`

```text
Generate a 256x256 transparent PNG hit VFX sprite for a sci-fi arcade shooter. Design: compact white-yellow impact spark with a few cyan edge glints, short radial streaks, very clean and readable, no smoke, no heavy debris. It should work for bullet hits on aircraft armor. Centered, transparent background, no text, no logo, no UI.
```

### 暴击/弱点命中火花

目标路径：`assets/images/effects/effect-critical-hit-spark.png`

```text
Generate a 256x256 transparent PNG critical hit VFX sprite for a sci-fi arcade shooter. Design: brighter gold-white starburst impact, small red-orange armor crack flashes, sharp radial rays, more intense than a normal hit but still compact. Transparent background, centered, no text, no numbers, no logo, no UI.
```

### 护盾受击

目标路径：`assets/images/effects/effect-shield-hit.png`

```text
Generate a 512x512 transparent PNG shield impact VFX sprite for a vertical sci-fi arcade shooter. Design: curved blue-cyan energy shield arc, small hexagonal ripple fragments, bright impact point on one side, transparent center and outer edge, clean glow. It should look like a bullet hitting a protective shield. No text, no logo, no UI, no background fill.
```

### 护盾破碎

目标路径：`assets/images/effects/effect-shield-break.png`

```text
Generate a 512x512 transparent PNG shield break VFX sprite for a vertical sci-fi arcade shooter. Design: cyan-blue energy dome fragmenting into angular glass-like hex shards, bright white crack lines, fading outward pieces, transparent center gaps, readable and not too dense. No text, no numbers, no logo, no UI panel, no solid background.
```

### 维修脉冲

目标路径：`assets/images/effects/effect-repair-pulse.png`

```text
Generate a 512x512 transparent PNG healing/repair pulse VFX sprite for a vertical sci-fi arcade shooter. Design: green-teal circular wave ring, small medical cross-like plus shapes abstracted as light glints but no actual text, nano-particle swirl, soft clean glow, transparent center. It should communicate repair and knockback pulse. No text, no numbers, no logo, no UI.
```

### 连锁电弧

目标路径：`assets/images/effects/effect-chain-spark.png`

```text
Generate a 512x512 transparent PNG electric chain arc VFX sprite for a vertical sci-fi arcade shooter. Design: jagged blue-white lightning path crossing diagonally from one side to another, small branching sparks, cyan glow, mostly transparent around it, suitable for connecting two enemies. No text, no logo, no UI, no background fill.
```

### 补给吸附磁力线

目标路径：`assets/images/effects/effect-pickup-magnet-line.png`

```text
Generate a 512x512 transparent PNG VFX sprite for a pickup magnet pull line in a vertical sci-fi arcade shooter. Design: curved teal-green magnetic energy line with small arrow-like light particles flowing inward, subtle dotted trail, mostly transparent, readable but gentle. No text, no numbers, no logo, no UI panel, no solid background.
```

### 补给高亮光晕

目标路径：`assets/images/effects/effect-powerup-glow.png`

```text
Generate a 256x256 transparent PNG glow VFX sprite for collectible powerups in a vertical sci-fi arcade shooter. Design: soft white-cyan circular aura with tiny sparkle points, transparent center enough to place an item icon on top, clean arcade pickup glow, no text, no numbers, no logo, no UI panel, no solid fill.
```

### 弱点标定

目标路径：`assets/images/effects/effect-weakpoint-marker.png`

```text
Generate a 256x256 transparent PNG marker VFX sprite for a boss weak point in a vertical sci-fi arcade shooter. Design: gold diamond reticle with a bright center dot, four small corner brackets, thin pulsing ring, precise targeting feel, readable over boss armor. No text, no numbers, no logo, no UI panel, transparent background.
```

### 镭射航道预警条

目标路径：`assets/images/effects/effect-warning-laser-lane.png`

```text
Generate a 512x1024 transparent PNG vertical warning lane VFX sprite for a sci-fi arcade shooter laser attack. Design: long red-magenta translucent vertical strip, bright thin center guide line, soft edge glow, small triangular warning glints along the lane, transparent outside the strip. It should be easy to see but not hide ships under it. No text, no numbers, no logo, no UI panel, no solid background.
```

### 牵引光束线

目标路径：`assets/images/effects/effect-tether-pull-line.png`

```text
Generate a 512x512 transparent PNG VFX sprite for an electromagnetic tether pull beam in a vertical sci-fi arcade shooter. Design: teal-green curved energy beam segment with two faint coil arcs and inward-flowing particles, soft cyan glow, mostly transparent, suitable for drawing between a tether enemy and the player. No text, no logo, no UI, no background fill.
```

### 扰频云团

目标路径：`assets/images/effects/effect-jammer-cloud.png`

```text
Generate a 512x512 transparent PNG VFX sprite for an electronic jammer cloud in a vertical sci-fi arcade shooter. Design: cyan-teal translucent interference haze, thin glitch scan lines, small square digital noise fragments, circular radio-wave arcs, sparse and readable, no solid fog. Transparent background, no text, no numbers, no logo, no UI panel.
```

### 收割机偷取轨迹

目标路径：`assets/images/effects/effect-steal-trail.png`

```text
Generate a 512x512 transparent PNG VFX sprite for an item stealing trail in a vertical sci-fi arcade shooter. Design: gold-black curved motion streak, tiny yellow pickup particles being pulled along the curve, subtle magnetic claw impression, mostly transparent. It should imply a harvester enemy dragging a collectible away. No text, no numbers, no logo, no UI.
```

## 机型技能与基础 HUD 图标

### 平衡型技能：破阵冲击波

目标路径：`assets/images/ui/icons/icon-special-wave.png`

```text
Generate a 256x256 transparent PNG special skill icon for a sci-fi arcade shooter UI. Design: blue-cyan forward shockwave symbol, three expanding arc waves rising from a small aircraft-like energy core, clean silhouette, readable at 32px, subtle glow, no circular button background, no text, no numbers, no logo, no UI frame.
```

### 攻击型技能：全屏轰杀

目标路径：`assets/images/ui/icons/icon-special-nuke.png`

```text
Generate a 256x256 transparent PNG special skill icon for a sci-fi arcade shooter UI. Design: red-orange explosive starburst around a compact missile core, eight sharp rays, hot white center, aggressive but clean, readable at 32px, subtle glow only. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 防御型技能：护盾展开

目标路径：`assets/images/ui/icons/icon-special-shield.png`

```text
Generate a 256x256 transparent PNG special skill icon for a sci-fi arcade shooter UI. Design: green-teal energy shield crest with a small white check-shaped light seam, layered protective glow, clean strong silhouette, readable at 32px. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 侦查型技能：光学迷彩

目标路径：`assets/images/ui/icons/icon-special-stealth.png`

```text
Generate a 256x256 transparent PNG special skill icon for a sci-fi arcade shooter UI. Design: gold-yellow stealth eye silhouette crossed by a diagonal shimmer line, faint cloaking distortion, clean readable shape at 32px, subtle glow. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 蓄力攻击

目标路径：`assets/images/ui/icons/icon-charge-shot.png`

```text
Generate a 256x256 transparent PNG UI icon for a charged shot in a sci-fi arcade shooter. Design: golden energy spear or upward bolt charging above a small circular reactor, two horizontal charge bands, bright but clean, readable at 32px, subtle glow. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 炸弹

目标路径：`assets/images/ui/icons/icon-bomb.png`

```text
Generate a 256x256 transparent PNG UI icon for a screen-clearing bomb in a sci-fi arcade shooter. Design: compact dark bomb core with red-orange fuse glow and small radial blast halo, clear silhouette, readable at 32px, polished arcade style. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 火力升级

目标路径：`assets/images/ui/icons/icon-power-upgrade.png`

```text
Generate a 256x256 transparent PNG UI icon for weapon power upgrade in a sci-fi arcade shooter. Design: two stacked green-cyan upward chevrons made of energy plates, bright center glow, clean silhouette, readable at 32px. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 生命修复

目标路径：`assets/images/ui/icons/icon-heal.png`

```text
Generate a 256x256 transparent PNG UI icon for healing or repair in a sci-fi arcade shooter. Design: green nano-repair cross made from glowing circuit plates around a small core, friendly medical feel without real-world branding, readable at 32px. No circular button background, no text, no numbers, no logo, no UI frame.
```

## 副武器 UI 图标

### 追踪弹

目标路径：`assets/images/ui/icons/icon-secondary-homing.png`

```text
Generate a 256x256 transparent PNG secondary weapon icon for homing missiles in a sci-fi arcade shooter UI. Design: small cyan projectile following a curved dotted target path, tiny lock-on dot at the end, clean shape, readable at 32px, subtle blue glow. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 激光

目标路径：`assets/images/ui/icons/icon-secondary-laser.png`

```text
Generate a 256x256 transparent PNG secondary weapon icon for a laser in a sci-fi arcade shooter UI. Design: vertical violet laser beam with a small emitter prism at the bottom and bright white core, clean strong silhouette, readable at 32px, subtle purple glow. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 导弹

目标路径：`assets/images/ui/icons/icon-secondary-missile.png`

```text
Generate a 256x256 transparent PNG secondary weapon icon for missiles in a sci-fi arcade shooter UI. Design: orange-white rocket missile silhouette pointing upward, small rear fins and flame trail, clean aggressive shape, readable at 32px, subtle glow. No circular button background, no text, no numbers, no logo, no UI frame.
```

## 补给拾取 UI 图标

### 火力补给

目标路径：`assets/images/ui/powerups/icon-powerup-power.png`

```text
Generate a 256x256 transparent PNG collectible icon for a weapon power pickup in a vertical sci-fi arcade shooter. Design: bright green-cyan energy core with two upward chevrons, small sparkle aura, readable as a power upgrade at small size. No circular button background, no text, no numbers, no logo, no UI frame.
```

### 治疗补给

目标路径：`assets/images/ui/powerups/icon-powerup-heal.png`

```text
Generate a 256x256 transparent PNG collectible icon for a healing pickup in a vertical sci-fi arcade shooter. Design: green nano-med core with luminous repair cross made from sci-fi circuit segments, soft friendly glow, readable at small size. No text, no numbers, no logo, no UI panel, transparent background.
```

### 炸弹补给

目标路径：`assets/images/ui/powerups/icon-powerup-bomb.png`

```text
Generate a 256x256 transparent PNG collectible icon for a bomb pickup in a vertical sci-fi arcade shooter. Design: compact red-orange explosive device symbol with small blast halo, polished sci-fi material, readable at small size. No text, no numbers, no logo, no UI panel, transparent background.
```

### 僚机补给

目标路径：`assets/images/ui/powerups/icon-powerup-wing.png`

```text
Generate a 256x256 transparent PNG collectible icon for a wingman upgrade in a vertical sci-fi arcade shooter. Design: two tiny friendly upward-facing escort drone silhouettes orbiting a bright white-blue core, soft cyan glow, readable as allied support. No text, no numbers, no logo, no UI panel, transparent background.
```

### 芯片补给

目标路径：`assets/images/ui/powerups/icon-powerup-chip.png`

```text
Generate a 256x256 transparent PNG collectible icon for a skill chip pickup in a vertical sci-fi arcade shooter. Design: small hexagonal cyber chip with cyan circuit traces and violet-gold energy core, premium upgrade feel, readable at small size. No text, no numbers, no logo, no UI panel, transparent background.
```

## 芯片技能 UI 图标

### 聚焦激光

目标路径：`assets/images/ui/chips/icon-chip-laser-focus.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "focused laser" in a sci-fi arcade shooter UI. Design: narrow violet laser beam passing through a small prism lens, bright white core, precise focused look, readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

### 蜂群追踪

目标路径：`assets/images/ui/chips/icon-chip-homing-swarm.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "homing swarm" in a sci-fi arcade shooter UI. Design: three small cyan seeker missiles curving around a central target dot, clean lock-on arcs, readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

### 导弹齐射

目标路径：`assets/images/ui/chips/icon-chip-missile-barrage.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "missile barrage" in a sci-fi arcade shooter UI. Design: cluster of orange missiles launching upward in a fan, tiny flame trails, compact explosive energy, readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

### 蓄能核心

目标路径：`assets/images/ui/chips/icon-chip-charge-core.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "charge core" in a sci-fi arcade shooter UI. Design: golden reactor core charging an upward energy lance, two bright capacitor rings, clean silhouette, readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

### 电容护盾

目标路径：`assets/images/ui/chips/icon-chip-capacitor.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "capacitor shield" in a sci-fi arcade shooter UI. Design: cyan-blue energy capacitor cell protected by a small translucent shield arc, electric glow, clean defensive silhouette, readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

### 侧翼炮组

目标路径：`assets/images/ui/chips/icon-chip-side-guns.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "side guns" in a sci-fi arcade shooter UI. Design: central upward aircraft silhouette with two small side cannons firing diagonal golden beams, compact and readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

### 危险过载

目标路径：`assets/images/ui/chips/icon-chip-volatile-core.png`

```text
Generate a 256x256 transparent PNG chip skill icon for "volatile overdrive core" in a sci-fi arcade shooter UI. Design: red hot unstable reactor core cracking with magenta-orange lightning, small hazard glow, high-risk power feel, readable at 32px, no text, no numbers, no logo, no UI frame, no circular button background.
```

## 强化卡牌 UI 图标

以下强化图标全部输出 256 x 256 透明 PNG，路径按条目保存。统一风格：中心符号清晰，适合卡牌左侧小图标，不带文字、不带数字、不带圆形按钮底。

### 主炮与输出路线

- 目标路径：`assets/images/ui/bonuses/icon-bonus-damage.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for general weapon damage in a sci-fi arcade shooter. Design: red-orange cross-shaped muzzle flash over a compact energy bullet core, clean aggressive silhouette, readable at 32px, subtle glow, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-fire-rate.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for faster fire rate in a sci-fi arcade shooter. Design: blue-white rapid bullet streaks in three parallel lines with small speed sparks, clean motion feeling, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-pierce.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for piercing bullets in a sci-fi arcade shooter. Design: golden armor-piercing round passing through two thin metal plates, sharp clean silhouette, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-kinetic-ammo.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for kinetic ammo in a sci-fi arcade shooter. Design: orange dense bullet core with concentric impact rings and small metal fragments, heavy physical force, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-heavy-rounds.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for heavy rounds in a sci-fi arcade shooter. Design: chunky gold tungsten bullet with bright impact trail and weighty glow, clean readable silhouette at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-armor-piercer.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for armor piercing against heavy targets in a sci-fi arcade shooter. Design: orange drill-like projectile cracking a dark armor plate, bright white crack lines, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-armor-caliber.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for armor-scaled caliber in a sci-fi arcade shooter. Design: teal armor plate feeding energy into a large golden bullet, fusion of defense and firepower, clean silhouette, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-stable-fire.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for stable fire control in a sci-fi arcade shooter. Design: green targeting stabilizer around a calm straight bullet beam, balanced crosshair lines, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-perfect-line.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for perfect flight line in a sci-fi arcade shooter. Design: clean green flight path line through a narrow gap, small glowing aircraft arrow, elegant no-hit precision feel, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-side-cannons.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for side cannons in a sci-fi arcade shooter. Design: central ship core with paired side turret pods firing diagonal golden shots, readable at 32px, no text, no numbers, no logo, no UI frame.
```

### 生存、护盾与修复路线

- 目标路径：`assets/images/ui/bonuses/icon-bonus-max-hp.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for maximum HP in a sci-fi arcade shooter. Design: teal reinforced hull plate around a bright green life core, sturdy defensive silhouette, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-reinforced-hull.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for reinforced hull in a sci-fi arcade shooter. Design: layered green-teal armor plates locking together around a ship nose, durable sci-fi plating, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-armor-plating.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for armor plating in a sci-fi arcade shooter. Design: blue titanium shield plate with rivet-like light nodes and small deflected spark, clean heavy armor silhouette, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-field-repair.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for field repair in a sci-fi arcade shooter. Design: green nano-particles repairing a cracked aircraft plate, small circuit healing lines, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-repair-loop.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for repair loop in a sci-fi arcade shooter. Design: green circular repair arrows made of energy around a small hull plate, continuous sustain feel, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-repair-pulse.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for repair pulse in a sci-fi arcade shooter. Design: green-teal healing core emitting a circular shockwave ring, nano particles, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-leech.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for energy leech in a sci-fi arcade shooter. Design: magenta energy siphon line pulling light from a broken enemy shard into a small core, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-living-armor.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for living armor in a sci-fi arcade shooter. Design: dark green biomechanical armor plate with glowing veins and a small growing core, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-medical-reservoir.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for medical reservoir in a sci-fi arcade shooter. Design: green transparent energy tank with nano-repair fluid and small circuit cap, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-pain-converter.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for pain-to-energy conversion in a sci-fi arcade shooter. Design: pink damage spark transforming into golden energy lightning through a small converter core, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-salvage.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for salvage shield in a sci-fi arcade shooter. Design: teal magnetic claw collecting small metal fragments into a protective shield core, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-shield-amplifier.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for shield amplifier in a sci-fi arcade shooter. Design: cyan shield arc boosted by a small glowing amplifier crystal, layered energy rings, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-shield-breaker.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for shield breaker in a sci-fi arcade shooter. Design: blue electric spike cracking a translucent shield dome, bright white fracture lines, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-reactive-armor.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for reactive armor in a sci-fi arcade shooter. Design: blue armor plate releasing a compact counter-shockwave after impact, small sparks and shield ripple, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-last-stand.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for last stand survival in a sci-fi arcade shooter. Design: purple black-box core protected by a final emergency shield flare, dramatic but clean, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-emergency-barrier.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for emergency barrier in a sci-fi arcade shooter. Design: cyan automatic barrier shell snapping around a small damaged ship core, urgent protective glow, readable at 32px, no text, no numbers, no logo, no UI frame.
```

### 激光、追踪与导弹路线

- 目标路径：`assets/images/ui/bonuses/icon-bonus-laser-lens.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for laser lens in a sci-fi arcade shooter. Design: violet prism lens focusing a thin white laser beam, polished crystal facets, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-laser-splitter.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for laser splitter in a sci-fi arcade shooter. Design: central purple prism splitting one beam into three smaller beams, clean refraction motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-range.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for lock-on range in a sci-fi arcade shooter. Design: green radar rings expanding around a small target dot and aircraft arrow, clean scan motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-swarm-core.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for homing swarm core in a sci-fi arcade shooter. Design: blue central swarm controller core with several tiny seeker missiles orbiting it, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-homing-shards.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for homing shards in a sci-fi arcade shooter. Design: cyan seeker projectile splitting into small tracking crystal shards, curved lock-on trails, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-signal-filter.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for signal filter in a sci-fi arcade shooter. Design: teal radio-wave interference being cleaned by a small hexagonal filter chip, before/after wave contrast, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-missile-rack.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for extra missile rack in a sci-fi arcade shooter. Design: orange missile pod rack with two compact rockets, clean mechanical silhouette, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-explosive-payload.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for explosive payload in a sci-fi arcade shooter. Design: orange missile warhead with expanding blast ring and small sparks, high explosive feel, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-cluster-warheads.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for cluster warheads in a sci-fi arcade shooter. Design: main orange missile bursting into several small seeker submunitions, compact fan composition, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-missile-interceptor.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for missile interception in a sci-fi arcade shooter. Design: orange missile explosion clearing small red enemy bullets in a circular radius, readable at 32px, no text, no numbers, no logo, no UI frame.
```

### 连击、过载与风险路线

- 目标路径：`assets/images/ui/bonuses/icon-bonus-chain-spark.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for chain spark in a sci-fi arcade shooter. Design: blue-white lightning arc jumping between two small enemy markers, crisp electric branch, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-magnet-core.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for magnet core in a sci-fi arcade shooter. Design: teal magnetic core pulling small pickup particles along curved field lines, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-combo-battery.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for combo battery in a sci-fi arcade shooter. Design: golden battery cell charged by small hit sparks and a shield glint, combo energy feel, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-combo-barrage.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for combo barrage in a sci-fi arcade shooter. Design: blue combo energy core launching several small homing shots outward, clean arc trails, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-combo-surge.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for combo surge in a sci-fi arcade shooter. Design: golden overcharge lightning rising from a combo energy core, sharp but clean, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-charge-amp.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for charge amplifier in a sci-fi arcade shooter. Design: pink-gold amplifier rings boosting an upward charge beam, precise energy device, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-executioner.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for execution damage in a sci-fi arcade shooter. Design: magenta targeting blade marking a cracked weak enemy core, sharp finishing-strike motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-elite-hunter.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for elite hunter in a sci-fi arcade shooter. Design: red ace target reticle locked onto a small crowned enemy silhouette, clean hunter motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-glass-cannon.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for glass cannon in a sci-fi arcade shooter. Design: red high-power cannon beam emerging from a fragile cracked glass core, risk and damage contrast, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-boss-hunter.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for boss hunter in a sci-fi arcade shooter. Design: violet heavy target reticle around a large boss-core diamond, precise anti-boss feel, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-weak-scanner.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for weak point scanner in a sci-fi arcade shooter. Design: gold scanner beam revealing a small glowing crack in a boss armor plate, diamond reticle, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-adrenaline.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for adrenaline boost in a sci-fi arcade shooter. Design: red heartbeat-like energy pulse flowing into a weapon core, urgent high-speed glow, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-overdrive.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for overdrive barrage in a sci-fi arcade shooter. Design: golden overloaded reactor firing many tiny bullet streaks upward, bright risk-reward energy, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/bonuses/icon-bonus-vital-reactor.png`

```text
Generate a 256x256 transparent PNG upgrade card icon for vital reactor in a sci-fi arcade shooter. Design: teal life-core reactor feeding green energy into red weapon sparks, life-to-damage synergy, readable at 32px, no text, no numbers, no logo, no UI frame.
```

## 无尽事件 UI 图标

以下事件图标全部输出 256 x 256 透明 PNG，用于无尽模式事件提示。统一要求：不带文字、不带数字、不带圆形按钮底，图标需要在 24-32px 下识别。

- 目标路径：`assets/images/ui/events/icon-event-supply-storm.png`

```text
Generate a 256x256 transparent PNG event icon for a supply storm in a sci-fi arcade shooter. Design: green supply crate core with multiple small pickup lights swirling around it, storm motion arcs, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-elite-airspace.png`

```text
Generate a 256x256 transparent PNG event icon for elite airspace in a sci-fi arcade shooter. Design: red elite enemy chevron with a bright crown-like energy notch and small danger aura, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-overload-field.png`

```text
Generate a 256x256 transparent PNG event icon for an overload field in a sci-fi arcade shooter. Design: golden unstable reactor core with jagged lightning ring and warning heat glow, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-ambush.png`

```text
Generate a 256x256 transparent PNG event icon for an ambush lane in a sci-fi arcade shooter. Design: blue enemy silhouettes emerging from two side arrows toward a center flight lane, clean tactical motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-armored-airspace.png`

```text
Generate a 256x256 transparent PNG event icon for armored airspace in a sci-fi arcade shooter. Design: blue armor plates covering a small enemy aircraft silhouette, heavy defensive glow, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-no-hit-run.png`

```text
Generate a 256x256 transparent PNG event icon for a no-hit run in a sci-fi arcade shooter. Design: green clean flight path threading between two red danger sparks without contact, elegant precision motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-annihilation-order.png`

```text
Generate a 256x256 transparent PNG event icon for an annihilation order in a sci-fi arcade shooter. Design: gold targeting reticle over multiple small enemy markers with a decisive blast core, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-ace-hunt.png`

```text
Generate a 256x256 transparent PNG event icon for ace hunt in a sci-fi arcade shooter. Design: red ace fighter silhouette inside a sharp hunter reticle, small star-like elite glint, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-repair-convoy.png`

```text
Generate a 256x256 transparent PNG event icon for a repair convoy in a sci-fi arcade shooter. Design: green support drone group with repair beam arcs between them, nano-particle glow, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-ion-storm.png`

```text
Generate a 256x256 transparent PNG event icon for an ion storm in a sci-fi arcade shooter. Design: violet vertical laser lane struck by cyan ion lightning and storm particles, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-crossfire.png`

```text
Generate a 256x256 transparent PNG event icon for crossfire in a sci-fi arcade shooter. Design: orange bullet streams crossing from left and right over a central danger point, clean motion trails, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-jammer-cloud.png`

```text
Generate a 256x256 transparent PNG event icon for jammer cloud in a sci-fi arcade shooter. Design: teal interference cloud with radio-wave arcs and small glitch squares, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-sniper-lockdown.png`

```text
Generate a 256x256 transparent PNG event icon for sniper lockdown in a sci-fi arcade shooter. Design: magenta long-range targeting line ending at a small aircraft silhouette, sharp sniper reticle, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-minefield.png`

```text
Generate a 256x256 transparent PNG event icon for minefield in a sci-fi arcade shooter. Design: amber circular mine with several radial bullet dots and danger ring, explosive hazard feel, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-shield-wall.png`

```text
Generate a 256x256 transparent PNG event icon for shield wall in a sci-fi arcade shooter. Design: blue vertical shield panels protecting small enemy silhouettes behind them, clean defensive wall motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-phantom-wing.png`

```text
Generate a 256x256 transparent PNG event icon for phantom wing in a sci-fi arcade shooter. Design: cyan ghost aircraft silhouette with two translucent afterimages, speed shimmer, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-carrier-raid.png`

```text
Generate a 256x256 transparent PNG event icon for carrier raid in a sci-fi arcade shooter. Design: purple carrier silhouette releasing two small escort craft, summoner motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-shielded-ambush.png`

```text
Generate a 256x256 transparent PNG event icon for shielded ambush in a sci-fi arcade shooter. Design: blue-gray guard drone shield node with enemy arrows approaching from sides, protected ambush motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-sniper-crossfire.png`

```text
Generate a 256x256 transparent PNG event icon for sniper crossfire in a sci-fi arcade shooter. Design: magenta sniper beam crossing orange side bullet streams, clean layered danger motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-blackout-raid.png`

```text
Generate a 256x256 transparent PNG event icon for blackout raid in a sci-fi arcade shooter. Design: dark teal jammer field covering a yellow beacon signal and red enemy silhouettes, electronic warfare mood, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-rear-assault.png`

```text
Generate a 256x256 transparent PNG event icon for rear assault in a sci-fi arcade shooter. Design: red enemy arrow rising from below toward a player flight lane, urgent chase motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-mine-layer-run.png`

```text
Generate a 256x256 transparent PNG event icon for a floating mine lane in a sci-fi arcade shooter. Design: orange mine-layer bomber silhouette dropping two glowing mines into a central lane, area denial motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-hornet-pursuit.png`

```text
Generate a 256x256 transparent PNG event icon for hornet pursuit in a sci-fi arcade shooter. Design: yellow beacon signal guiding several small cyan homing missiles along curved trails, pursuit motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-scorched-lane.png`

```text
Generate a 256x256 transparent PNG event icon for scorched lane in a sci-fi arcade shooter. Design: orange-red burning flight lane with a small mine icon and heat haze, persistent fire hazard motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-tether-net.png`

```text
Generate a 256x256 transparent PNG event icon for tether net in a sci-fi arcade shooter. Design: teal electromagnetic net lines pulling a small aircraft marker toward a coil node, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-frost-net.png`

```text
Generate a 256x256 transparent PNG event icon for frost net in a sci-fi arcade shooter. Design: cyan tether net over an icy circular slow field, small frost crystals on the lines, readable at 32px, no text, no numbers, no logo, no UI frame.
```

- 目标路径：`assets/images/ui/events/icon-event-harvest-rush.png`

```text
Generate a 256x256 transparent PNG event icon for harvest rush in a sci-fi arcade shooter. Design: gold-black harvester claw grabbing a glowing pickup core with speed streaks, risk-reward looting motif, readable at 32px, no text, no numbers, no logo, no UI frame.
```

## 开始菜单专用 UI 图片

这些资源用于首页标题界面。文字仍然可以由游戏 Canvas 绘制，所以按钮底纹、光效、图标尽量不要包含文字。`title-wordmark.png` 和 `title-subtitle.png` 是可选项；如果 image 2 生成文字不稳定，可以先不生成这两个，游戏会继续使用 Canvas 文字。

### 首页暗角光效

目标路径：`assets/images/ui/title/title-vignette.png`

```text
Generate a 1080x1920 transparent PNG overlay for the title screen of a vertical sci-fi arcade shooter. Design: subtle dark blue cinematic vignette around the edges, faint cyan and violet vertical light streaks, tiny star particles, transparent center, no solid background, no text, no logo, no UI buttons. It should sit over a sci-fi scrolling background and improve readability of the title and menu.
```

### 标题发光底纹

目标路径：`assets/images/ui/title/title-logo-glow.png`

```text
Generate a 768x320 transparent PNG glow plate for a title logo in a vertical sci-fi arcade shooter. Design: broad soft cyan-blue and violet energy glow behind a central title, subtle angular aircraft HUD lines, light refraction, no text, no letters, no logo, no button frame, transparent background. Keep it elegant and not too bright.
```

### 标题文字图（可选）

目标路径：`assets/images/ui/title/title-wordmark.png`

```text
Generate a 1024x256 transparent PNG title wordmark for a Chinese sci-fi arcade shooter. Exact visible text: 空中突袭. Bold clean futuristic Chinese display lettering, white with subtle cyan edge glow, centered, no extra words, no English, no logo mark, no background. If the characters cannot be rendered exactly and legibly, do not stylize them heavily; prioritize perfect readability.
```

### 副标题文字图（可选）

目标路径：`assets/images/ui/title/title-subtitle.png`

```text
Generate a 1024x160 transparent PNG subtitle wordmark for a sci-fi arcade shooter title screen. Exact visible text: 2 0 7 7 · 原创空战. Thin futuristic cyan-blue lettering, centered, clean and readable, no extra words, no logo, no background. If text rendering is unstable, keep the composition very simple and prioritize exact characters.
```

### 首页悬浮小战机

目标路径：`assets/images/ui/title/title-hero-ship.png`

```text
Generate a 256x256 transparent PNG small hero ship emblem for the title screen of a vertical top-down sci-fi arcade shooter. Design: friendly blue-cyan player aircraft icon, nose pointing upward, centered, symmetrical, compact triangular silhouette, bright cockpit core, soft glow, readable at 40px. No text, no logo, no UI frame, no black or white background.
```

### 关卡地图按钮底纹

目标路径：`assets/images/ui/title/title-button-map.png`

```text
Generate a 600x116 transparent PNG large title menu button skin with no text. Theme: stage map / campaign. Rounded rectangle glass panel, cyan-green neon border, subtle tactical map grid and tiny route dots inside, semi-transparent dark teal fill, polished sci-fi UI style. No words, no numbers, no logo, no icons that look like letters, transparent outside the button.
```

### 无尽挑战按钮底纹

目标路径：`assets/images/ui/title/title-button-challenge.png`

```text
Generate a 600x116 transparent PNG large title menu button skin with no text. Theme: endless challenge. Rounded rectangle glass panel, orange neon border, subtle heat and speed streaks, faint warning-triangle geometry, semi-transparent dark amber fill, polished sci-fi UI style. No words, no numbers, no logo, transparent outside the button.
```

### 挑战码按钮底纹

目标路径：`assets/images/ui/title/title-button-rival.png`

```text
Generate a 600x116 transparent PNG large title menu button skin with no text. Theme: rival challenge code. Rounded rectangle glass panel, gold-yellow neon border, faint encrypted circuit pattern, small abstract duel reticle motifs, semi-transparent dark gold fill, polished sci-fi UI style. No words, no numbers, no logo, transparent outside the button.
```

### 机型选择按钮底纹

目标路径：`assets/images/ui/title/title-button-ship.png`

```text
Generate a 600x116 transparent PNG large title menu button skin with no text. Theme: ship selection. Rounded rectangle glass panel, blue neon border, faint aircraft blueprint lines, tiny wing silhouettes as abstract shapes, semi-transparent dark blue fill, polished sci-fi UI style. No words, no numbers, no logo, transparent outside the button.
```

### 设置小图标

目标路径：`assets/images/ui/title/title-icon-settings.png`

```text
Generate a 256x256 transparent PNG title menu icon for settings in a sci-fi arcade shooter UI. Design: compact white-cyan futuristic gear with small inner energy core, readable at 20px, no circular button background, no text, no numbers, no logo, transparent background.
```

### 图鉴小图标

目标路径：`assets/images/ui/title/title-icon-codex.png`

```text
Generate a 256x256 transparent PNG title menu icon for codex/gallery in a sci-fi arcade shooter UI. Design: small glowing white-cyan holographic book or archive panel with two pages and a tiny aircraft silhouette, readable at 20px, no circular button background, no text, no numbers, no logo.
```

### 帮助小图标

目标路径：`assets/images/ui/title/title-icon-help.png`

```text
Generate a 256x256 transparent PNG title menu icon for help/tutorial in a sci-fi arcade shooter UI. Design: clean white-cyan question beacon symbol inside a tiny HUD bracket, readable at 20px, no circular button background, no text except the question-mark shape itself, no numbers, no logo, transparent background.
```

### 排行榜悬浮按钮图标（预留）

目标路径：`assets/images/ui/title/title-icon-leaderboard.png`

```text
Generate a 256x256 transparent PNG title menu icon for leaderboard/statistics in a sci-fi arcade shooter UI. Design: blue circular holographic badge with three ascending white bars and subtle cyan rim glow, readable at 48px, no text, no numbers, no logo, transparent outside the badge.
```

### 底部提示光效

目标路径：`assets/images/ui/title/title-footer-glow.png`

```text
Generate a 1080x256 transparent PNG footer overlay for a vertical sci-fi arcade shooter title screen. Design: very subtle cyan-blue horizontal glow near the bottom, thin HUD scan lines, tiny particles, transparent upper area, no text, no logo, no UI buttons. It should sit behind keyboard/help hint text without reducing readability.
```

## 生成后检查

- 所有特效和 UI 图标都必须是 PNG 透明背景；没有黑底、白底、纯色底、文字、数字、水印。
- UI 图标缩小到 32 x 32 仍能看出含义；不依赖细小文字或复杂纹理。
- 火区和冰区保留透明中心或半透明空隙，不能遮住弹幕。
- 地雷、预警圈、镭射条、牵引线和弱点标记在深色/亮色背景上都应可读。
- 如果 image 2 自动生成了按钮底或卡片底，请重新生成为“中心符号 + 透明背景”版本，方便后续代码统一绘制 UI 容器。
- 开始菜单按钮底纹不要包含文字；文字由游戏绘制，避免生成文字不清晰。
