"use strict";

/* =====================================================================
 * 8) 前景星点 + 主循环
 * ===================================================================== */
const stars = {
  items: Array.from({ length: 60 }, () => ({ x: Math.random() * CONFIG.WIDTH, y: Math.random() * CONFIG.HEIGHT, s: 90 + Math.random() * 160, r: Math.random() < 0.8 ? 1 : 2 })),
  update(dt) { for (const p of this.items) { p.y += p.s * dt; if (p.y > CONFIG.HEIGHT) { p.y = 0; p.x = Math.random() * CONFIG.WIDTH; } } },
  draw(ctx) { ctx.fillStyle = "rgba(255,255,255,.25)"; for (const p of this.items) ctx.fillRect(p.x, p.y, p.r, p.r * 3); },
};

// GG13:开屏鸣谢/公益提示——黑底白字,渐入→停留→渐出,叠在已经跑起来的标题画面之上做交叉淡出。
// GG18:与贴图加载页合二为一——页面自带真实加载进度条(数据来自 ImageAssets.loadProgress),
//   "自动进入"的条件从"常用层加载完"收紧为"全部贴图加载完"(ready 由 loadAllTiered 置位);
//   仍可点击跳过,但进度条下方写明提前跳过的后果。maxHold 只留一个很宽松的安全网:
//   decode 带重试且必定落定,正常情况下 ready 一定会来,这个上限只防浏览器级的意外挂起。
const splash = {
  active: true, t: 0, exiting: false, exitT: 0,
  fadeIn: 0.55, minHold: 2.2, maxHold: 45, fadeOut: 0.6, ready: false,
  prog: 0,   // 展示用进度(向真实进度平滑趋近,不做跳变)
  dots: Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, ph: Math.random() * Math.PI * 2 })),
};
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function updateSplash(dt) {
  if (!splash.active) return;
  splash.t += dt;
  const lp = ImageAssets.loadProgress;
  const target = splash.ready ? 1 : (lp.total ? lp.done / lp.total : 0);
  splash.prog += (target - splash.prog) * Math.min(1, dt * 5);   // 平滑追进度,加载完成后自然滑向 100%
  if (!splash.exiting) {
    // 进度条要"走满"再退场:除了 ready,还等展示进度追到 99% 以上,避免"数字还在 8x% 就黑屏切走"的突兀感
    if (splash.t >= splash.fadeIn + splash.minHold && ((splash.ready && splash.prog > 0.99) || splash.t >= splash.maxHold)) splash.exiting = true;
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
  // ① 开发团队鸣谢(上段)
  ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText("开发团队 DEVELOPED BY", cx, H * 0.20);
  ctx.fillStyle = "#fff"; ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText("Allec时", cx, H * 0.20 + 38);
  ctx.fillText("LvxSeraph", cx, H * 0.20 + 72);
  // ② 健康游戏忠告(中段)——GG18:加标题 + 左右装饰短线,正文从 14px 放大到 17px、行距拉开
  const advY = H * 0.44;
  ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.font = "bold 20px 'Segoe UI', sans-serif";
  ctx.fillText("健 康 游 戏 忠 告", cx, advY);
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
  const tw = ctx.measureText("健 康 游 戏 忠 告").width / 2 + 22;
  ctx.beginPath();
  ctx.moveTo(cx - tw - 56, advY - 7); ctx.lineTo(cx - tw, advY - 7);
  ctx.moveTo(cx + tw, advY - 7); ctx.lineTo(cx + tw + 56, advY - 7);
  ctx.stroke();
  const psa = ["抵制不良游戏，拒绝盗版游戏。", "注意自我保护，谨防受骗上当。", "适度游戏益脑，沉迷游戏伤身。", "合理安排时间，享受健康生活。"];
  ctx.font = "17px 'Segoe UI', sans-serif"; ctx.fillStyle = "rgba(255,255,255,.82)";
  psa.forEach((line, i) => ctx.fillText(line, cx, advY + 44 + i * 34));
  // ③ 贴图加载进度条(下段)——真实进度,全部加载完才自动进入
  const barW = 300, barH = 6, barX = cx - barW / 2, barY = H * 0.775;
  const frac = clamp(splash.prog, 0, 1), done = splash.ready || frac > 0.995;
  ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(done ? "加载完成，即将进入游戏…" : "贴图加载中 " + Math.floor(frac * 100) + "%", cx, barY - 12);
  ctx.fillStyle = "rgba(255,255,255,.13)";
  UI.roundRect(ctx, barX, barY, barW, barH, barH / 2); ctx.fill();
  if (frac > 0.01) {
    ctx.fillStyle = done ? "rgba(148,232,180,.9)" : "rgba(255,255,255,.85)";
    UI.roundRect(ctx, barX, barY, Math.max(barH, barW * frac), barH, barH / 2); ctx.fill();
  }
  ctx.restore();
  // GG17/GG18:跳过提示挪到进度条正下方,并写明提前跳过的后果;延迟 0.9s 才淡入,不抢开场注意力
  const hintAlpha = clamp((splash.t - 0.9) / 0.5, 0, 1) * (1 - exitK) * textAlpha;
  if (hintAlpha > 0.01) {
    ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = "#fff";
    ctx.globalAlpha = hintAlpha * 0.6;
    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillText(done ? "点击立即进入" : "点击任意位置跳过", cx, barY + 34);
    if (!done) {
      ctx.globalAlpha = hintAlpha * 0.4;
      ctx.font = "11px 'Segoe UI', sans-serif";
      ctx.fillText("提前跳过后剩余贴图将在后台继续加载，", cx, barY + 56);
      ctx.fillText("未就绪的画面会暂以简化图形显示，加载完成后自动恢复", cx, barY + 72);
    }
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
ImageAssets.loadAllTiered().then(() => { splash.ready = true; });   // GG18:全部贴图(常用层→长尾层)加载完才置 ready,开屏页进度条走满后自动进入
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
// GG18:原来独立的"贴图载入中..."开机页和开屏鸣谢页合并成一页——主循环启动前直接画开屏页的第 0 帧
//   (纯黑+漂浮光点,文字 alpha 还是 0),循环一启动文字自然渐入,中间没有任何页面切换或跳色。
function drawBootLoading() { drawSplash(ctx); }
function startLoop() {
  last = performance.now();
  requestAnimationFrame(loop);
}
ImageAssets.loadCritical({ shipKey: game.ship.key, world: game.world, timeoutMs: 900 }).then(startLoop, startLoop);
