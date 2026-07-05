"use strict";

/* =====================================================================
 * 8) 前景星点 + 主循环
 * ===================================================================== */
const stars = {
  items: Array.from({ length: 60 }, () => ({ x: Math.random() * CONFIG.WIDTH, y: Math.random() * CONFIG.HEIGHT, s: 90 + Math.random() * 160, r: Math.random() < 0.8 ? 1 : 2 })),
  update(dt) { for (const p of this.items) { p.y += p.s * dt; if (p.y > CONFIG.HEIGHT) { p.y = 0; p.x = Math.random() * CONFIG.WIDTH; } } },
  draw(ctx) { ctx.fillStyle = "rgba(255,255,255,.25)"; for (const p of this.items) ctx.fillRect(p.x, p.y, p.r, p.r * 3); },
};

ImageAssets.load();                                // 载入可选图片素材(无素材时不请求文件)
Settings.load();                                   // 载入持久化设置(音量/音效/震动/上次难度)
Progress.load();                                   // 载入关卡进度
Achievements.load();                               // OO:载入成就进度
game.diff = CONFIG.difficulties[Settings.data.diff];
game.ship = CONFIG.ships[Settings.data.ship] || CONFIG.ships.balanced;
game.autoNext = Settings.data.autoNext !== false;
if (Settings.data.seenTutorial) game.toTitle(); else game.toTutorial();   // FF:首次启动自动展示新手引导
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.05) dt = 0.05;
  game.titleT += dt;
  if (game._hitStopT > 0) { game._hitStopT -= dt; game.draw(ctx); requestAnimationFrame(loop); return; }   // N:命中停顿(冻结逻辑,仍绘制)
  if (game.state !== "paused") { background.update(dt); stars.update(dt); }   // 暂停冻结背景
  Music.update(dt);                                                           // M:BGM 步进
  if (window.Multiplayer) Multiplayer.update(dt);
  game.update(dt); game.draw(ctx);
  if (window.Multiplayer) Multiplayer.draw(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
