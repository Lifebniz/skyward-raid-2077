# 空中突袭 2077

轻量 Canvas 空战小游戏。项目保留直接运行的结构，打开 `index.html` 或 `空中突袭.html` 即可游玩。

## 在线试玩

GitHub Pages:

https://ac-spider.github.io/skyward-raid-2077/

## 运行

- 直接双击 `index.html`
- 或本地预览:
  ```powershell
  python -m http.server 4173 --bind 127.0.0.1
  ```
  然后打开 `http://127.0.0.1:4173/`

## 结构

- `index.html`: GitHub Pages 默认入口
- `空中突袭.html`: 兼容旧入口，加载同一套脚本
- `assets/audio/`: BGM 和后续音效素材
- `assets/images/`: 可选图片素材，当前通过清单按需接入
- `style.css`: 页面布局样式
- `src/config.js`: 数值、关卡外配置、教程文本
- `src/assets.js`: 可选图片素材清单与加载/绘制兜底
- `src/services.js`: 音效、音乐、设置、存档、排行榜、成就
- `src/canvas.js`: Canvas 初始化和自适应
- `src/input.js`: 鼠标、触摸、键盘输入
- `src/core.js`: 通用工具、UI 绘制、背景
- `src/entities.js`: 玩家、敌人、Boss、投射物、道具、粒子、对象池
- `src/levels.js`: 关卡波次和导演器
- `src/game.js`: 游戏状态、碰撞、HUD、界面绘制
- `src/main.js`: 初始化和主循环

## 当前方向

项目继续保持无构建、直接运行、Canvas 优先。后续优先补强单机后期构筑与溢出补给，再逐步扩展本地合作 PVE 和挑战码/影子目标这类轻量间接 PVP。

- 画面:持续增强 Canvas 绘制质感，不引入重型渲染框架。
- 音乐:主菜单和对局轮播 `assets/audio/above-the-sprawl.mp3` 与 `assets/audio/skyward-raid-bgm-02.m4a`，播放时自动淡入淡出。
- 音效:射击、爆炸、道具等即时反馈仍使用 WebAudio 合成，后续可替换或叠加 CC0/免版税素材。
- 武器:普通弹已扩展为追踪弹、激光、导弹和火力超载。
- 道具:掉落道具带近距离吸附和拾取反馈，减少贴身漏吃。
- 内容:优先解决满火力后的奖励价值、威胁等级、精英敌人局面变化、无尽模式后期成长曲线。
- 多人:先设计本地双人合作 PVE，再扩展同屏间接对抗；当前已加入免费 WebRTC 点对点 MVP。
- 发布:保持无构建可运行；GitHub Pages 直接发布 `main` 分支根目录。

## 免费联机 MVP

当前联机不依赖服务器，使用浏览器原生 WebRTC DataChannel。两个人都打开 GitHub Pages 页面后:

1. 房主点右上角“联机 → 创建邀请码”，复制文本发给朋友。
2. 朋友粘贴邀请码，点“加入并生成应答”，把生成的应答文本发回房主。
3. 房主粘贴应答，点“接受应答”。

连接成功后，双方在对局中会看到对方的队友机影。这个版本先同步玩家位置；完整合作闯关、敌人/子弹同步、房间码自动配对可以后续继续加。
