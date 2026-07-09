"use strict";

/* =====================================================================
 * 8) 前景星点 + 主循环
 * ===================================================================== */
const stars = {
  items: Array.from({ length: 60 }, () => ({ x: Math.random() * CONFIG.WIDTH, y: Math.random() * CONFIG.HEIGHT, s: 90 + Math.random() * 160, r: Math.random() < 0.8 ? 1 : 2 })),
  update(dt) { for (const p of this.items) { p.y += p.s * dt; if (p.y > CONFIG.HEIGHT) { p.y = 0; p.x = Math.random() * CONFIG.WIDTH; } } },
  draw(ctx) { ctx.fillStyle = "rgba(255,255,255,.25)"; for (const p of this.items) ctx.fillRect(p.x, p.y, p.r, p.r * 3); },
};

// GG13:开屏鸣谢/公益提示——素材(尤其非关键的世界背景/BOSS图)仍在后台加载时,给一段更充裕的缓冲期,
//   黑底白字,渐入→停留→渐出,叠在已经跑起来的标题画面之上做交叉淡出(不是先黑屏卡住再硬切标题页那种机械感)。
//   停留时长取"最短展示时间"和"全部素材真正加载完"两者的较大值,同时设安全上限,防止极端情况下卡死在开屏页出不去。
const splash = {
  active: true, t: 0, exiting: false, exitT: 0,
  fadeIn: 0.55, minHold: 2.2, maxHold: 6.5, fadeOut: 0.6, ready: false,
  dots: Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, ph: Math.random() * Math.PI * 2 })),
};
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function updateSplash(dt) {
  if (!splash.active) return;
  splash.t += dt;
  if (!splash.exiting) {
    if (splash.t >= splash.fadeIn + splash.minHold && (splash.ready || splash.t >= splash.maxHold)) splash.exiting = true;
  } else {
    splash.exitT += dt;
    if (splash.exitT >= splash.fadeOut) splash.active = false;
  }
}
// GG16:BUG修复——之前黑底本身也跟着渐入(alpha 0→1),意味着渐入过程中标题页会从底下透出来,
//   "开屏页结束之前不该看到首页"这条就破了。改成黑底在退出阶段之前始终 100% 不透明,只有文字自己做渐入,
//   真正的"看到首页"只发生在渐出阶段(那本来就是开屏页正在结束、有意露出下面的画面)。
function drawSplash(ctx) {
  if (!splash.active) return;
  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, cx = W / 2;
  const exitK = splash.exiting ? easeInOut(clamp(splash.exitT / splash.fadeOut, 0, 1)) : 0;
  const bgAlpha = 1 - exitK;   // 黑底:退出前恒为1,彻底盖住下面的画面;只有退出阶段才淡出露出首页
  const textAlpha = splash.exiting ? bgAlpha : easeInOut(clamp(splash.t / splash.fadeIn, 0, 1));
  if (bgAlpha <= 0.002) return;
  ctx.save();
  ctx.globalAlpha = bgAlpha;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  // 极轻微的漂浮光点,给纯黑底一点呼吸感,不是死气沉沉的静态图片
  ctx.fillStyle = "rgba(255,255,255,.14)";
  for (const d of splash.dots) { const y = ((d.y + splash.t * 0.02 * d.s) % 1) * H; ctx.fillRect(d.x * W, y, 1.4, 1.4); }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText("开发团队 DEVELOPED BY", cx, H * 0.30);
  ctx.fillStyle = "#fff"; ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText("Allec时", cx, H * 0.30 + 38);
  ctx.fillText("LvxSeraph", cx, H * 0.30 + 72);
  const psa = ["抵制不良游戏，拒绝盗版游戏。", "注意自我保护，谨防受骗上当。", "适度游戏益脑，沉迷游戏伤身。", "合理安排时间，享受健康生活。"];
  ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillStyle = "rgba(255,255,255,.72)";
  const psaY0 = H * 0.62;
  psa.forEach((line, i) => ctx.fillText(line, cx, psaY0 + i * 27));
  ctx.restore();
  // GG17:跳过提示——延迟 0.9s 才淡入,不抢开场那半秒的注意力;点按/点击画布任意位置跳过(见下方 pointerdown 监听)
  const hintAlpha = clamp((splash.t - 0.9) / 0.5, 0, 1) * (1 - exitK);
  if (hintAlpha > 0.01) {
    ctx.save(); ctx.globalAlpha = hintAlpha * 0.55;
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText("点击跳过", cx, H * 0.92);
    ctx.restore();
  }
}
// GG17:点击/点按跳过开屏页——用捕获阶段拦截,吞掉这一下点击(stopImmediatePropagation),
//   不会让同一次点击又被 input.js 的标题页按钮逻辑接收到,避免"跳过的同时不小心点进了某个按钮"
canvas.addEventListener("pointerdown", (e) => {
  if (!splash.active) return;
  if (!splash.exiting) { splash.exiting = true; splash.exitT = 0; }
  e.stopImmediatePropagation(); e.preventDefault();
}, { capture: true });
ImageAssets.loadTiered().then(() => { splash.ready = true; });   // 常用层素材加载完成信号,喂给上面的开屏页缓冲判断;长尾层继续在后台默默加载
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
  if (game._hitStopT > 0) { game._hitStopT -= dt; game.draw(ctx); drawSplash(ctx); requestAnimationFrame(loop); return; }   // N:命中停顿(冻结逻辑,仍绘制)
  if (game.state !== "paused") { background.update(dt); stars.update(dt); }   // 暂停冻结背景
  Music.update(dt);                                                           // M:BGM 步进
  if (window.Multiplayer) Multiplayer.update(dt);
  game.update(dt); game.draw(ctx);
  if (window.Multiplayer) Multiplayer.draw(ctx);
  updateSplash(dt); drawSplash(ctx);
  requestAnimationFrame(loop);
}
function drawBootLoading() {
  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, cx = W / 2;
  ctx.save();
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);   // GG13:改纯黑,和后面开屏页的黑底衔接,不会有一下蓝一下黑的跳色感
  ctx.fillStyle = "rgba(255,255,255,.12)";
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
