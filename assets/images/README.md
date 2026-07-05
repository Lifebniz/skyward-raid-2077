# Image Assets

把生成或抠图后的 PNG 放在这里。游戏会优先使用 `src/assets.js` 清单里登记的图片；没有登记或图片未加载完成时，会自动退回 Canvas 绘制。

推荐目录:

```text
backgrounds/
ships/
enemies/
bosses/
effects/
```

登记示例见 `src/assets.js`。

背景图按世界登记三层:

- `base`: 底图，慢速滚动。
- `mid`: 中景透明层，中速滚动。
- `fg`: 前景透明层，快速滚动。
