"use strict";

/* =====================================================================
 * 8) 前景星点 + 主循环
 * ===================================================================== */
// GG27:适龄提示图标优先加载——开屏页第一帧就要用到,必须是整个页面里最先发出的图片请求,
//   抢在 loadCritical/loadAllTiered 的任何一张机型/背景图之前拿到带宽,不等分层加载轮到它。
ImageAssets.ensure(ImageAssets.ageRatingSrc);
const stars = {
  items: Array.from({ length: 60 }, () => ({ x: Math.random() * CONFIG.WIDTH, y: Math.random() * CONFIG.HEIGHT, s: 90 + Math.random() * 160, r: Math.random() < 0.8 ? 1 : 2 })),
  update(dt) { for (const p of this.items) { p.y += p.s * dt; if (p.y > CONFIG.HEIGHT) { p.y = 0; p.x = Math.random() * CONFIG.WIDTH; } } },
  draw(ctx) { ctx.fillStyle = "rgba(255,255,255,.25)"; for (const p of this.items) ctx.fillRect(p.x, p.y, p.r, p.r * 3); },
};

// GG13:开屏鸣谢/公益提示——黑底白字,渐入→停留→渐出,叠在已经跑起来的标题画面之上做交叉淡出。
// GG18:与贴图加载页合二为一——页面自带真实加载进度条(数据来自 ImageAssets.loadProgress),
//   仍可点击跳过,但进度条下方写明提前跳过的后果。
// GG21:去掉"加载太久强制进入"的安全网——玩家没有主动跳过,进度条没走满就不自动进入首页,哪怕加载再久也一直停在这一页;
//   decode 本身带重试且必定落定(见 assets.js waitImageSettle/decode),不存在"永远卡在 99%"的情况,所以不需要兜底上限。
const splash = {
  active: true, t: 0, exiting: false, exitT: 0,
  fadeIn: 0.55, minHold: 2.2, fadeOut: 0.6, ready: false,
  prog: 0,   // 展示用进度(向真实进度平滑趋近,不做跳变)
  dots: Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, ph: Math.random() * Math.PI * 2 })),
};
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
// GG21:进度条填充色随进度分三段插值:蓝(刚开始)→青(过半)→绿(接近完成),给"还早/快好了"一个直观的颜色信号
function progressColor(frac) {
  const BLUE = [77, 171, 247], CYAN = [102, 217, 239], GREEN = [56, 217, 169];
  const mix = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));
  return frac < 0.5 ? mix(BLUE, CYAN, frac * 2) : mix(CYAN, GREEN, (frac - 0.5) * 2);
}
function updateSplash(dt) {
  if (!splash.active) return;
  splash.t += dt;
  const lp = ImageAssets.loadProgress;
  const target = splash.ready ? 1 : (lp.total ? lp.done / lp.total : 0);
  splash.prog += (target - splash.prog) * Math.min(1, dt * 5);   // 平滑追进度,加载完成后自然滑向 100%
  if (!splash.exiting) {
    // 进度条要"走满"再退场:必须 ready(全部贴图落定)且展示进度追到 99% 以上,不设时长上限——玩家不跳过就一直等
    if (splash.t >= splash.fadeIn + splash.minHold && splash.ready && splash.prog > 0.99) splash.exiting = true;
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
  // GG25:适龄提示图标——常驻右上角,和鸣谢文字同一节奏渐入,不单独抢注意力
  const ageIcon = ImageAssets.ready(ImageAssets.ageRatingSrc);
  if (ageIcon) {
    // GG26:面积放大到原来的 5 倍(线性边长 ×√5),经验证压缩版在此尺寸下和原图肉眼无差异,可以放心用
    // 右边距从 14 加到 36——放大后宽度够到联机浮标(mp-peek,默认挂在右边缘 top:8%)的常驻区域,留够间距避免遮挡
    const iconH = 46 * Math.sqrt(5), iconW = iconH * ageIcon.naturalWidth / ageIcon.naturalHeight;
    ctx.drawImage(ageIcon, W - 36 - iconW, 14, iconW, iconH);
  }
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
  // GG21:视觉升级——玻璃质感容器(渐变+高光+描边)、填充色随进度从蓝→青→绿过渡、内部叠一道从后向前扫的高光波
  const barW = 300, barH = 10, barX = cx - barW / 2, barY = H * 0.775;
  const frac = clamp(splash.prog, 0, 1), done = splash.ready && frac > 0.995;
  const barColor = progressColor(frac);
  ctx.fillStyle = done ? "rgba(148,232,180,.95)" : "rgba(255,255,255,.62)";
  ctx.font = "16px 'Segoe UI', sans-serif";   // GG27:12→16,加载百分比是玩家在这一页停留期间唯一持续变化的信息,字号太小容易被忽略
  ctx.fillText(done ? "加载完成，即将进入游戏…" : "贴图加载中 " + Math.floor(frac * 100) + "%", cx, barY - 14);
  // 玻璃容器:外层淡淡的发光轮廓 + 内层竖向渐变模拟玻璃反光
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,.18)"; ctx.shadowBlur = 6;
  UI.roundRect(ctx, barX, barY, barW, barH, barH / 2);
  const trackGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
  trackGrad.addColorStop(0, "rgba(255,255,255,.16)");
  trackGrad.addColorStop(0.5, "rgba(255,255,255,.05)");
  trackGrad.addColorStop(1, "rgba(255,255,255,.13)");
  ctx.fillStyle = trackGrad; ctx.fill();
  ctx.restore();
  if (frac > 0.01) {
    const fillW = Math.max(barH, barW * frac);
    ctx.save();
    UI.roundRect(ctx, barX, barY, barW, barH, barH / 2); ctx.clip();   // 裁到药丸形状,填充/高光/波不会溢出圆角
    // 填充色:随进度在蓝→青→绿之间过渡,直观反映"还早/快好了/完成"三个阶段
    ctx.fillStyle = "rgb(" + barColor.join(",") + ")";
    ctx.fillRect(barX, barY, fillW, barH);
    // 玻璃高光:上半段叠一层更亮的渐变,给填充部分的"液体感"
    const glossGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    glossGrad.addColorStop(0, "rgba(255,255,255,.5)");
    glossGrad.addColorStop(0.5, "rgba(255,255,255,.08)");
    glossGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glossGrad;
    ctx.fillRect(barX, barY, fillW, barH);
    // 从后向前扫过的高光波:一条柔和光带在已完成区间内循环平移,不做百分比跳变,是纯装饰性的"正在进行"提示
    if (!done) {
      const waveW = 46, wavePeriod = 1.15;
      const waveX = barX - waveW + ((splash.t % wavePeriod) / wavePeriod) * (fillW + waveW);
      const waveGrad = ctx.createLinearGradient(waveX, 0, waveX + waveW, 0);
      waveGrad.addColorStop(0, "rgba(255,255,255,0)");
      waveGrad.addColorStop(0.5, "rgba(255,255,255,.6)");
      waveGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = waveGrad;
      ctx.fillRect(waveX, barY, waveW, barH);
    }
    ctx.restore();
  }
  // 描边:玻璃边缘一圈细高光,和容器的发光轮廓呼应
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1;
  UI.roundRect(ctx, barX + 0.5, barY + 0.5, barW - 1, barH - 1, (barH - 1) / 2); ctx.stroke();
  ctx.restore();
  // GG17/GG18:跳过提示挪到进度条正下方,并写明提前跳过的后果;延迟 0.9s 才淡入,不抢开场注意力
  // GG27:原来"点击任意位置跳过"是整个画布都能触发,现在收窄成"点击此位置跳过"这一小块专属热区——
  //   文案跟着改名,判定范围比文字本身的占地明显更大(横向 padding 32px、纵向撑到 44px 的触控友好高度),
  //   再画一圈淡淡的胶囊描边提示"这里可以点"。热区矩形存进 splash.skipHitRect,供下面的 pointerdown 判定复用。
  // GG28:BUG修复——热区矩形(hit.y = skipLabelY-30)算出来的顶边正好等于 barY+barH(进度条底边),0 间距贴在一起,
  //   进度条的 shadowBlur 光晕一叠上去视觉上就像糊成一片"重叠"了。改成显式从 barY+barH 起算,留足 18px 净间距。
  const hintAlpha = clamp((splash.t - 0.9) / 0.5, 0, 1) * (1 - exitK) * textAlpha;
  const skipLabelY = barY + barH + 48;
  ctx.font = "17px 'Segoe UI', sans-serif";
  const skipLabel = done ? "点击立即进入" : "点击此位置跳过";
  const labelW = ctx.measureText(skipLabel).width;
  splash.skipHitRect = { x: cx - labelW / 2 - 32, y: skipLabelY - 30, w: labelW + 64, h: 44 };
  if (hintAlpha > 0.01) {
    ctx.save(); ctx.textAlign = "center";
    const hit = splash.skipHitRect;
    ctx.globalAlpha = hintAlpha * 0.35;
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
    UI.roundRect(ctx, hit.x, hit.y, hit.w, hit.h, hit.h / 2); ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = hintAlpha * 0.75;
    ctx.font = "17px 'Segoe UI', sans-serif";
    ctx.fillText(skipLabel, cx, skipLabelY);
    if (!done) {
      // GG29:BUG修复——跳过热区胶囊(高44,底边在 skipLabelY+14)和这两行说明文字原来只隔 12px 基线间距,
      //   14px 字体的字形上沿实际只比胶囊底边低 1px,肉眼几乎贴在一起。往下挪 12px,留出清楚的呼吸间距。
      ctx.globalAlpha = hintAlpha * 0.5;
      ctx.font = "14px 'Segoe UI', sans-serif";
      ctx.fillText("提前跳过后剩余贴图将在后台继续加载，", cx, skipLabelY + 38);
      ctx.fillText("未就绪的画面会暂以简化图形显示，加载完成后自动恢复", cx, skipLabelY + 58);
    }
    ctx.restore();
  }
}
// GG17:点击/点按跳过开屏页——用捕获阶段拦截,吞掉这一下点击(stopImmediatePropagation),
//   不会让同一次点击又被 input.js 的标题页按钮逻辑接收到,避免"跳过的同时不小心点进了某个按钮"。
// GG27:原来整块画布都是跳过热区,现在收窄到 drawSplash 算出的 skipHitRect(见上,文字"点击此位置跳过"周围
//   一圈比文字本身大一截的胶囊区域)——命中才触发退场,画布上其余位置的点击照样吞掉(splash 还在时不能让
//   点击穿透到下面的标题页),只是不再触发跳过,避免"随手一点就跳过开屏页"的误触。
canvas.addEventListener("pointerdown", (e) => {
  if (!splash.active) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (splash.exiting) return;
  const p = toLogic(e.clientX, e.clientY), hit = splash.skipHitRect;
  if (hit && p.x >= hit.x && p.x <= hit.x + hit.w && p.y >= hit.y && p.y <= hit.y + hit.h) {
    splash.exiting = true; splash.exitT = 0;
  }
}, { capture: true });
// GG20:热启动收短停留时长——常用层(首页/机型/HUD)在 500ms 内就落定,通常意味着贴图已经在浏览器缓存里,
//   属于"回头玩家再次打开"而非首次冷启动,没必要还让他们多等 2.2s 的最短展示时间,缩到 1.0s 即可。
const _splashLoadStart = performance.now();
ImageAssets.loadAllTiered(() => {
  if (performance.now() - _splashLoadStart < 500) splash.minHold = 1.0;
}).then(() => { splash.ready = true; });
Settings.load();                                   // 载入持久化设置(音量/音效/震动/上次难度)
Progress.load();                                   // 载入关卡进度
Achievements.load();                               // OO:载入成就进度
game.grantStarterGear();                           // RG2:首次启动送一整套制式机装,只发一次
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
  if (game.state !== "paused" && game.state !== "revive") { background.update(dt); stars.update(dt); }   // 暂停/复活确认冻结背景
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
