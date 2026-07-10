"use strict";

/* =====================================================================
 * 4) 工具
 * ===================================================================== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const DEG = Math.PI / 180;
// 僚机横向偏移:左右交替、逐对外扩(支持 4 架)
const wingOffsetX = (i) => ((i % 2 === 0) ? -1 : 1) * (30 + Math.floor(i / 2) * 22);

// ── 现代 UI:圆角按钮(渐变 + 高光 + 描边),取代简陋矩形边框 ──
const UI = {
  // QQ:兼容 3 位缩写 hex(如 "#fff",BOSS 受击闪白用的就是这个),不然 slice 会切出空字符串导致 NaN
  hex2rgb(h) { let c = h.replace("#", ""); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; },
  rgba(h, a) { const [r, g, b] = this.hex2rgb(h); return "rgba(" + r + "," + g + "," + b + "," + a + ")"; },
  // QQ:明暗混色 —— amt>0 往白混(变亮),amt<0 往黑混(变暗),给纯色形状做渐变立体感用
  // GG:返回 hex(而非 rgb(...))—— canvas fillStyle/colorStop 两种格式都认,但 hex 还能继续喂给 UI.rgba() 二次调透明度
  //   (之前的 rgb(...) 格式会被 UI.rgba 内部的 hex2rgb 当 hex 硬切,切出 NaN,报 addColorStop 颜色解析错误)
  shade(h, amt) {
    const [r, g, b] = this.hex2rgb(h);
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
    const hex = (c) => c.toString(16).padStart(2, "0");
    return "#" + hex(f(r)) + hex(f(g)) + hex(f(b));
  },
  // X6:按当前 ctx.font 逐字符量宽度换行(中文没有空格分词,逐字符贪心断行足够用)——调用前必须先设好 ctx.font,
  //   最多返回 maxLines 行,超出的部分会被截断(而不是无限换行撑爆版面),末尾补"…"提示被截断。
  wrapText(ctx, text, maxWidth, maxLines = 2) {
    const lines = []; let cur = "";
    for (const ch of text) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = ch; if (lines.length >= maxLines) { cur = ""; break; } }
      else cur = test;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…"; }
    else if (lines.length === maxLines) {
      const consumed = lines.join("").length;
      if (consumed < text.length) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
    }
    return lines;
  },
  // QQ:玻璃质感面板(卡片通用)—— 阴影 + 渐变 + 顶部高光 + 强调色描边,和 UI.button 的视觉语言统一
  panel(ctx, x, y, w, h, r, opts) {
    const o = opts || {}, accent = o.accent || "#4dabf7";
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top || "rgba(255,255,255,.09)"); g.addColorStop(1, o.bottom || "rgba(255,255,255,.02)");
    this.roundRect(ctx, x, y, w, h, r); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    this.roundRect(ctx, x, y, w, h, r); ctx.lineWidth = o.lineWidth || 1.5; ctx.strokeStyle = o.stroke || this.rgba(accent, .45); ctx.stroke();
    this.roundRect(ctx, x + 2, y + 2, Math.max(0, w - 4), h * 0.35, Math.max(0, r - 2)); ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
  },
  roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  },
  // rect:{x,y,w,h}  opts:{label,sub,color,active,radius,font,textColor}
  button(ctx, rect, opts) {
    const o = opts || {}, { x, y, w, h } = rect, col = o.color || "#4dabf7", active = !!o.active, rad = o.radius != null ? o.radius : 13;
    // 阴影
    ctx.save(); ctx.shadowColor = active ? this.rgba(col, 0.5) : "rgba(0,0,0,.35)"; ctx.shadowBlur = active ? 14 : 6; ctx.shadowOffsetY = 2;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    if (active) { g.addColorStop(0, this.rgba(col, 0.5)); g.addColorStop(1, this.rgba(col, 0.24)); }
    else { g.addColorStop(0, "rgba(255,255,255,.09)"); g.addColorStop(1, "rgba(255,255,255,.02)"); }
    this.roundRect(ctx, x, y, w, h, rad); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    // 描边
    this.roundRect(ctx, x, y, w, h, rad); ctx.lineWidth = active ? 2.5 : 1.5; ctx.strokeStyle = active ? col : "rgba(255,255,255,.28)"; ctx.stroke();
    // 顶部高光
    this.roundRect(ctx, x + 2.5, y + 2.5, w - 5, h * 0.44, rad - 3); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
    if (o.label != null) {
      // HH:改成保存/还原调用方原有的 textAlign/textBaseline,而不是无脑写死 "left"/"alphabetic"——
      // 之前写死会把调用方在按钮之前设的 "center" 冲掉,导致按钮之后的文字全部跟着变成从中线往右的左对齐,
      // 短文本看不出来,长一点的段落(如新手引导)就会明显超出右边框。
      const prevAlign = ctx.textAlign, prevBaseline = ctx.textBaseline;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = active ? "#fff" : (o.textColor || "#dee2e6"); ctx.font = "bold " + (o.font || 18) + "px 'Segoe UI', sans-serif";
      ctx.fillText(o.label, x + w / 2, y + h / 2 + (o.sub ? -8 : 0));
      if (o.sub) { ctx.fillStyle = active ? "rgba(255,255,255,.85)" : "rgba(206,212,218,.7)"; ctx.font = "11px 'Segoe UI', sans-serif"; ctx.fillText(o.sub, x + w / 2, y + h / 2 + 11); }
      ctx.textAlign = prevAlign; ctx.textBaseline = prevBaseline;
    }
  },
  // AA:圆形玻璃质感按钮(HUD 里的炸弹/暂停/必杀/结算按钮统一走这个,取代裸 arc+纯色)
  roundButton(ctx, cx, cy, r, col, opts) {
    const o = opts || {};
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
    g.addColorStop(0, this.rgba(col, o.alpha != null ? o.alpha : 0.9));
    g.addColorStop(1, this.rgba(col, (o.alpha != null ? o.alpha : 0.9) * 0.5));
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.lineWidth = o.lineWidth || 2.5; ctx.strokeStyle = o.stroke || "rgba(255,255,255,.55)";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // 玻璃高光(顶部弧形亮带)
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.32, r * 0.62, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = Math.max(2, r * 0.16); ctx.stroke();
  },
  // AA:圆角进度条统一样式(血条/必杀条/BOSS条共用)—— 深色底槽 + 渐变填充 + 顶部高光,ready 时外发光脉动
  // opts.trailRatio:残影(如血条掉血后缓慢跟随下降),画在底槽和主填充之间,只在 trailRatio > ratio 时可见
  bar(ctx, x, y, w, h, ratio, colFrom, colTo, opts) {
    const o = opts || {}, r = h / 2;
    if (o.glow) { ctx.save(); ctx.shadowColor = o.glowColor || this.rgba(colTo, .9); ctx.shadowBlur = (o.glowBlur || 12) * (o.pulse != null ? o.pulse : 1); this.roundRect(ctx, x, y, w, h, r); ctx.fillStyle = this.rgba(o.glowColor || colTo, .16); ctx.fill(); ctx.restore(); }
    this.roundRect(ctx, x, y, w, h, r); ctx.fillStyle = "#1a1d22"; ctx.fill();
    if (o.trailRatio != null && o.trailRatio > ratio) {
      const tw = Math.max(0, (w - 4) * clamp(o.trailRatio, 0, 1));
      this.roundRect(ctx, x + 2, y + 2, tw, h - 4, (h - 4) / 2); ctx.fillStyle = o.trailColor || "rgba(255,90,90,.55)"; ctx.fill();
    }
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,.12)"; this.roundRect(ctx, x, y, w, h, r); ctx.stroke();
    const fw = Math.max(0, (w - 4) * clamp(ratio, 0, 1));
    if (fw > 0) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, colFrom); g.addColorStop(1, colTo);
      this.roundRect(ctx, x + 2, y + 2, fw, h - 4, (h - 4) / 2); ctx.fillStyle = g; ctx.globalAlpha = o.pulse != null ? o.pulse : 1; ctx.fill(); ctx.globalAlpha = 1;
      this.roundRect(ctx, x + 3, y + 3, Math.max(0, fw - 2), (h - 4) * 0.4, (h - 4) * 0.2); ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fill();
    }
  },
};
function hit(a, b) { const dx = a.x - b.x, dy = a.y - b.y, rr = a.radius + b.radius; return dx * dx + dy * dy <= rr * rr; }

/* =====================================================================
 * 4.5) 卷轴背景
 * ===================================================================== */
const background = {
  scroll: 0,
  update(dt) { this.scroll += CONFIG.bg.speed * dt; },
  draw(ctx, level) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, th = CONFIG.themes[(level - 1) % CONFIG.themes.length];
    const base = ImageAssets.background(level, "base");
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky1); g.addColorStop(1, th.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (base) ImageAssets.drawScrolling(ctx, base, this.scroll * 0.18);
    else {
      // RR:星云软云层 —— 比 band1/band2 更慢的视差(纵深感的"最远景"),纯径向渐变模拟柔光,不用 ctx.filter 保性能。
      // 交替左右位置同样要用"绝对行号"(nebBaseRow+i)判断奇偶,道理和下面 band2 的注释一样,不然循环归零时会跳变。
      const nebSp = 480, nebT = this.scroll * 0.12, offNeb = nebT % nebSp, nebBaseRow = Math.floor(nebT / nebSp);
      for (let y = -nebSp + offNeb, i = 0; y < H + nebSp; y += nebSp, i++) {
        const ncx = W * (((nebBaseRow + i) % 2 === 0) ? 0.28 : 0.72), nr = 150;
        const ng = ctx.createRadialGradient(ncx, y, 0, ncx, y, nr);
        ng.addColorStop(0, th.band2); ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(ncx, y, nr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = th.band1;
      const sp1 = 320, off1 = (this.scroll * 0.35) % sp1;
      for (let y = -sp1 + off1; y < H + sp1; y += sp1) ctx.fillRect(0, y, W, 150);
      ctx.fillStyle = th.band2;
      // U:交替左右的色块用"绝对行号"(baseRow+i)判断奇偶,而非每帧从 0 重新计的循环变量 i,
      // 否则 off2 每循环一圈归零时,同一个色块的奇偶性(从而左右位置)会突然翻转,产生明显跳变。
      const sp2 = 170, t2 = this.scroll * 0.7, off2 = t2 % sp2, baseRow = Math.floor(t2 / sp2);
      for (let y = -sp2 + off2, i = 0; y < H + sp2; y += sp2, i++) ctx.fillRect(((baseRow + i) % 2 === 0) ? 40 : W * 0.45, y, W * 0.4, 60);
      ctx.strokeStyle = "rgba(210,240,255,.22)";
      ctx.lineWidth = 1;
      const streakSp = 120, streakT = this.scroll * 1.65, streakOff = streakT % streakSp, streakBase = Math.floor(streakT / streakSp);
      for (let y = -streakSp + streakOff, row = 0; y < H + streakSp; y += streakSp, row++) {
        for (let i = 0; i < 8; i++) {
          const seed = (streakBase + row) * 17 + i * 31;
          const x = (seed * 73) % W, len = 24 + (seed % 28);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
        }
      }
    }
    ImageAssets.drawScrolling(ctx, ImageAssets.background(level, "mid"), this.scroll * 0.45, 0.95);
    ImageAssets.drawScrolling(ctx, ImageAssets.background(level, "fg"), this.scroll * 1.4, 0.9);
    // RG5:第2战区(大漠强袭)素材整体偏亮(大片黄沙+高光),压一层半透明黑降低背景亮度;背景变暗只会让敌弹/玩家
    // 这些前景元素的相对对比度更高,不会影响躲避弹幕。background.draw() 是首页/结算/关卡过场共用的唯一入口
    // (level 统一取 game.world),这里改一处,所有用到第2战区背景的画面都会跟着变暗,不需要各处分别处理。
    if (level === 2) { ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.fillRect(0, 0, W, H); }
  },
};
