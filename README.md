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
- `ASSET_PROMPTS.md`: 背景、战机、敌机、Boss 等美术素材生成提示词

## 当前方向

- 画面:持续增强 Canvas 绘制质感，不引入重型渲染框架。
- 音乐:主菜单和对局轮播 `assets/audio/above-the-sprawl.mp3` 与 `assets/audio/skyward-raid-bgm-02.m4a`，播放时自动淡入淡出。
- 音效:射击、爆炸、道具等即时反馈仍使用 WebAudio 合成，后续可替换或叠加 CC0/免版税素材。
- 武器:普通弹已扩展为追踪弹、激光、导弹和火力超载。
- 道具:掉落道具带近距离吸附和拾取反馈，减少贴身漏吃。
- 内容:继续补敌机、Boss、关卡节奏和无尽模式成长曲线。
- 发布:保持无构建可运行；GitHub Pages 直接发布 `main` 分支根目录。

公开发布前请确认 `assets/audio/` 下 BGM 的授权允许公开分发。
