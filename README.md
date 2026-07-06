# Skyward Raid 2077 / 空中突袭

一款零构建、零框架、直接打开就能玩的竖屏 Canvas 空战游戏。驾驶不同机型穿过 8 个战区，击败多阶段 Boss，在无尽空域里用强化、连击和补给路线冲击更高分。

[在线试玩](https://ac-spider.github.io/skyward-raid-2077/) · [本地运行](#本地运行) · [开发说明](#开发说明)

## 战机与 Boss 预览

### 可选战机

<table>
  <tr>
    <td align="center">
      <img src="assets/images/ships/player-balanced.png" width="118" alt="平衡型战机"><br>
      <strong>平衡型</strong><br>
      <sub>全面均衡 · 新手推荐</sub>
    </td>
    <td align="center">
      <img src="assets/images/ships/player-attacker.png" width="118" alt="攻击型战机"><br>
      <strong>攻击型</strong><br>
      <sub>高爆发 · 连击压制</sub>
    </td>
    <td align="center">
      <img src="assets/images/ships/player-defender.png" width="118" alt="防御型战机"><br>
      <strong>防御型</strong><br>
      <sub>高血量 · 护盾抗压</sub>
    </td>
    <td align="center">
      <img src="assets/images/ships/player-scout.png" width="118" alt="侦查型战机"><br>
      <strong>侦查型</strong><br>
      <sub>高机动 · 隐身穿梭</sub>
    </td>
  </tr>
</table>

### Boss 来袭

<table>
  <tr>
    <td align="center">
      <img src="assets/images/bosses/boss-08-prism-judge.png" width="150" alt="棱镜审判者 Boss"><br>
      <strong>棱镜审判者</strong><br>
      <sub>光束 · 折射 · 安全航道切换</sub>
    </td>
    <td align="center">
      <img src="assets/images/bosses/boss-09-iron-carrier.png" width="150" alt="铁幕空母 Boss"><br>
      <strong>铁幕空母</strong><br>
      <sub>护卫编队 · 甲板弱点</sub>
    </td>
    <td align="center">
      <img src="assets/images/bosses/boss-10-tide-core.png" width="150" alt="引潮核心 Boss"><br>
      <strong>引潮核心</strong><br>
      <sub>牵引潮汐 · 区域压迫</sub>
    </td>
    <td align="center">
      <img src="assets/images/bosses/boss-11-unstable-prototype.png" width="150" alt="失控原型机 Boss"><br>
      <strong>失控原型机</strong><br>
      <sub>随机拼装 · 无尽威胁</sub>
    </td>
  </tr>
</table>

## 亮点

- **即开即玩**: 原生 HTML5 Canvas + JavaScript，无构建链，无安装步骤，`index.html` 和 `空中突袭.html` 都可作为入口。
- **完整主线**: 8 个世界、24 个正式关卡、递进式敌机组合、压轴 Boss 战和关卡地图解锁。
- **多样机型**: 平衡型、攻击型、防御型、侦查型各有属性偏向、被动加成和专属机型技能。
- **有构筑感的无尽模式**: 芯片强化、稀有词条、动态事件、威胁等级、Boss 词缀和挑战种子让每局路线不同。
- **清晰弹幕设计**: 镭射、狙击、牵引、浮雷、反射、护盾、航母护卫等机制都有可读预警和反制窗口。
- **轻量持久化**: 设置、关卡进度、排行榜、无尽记录、挑战记录和成就保存在浏览器 `localStorage`。
- **资源可兜底**: 图片或音频缺失时仍会回退到 Canvas 绘制和 WebAudio 合成，保证游戏可玩。
- **实验性联机入口**: 使用浏览器原生 WebRTC DataChannel 同步远端影子，适合轻量合作/竞速实验。

## 玩法概览

玩家自动开火，核心目标是在密集弹幕中保持输出、维持连击、合理使用炸弹和机型技能。普通关卡强调固定波次、Boss 机制和通关评分；无尽模式则强调构筑选择、风险收益和长线生存。

| 内容 | 说明 |
| --- | --- |
| 主线关卡 | 8 个战区，每个战区 3 个关卡，终章以 Boss 或高强度编队收束 |
| 难度 | 简单、普通、困难会影响伤害、Boss 血量、补给密度和最终倍率 |
| 机型 | 平衡型适合上手，攻击型追求爆发，防御型抗压，侦查型更灵活 |
| Boss 图鉴 | 首页可查看 Boss 出场关卡、阶段机制和攻击类型 |
| 成就 | 通关、Boss 击破、机型使用、轻装上阵等目标会被记录 |
| 存档 | 设置页支持导出/导入存档，方便跨设备迁移 |

## 操作

| 操作 | 键鼠 | 触屏 |
| --- | --- | --- |
| 移动 | 鼠标拖动 | 拖动移动，或在设置中切换虚拟摇杆 |
| 炸弹 | `B` / `Space` | 左下角炸弹按钮 |
| 机型技能 | `X` | 底部技能按钮，能量满后可用 |
| 蓄力攻击 | 按住 `C` | 右下角蓄力按钮 |
| 暂停 | `P` / `Esc` | 右下角暂停按钮 |
| 静音 | `M` | 设置页开关 |

## 本地运行

最简单的方式是直接双击 `index.html`。

如果希望和 GitHub Pages 环境更接近，可以启动一个本地静态服务器:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

然后打开:

```text
http://127.0.0.1:4173/
```

## 联机 MVP

当前联机是免费的点对点 WebRTC MVP，不依赖自建服务器。它优先验证“轻量同步”和“影子队友”体验，并不承诺完整实时 PVE/PVP。

1. 房主打开右上角联机入口，创建邀请码并发给朋友。
2. 朋友粘贴邀请码，生成应答文本后发回房主。
3. 房主粘贴应答并接受连接。

连接成功后，对局中会显示对方的远端影子。后续可以在这个基础上扩展合作闯关、挑战码竞速和间接对抗。

## 技术结构

项目保持轻量静态站点结构，`main` 分支根目录可直接发布到 GitHub Pages。

```text
.
├─ index.html              # GitHub Pages 默认入口
├─ 空中突袭.html           # 中文兼容入口，加载同一套脚本
├─ style.css               # 页面布局与 Canvas 容器样式
├─ assets/
│  ├─ audio/               # BGM 与音效素材
│  └─ images/              # 飞机、敌机、Boss、背景、特效素材
├─ src/
│  ├─ config.js            # 数值、关卡外配置、文案、机型、Boss、强化
│  ├─ assets.js            # 图片素材清单、加载和 Canvas 兜底绘制
│  ├─ services.js          # 音效、音乐、设置、存档、排行榜、成就
│  ├─ canvas.js            # Canvas 初始化和自适应
│  ├─ input.js             # 鼠标、触摸、键盘输入
│  ├─ core.js              # 通用工具、UI 绘制、背景
│  ├─ entities.js          # 玩家、敌人、Boss、投射物、道具、粒子、对象池
│  ├─ levels.js            # 关卡波次和导演器
│  ├─ interference.js      # Rival/干扰事件
│  ├─ multiplayer.js       # WebRTC 连接与远端影子同步
│  ├─ game.js              # 主状态机、碰撞、HUD、界面绘制
│  └─ main.js              # 初始化和主循环
└─ scripts/
   └─ check_balance.js     # 数值和配置一致性检查
```

## 开发说明

这个仓库的设计目标不是做复杂引擎，而是在一个可读、可改、可直接发布的 Canvas 原型里持续打磨手感。

- 新玩法优先放到最贴近职责的现有模块，避免过早拆文件。
- `index.html` 和 `空中突袭.html` 必须加载同一套脚本，新增或调整脚本时两边同步。
- 新资源必须可缺失兜底，图片和音频加载失败时游戏仍应可玩。
- 单机体验优先于多人；联机只负责连接和同步外壳，不把玩法规则塞进 `multiplayer.js`。
- 不引入 React、Vite、Three.js 或重型状态框架，除非有明确需求。

代码或配置改动后至少运行:

```powershell
node scripts/check_balance.js
```

需要浏览器验证时运行本地服务器，并检查主菜单、关卡地图、无尽模式、设置、机型选择和控制台错误。

## 素材与授权

项目包含原创/生成式辅助制作的飞机、敌机、Boss、背景和特效素材，以及本地音频素材。新增图片或音频时请同步补充来源说明或提示词文档，并确保素材允许在项目中分发。

## 发布

GitHub Pages 直接从 `main` 分支根目录发布。只要根目录保持 `index.html` 可运行，推送到 `main` 后即可更新在线试玩版本。
