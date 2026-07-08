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
game.autoNext = !!Settings.data.autoNext;
game.autoSpecial = !!Settings.data.autoSpecial;
game.autoLaser = !!Settings.data.autoLaser;
if (Settings.data.seenTutorial) game.toTitle(); else game.toTutorial();   // FF:首次启动自动展示新手引导
drawBootLoading();
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
function drawBootLoading() {
  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, cx = W / 2;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#081826");
  g.addColorStop(1, "#0d3a5c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  for (let i = 0; i < 18; i++) ctx.fillRect((i * 73) % W, (i * 137) % H, i % 3 === 0 ? 2 : 1, 14 + (i % 4) * 8);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e7f5ff";
  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  ctx.fillText("贴图载入中...", cx, H / 2);
  ctx.fillStyle = "rgba(231,245,255,.68)";
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.fillText("首次打开会稍慢，缺失素材仍会自动兜底", cx, H / 2 + 30);
  ctx.restore();
}
function startLoop() {
  last = performance.now();
  requestAnimationFrame(loop);
}
ImageAssets.loadCritical({ shipKey: game.ship.key, world: game.world, timeoutMs: 900 }).then(startLoop, startLoop);
