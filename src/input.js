"use strict";

/* =====================================================================
 * 3) 输入 —— 按游戏状态分派
 * ===================================================================== */
const input = {
  dragging: false, targetX: CONFIG.player.startX, targetY: CONFIG.player.startY,
  dragPointerX: 0, dragPointerY: 0, dragTargetX: CONFIG.player.startX, dragTargetY: CONFIG.player.startY,
  // KK:虚拟摇杆状态。joyDX/joyDY 是 -1..1 的方向×强度(死区内为0),joyKnobX/Y 是摇杆头当前绘制位置。
  joystickActive: false, joyDX: 0, joyDY: 0, joyKnobX: CONFIG.joystick.baseX, joyKnobY: CONFIG.joystick.baseY,
  // YY:movePointerId 记录"正在负责移动飞机"的那根手指的 pointerId。移动端常见操作是一根手指按住拖动飞机、
  //   另一根手指点必杀/炸弹/暂停按钮——Pointer Events 本身按手指区分 pointerId,但原来 pointermove/up 从不检查
  //   是哪根手指发来的事件,导致"点技能"那根手指抬起/移动时的坐标会串进移动目标,飞机瞬间被拽向按钮位置。
  movePointerId: null, chargePointerId: null,
};
// KK:根据触点位置更新摇杆头位置和方向强度(触点越靠近/超出摇杆半径,强度越接近1;死区内视为无输入)
function updateJoystick(px, py) {
  const j = CONFIG.joystick, dx = px - j.baseX, dy = py - j.baseY, dist = Math.hypot(dx, dy), clamped = Math.min(dist, j.radius);
  const norm = dist > 0.001 ? clamped / dist : 0;
  input.joyKnobX = j.baseX + dx * norm; input.joyKnobY = j.baseY + dy * norm;
  const mag = clamped / j.radius;
  if (mag < j.deadzone || dist < 0.001) { input.joyDX = 0; input.joyDY = 0; }
  else { input.joyDX = (dx / dist) * mag; input.joyDY = (dy / dist) * mag; }
}
function resetJoystick() {
  input.joystickActive = false; input.joyDX = 0; input.joyDY = 0;
  input.joyKnobX = CONFIG.joystick.baseX; input.joyKnobY = CONFIG.joystick.baseY;
}
function startRelativeDrag(px, py) {
  const p = game.player || input;
  input.dragging = true; input.dragPointerX = px; input.dragPointerY = py;
  input.dragTargetX = p.x ?? input.targetX; input.dragTargetY = p.y ?? input.targetY;
  input.targetX = input.dragTargetX; input.targetY = input.dragTargetY;
}
function updateRelativeDrag(px, py) {
  input.targetX = input.dragTargetX + px - input.dragPointerX;
  input.targetY = input.dragTargetY + py - input.dragPointerY;
}
function toggleMute() {
  const on = !(Settings.data.sound || Settings.data.music);
  Settings.set("sound", on); Settings.set("music", on);
  if (on) Music.play(); else Music.stop();
}
canvas.addEventListener("pointerdown", (e) => {
  Sound.resume(); Music.resume(true);
  const p = toLogic(e.clientX, e.clientY);
  // RG3:机装掉落弹窗盖在最上层,拦在所有状态分支最前面——点哪都先关弹窗,不会误触到弹窗底下结算页的"点击返回地图"
  if (game._gearDropPopupOpen) { game._gearDropPopupOpen = false; return; }
  if (game.state === "title") {
    if (game.titleSettingsHit(p.x, p.y)) { game._resetArmed = false; game._settingsReturnState = "title"; game.state = "settings"; return; }
    if (game.titleCodexHit(p.x, p.y)) { game.toCodex(); return; }
    if (game.titleHelpHit(p.x, p.y)) { game.toTutorial(); return; }
    // GG6:四个入口按钮改成"按下先按压反馈,松开时若手指/鼠标还在同一个按钮上才真正触发"——这样手机点击时
    //   能看到按下缩小的反馈,而不是 pointerdown 一到就立刻跳转、动画一帧都来不及播完
    const key = game.titleButtonKeyAt(p.x, p.y);
    if (key) { game._titlePressKey = key; }
    return;
  }
  if (game.state === "endlessdiff") {
    const inR = (r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    if (inR(game.endlessDiffNormalRect())) { game.setEndlessDiff("normal"); game.startEndless({ diff: "normal" }); return; }
    if (inR(game.endlessDiffHellRect())) { game.setEndlessDiff("hell"); game.startEndless({ diff: "hell" }); return; }
    if (!inR(game.endlessDiffPanelRect())) game.toTitle();
    return;
  }
  if (game.state === "endlessover") {
    if (!game.endlessLite && game.endlessChallengeHit(p.x, p.y)) { game.copyEndlessChallenge(); return; }
    const backToMap = game._endlessFrom === "map";   // GG:从地图进的无尽关卡,结算后原路回地图,而不是回首页
    game.endless = false; game.endlessLite = false;
    if (backToMap) game.toMap(); else game.toTitle();
    return;
  }
  if (game.state === "settings") { game.settingsPointerDown(p.x, p.y); return; }
  if (game.state === "shipselect") { game.shipSelectPointerDown(p.x, p.y); return; }
  if (game.state === "codex") { game.codexPointerDown(p.x, p.y); return; }
  if (game.state === "tutorial") { game.tutorialPointerDown(p.x, p.y); return; }
  if (game.state === "map") { game.mapPointerDown(p.x, p.y); return; }
  if (game.state === "chipselect") {
    const action = game.chipActionHit(p.x, p.y);
    if (action === "reroll") game.rerollChipDraft();
    else if (action === "skip") game.skipChipDraft();
    else { const i = game.chipChoiceHit(p.x, p.y); if (i >= 0) game.chooseChip(i); }
    return;
  }
  if (game.state === "cleared") {
    if (game.clearedCheckHit(p.x, p.y)) { game.autoNext = !game.autoNext; Settings.set("autoNext", game.autoNext); return; }
    const i = game.clearedMenuHit(p.x, p.y); if (i === 0) game.settle(game.autoNext); else if (i === 1) game.startFarm(); return;
  }
  // RV:复活确认——只认两个按钮的点击,其余点击原地吞掉(不能让点击落空后被下面的"非 playing 态点哪都回地图"这条通用规则接住)
  if (game.state === "revive") {
    if (game.reviveHit(p.x, p.y)) game.doRevive();
    else if (game.reviveDeclineHit(p.x, p.y)) game.declineRevive();
    return;
  }
  // UU:BUG修复——按钮文案是"返回首页"但之前调的是 toMap()(尤其无尽模式下,无尽没有"当前关卡"概念,落到地图页很莫名其妙)
  if (game.state === "paused") {
    if (game.pauseToggleHit(0, p.x, p.y)) { game.autoSpecial = !game.autoSpecial; Settings.set("autoSpecial", game.autoSpecial); return; }
    if (game.pauseToggleHit(1, p.x, p.y)) { game.autoLaser = !game.autoLaser; Settings.set("autoLaser", game.autoLaser); return; }
    if (game.pauseToggleHit(2, p.x, p.y)) { Settings.set("hideWings", !Settings.data.hideWings); return; }
    const i = game.pauseMenuHit(p.x, p.y); if (i === 0) game.resume(); else if (i === 1) { game._resetArmed = false; game._settingsReturnState = "paused"; game.state = "settings"; } else if (i === 2) { game.endless = false; game.toTitle(); } else if (i === 3 && game.endless) game.settleEndless(); return;
  }
  if (game.state !== "playing") { game.toMap(); return; }                                            // 结算/失败界面 → 返回地图
  if (game.farming && game.settleButtonHit(p.x, p.y)) { game.settle(); return; }                     // 刷分中点结算
  if (game.specialButtonHit(p.x, p.y)) { game.useSpecial(); return; }                                // 必杀按钮
  if (game.pauseButtonHit(p.x, p.y)) { game.pause(); return; }                                       // 暂停按钮
  if (game.bombButtonHit(p.x, p.y)) { game.useBomb(); return; }
  if (game.chargeButtonHit(p.x, p.y)) { input.chargePointerId = e.pointerId; game.startCharge(); canvas.setPointerCapture(e.pointerId); return; }
  // KK:操作方式二选一 —— 虚拟摇杆(定速推杆)或相对拖动(默认,按手指位移移动飞机)
  // YY:记下这根手指的 pointerId,后续 move/up 只认这一根,不会被另一根点按钮的手指干扰
  input.movePointerId = e.pointerId;
  if (Settings.data.controlMode === "joystick") { input.joystickActive = true; updateJoystick(p.x, p.y); }
  else startRelativeDrag(p.x, p.y);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  const p = toLogic(e.clientX, e.clientY);
  // GG6:首页四个插图按钮——鼠标悬停/手指按住滑动时实时更新"当前指向的按钮",供 update() 里的缩放动画和
  //   pointerup 里的"松手时是否还在同一个按钮上"判断复用;拖出按钮再松手会因为 key 对不上而不触发跳转
  if (game.state === "title") { game._titleHoverKey = game.titleButtonKeyAt(p.x, p.y); return; }
  if (game.state === "settings" && game._sliderDrag === "sfx") { game.setSfxVolumeFromX(p.x); return; }
  if (game.state === "settings" && game._sliderDrag === "music") { game.setMusicVolumeFromX(p.x); return; }
  if (game.state === "map" && game._mapDragging) { game.mapPointerMove(p.x, p.y); return; }
  if (game.state === "codex" && game._codexUpgradeDragging) { game.codexUpgradePointerMove(p.y); return; }
  if (game.state === "shipselect" && game._shipDragging) { game.shipSelectPointerMove(p.x); return; }
  // YY:忽略非移动手指发来的坐标——否则点技能/炸弹/暂停按钮的那根手指稍微一动就会把飞机的移动目标改成按钮位置
  if (e.pointerId !== input.movePointerId) return;
  if (input.joystickActive) { updateJoystick(p.x, p.y); return; }
  if (!input.dragging) return; updateRelativeDrag(p.x, p.y);
});
canvas.addEventListener("pointerup", (e) => {
  // GG6:松手时手指/鼠标是否还在按下的那个按钮上——是才真正触发跳转,拖出去松手等于取消(标准按钮手感)
  if (game.state === "title" && game._titlePressKey) {
    const key = game._titlePressKey; game._titlePressKey = null;
    const p = toLogic(e.clientX, e.clientY);
    if (game.titleButtonKeyAt(p.x, p.y) === key) game.activateTitleButton(key);
    return;
  }
  if (e.pointerId === input.chargePointerId) { game.releaseCharge(); input.chargePointerId = null; }
  if (e.pointerId === input.movePointerId) { input.dragging = false; resetJoystick(); input.movePointerId = null; }   // YY:只有移动手指抬起才停止跟随
  game._sliderDrag = false;
  if (game.state === "shipselect" && game._shipDragging) game.shipSelectPointerUp();
  if (game.state === "codex" && game._codexDragging) { const p = toLogic(e.clientX, e.clientY); game.codexSwipe(p.x); }
  if (game.state === "tutorial" && game._tutorialDragging) { const p = toLogic(e.clientX, e.clientY); game.tutorialSwipe(p.x); }
  if (game.state === "map" && game._mapDragging) { const p = toLogic(e.clientX, e.clientY); game.mapPointerUp(p.x, p.y); }
  game._shipDragging = false; game._codexDragging = false; game._tutorialDragging = false; game._mapDragging = false; game._codexUpgradeDragging = false;
});
canvas.addEventListener("pointercancel", (e) => {
  game._titlePressKey = null;
  if (e.pointerId === input.chargePointerId) { game.releaseCharge(); input.chargePointerId = null; }
  if (e.pointerId === input.movePointerId) { input.dragging = false; resetJoystick(); input.movePointerId = null; }
  game._sliderDrag = false; game._shipDragging = false; game._codexDragging = false; game._tutorialDragging = false; game._mapDragging = false; game._codexUpgradeDragging = false;
});
// GG6:鼠标移出画布——清掉首页按钮的悬停高亮,不然移出去了缩放动画还停在放大状态
canvas.addEventListener("pointerleave", () => { game._titleHoverKey = null; });
// OO:鼠标滚轮纵向滚动 —— 地图节点区域 / 强化图鉴列表,和拖动滚动共用同一份 clamp 逻辑,只是换一种输入方式
canvas.addEventListener("wheel", (e) => {
  const scale = CONFIG.HEIGHT / canvas.getBoundingClientRect().height, dy = e.deltaY * scale;
  if (game.state === "map") { game._mapScrollY = clamp(game._mapScrollY + dy, 0, game.mapMaxScroll()); e.preventDefault(); return; }
  if (game.state === "codex" && game._codexTab === "upgrade") { game._codexUpgradeScrollY = clamp(game._codexUpgradeScrollY + dy, 0, game.codexUpgradeMaxScroll()); e.preventDefault(); return; }
}, { passive: false });
window.addEventListener("keydown", (e) => {
  Sound.resume(); Music.resume(true);
  if (game.state === "endlessdiff" && e.key === "Escape") { game.toTitle(); e.preventDefault(); return; }
  if (game.state === "chipselect" && ["1", "2", "3"].includes(e.key)) { game.chooseChip(Number(e.key) - 1); e.preventDefault(); return; }
  if (game.state === "chipselect" && (e.key === "r" || e.key === "R")) { game.rerollChipDraft(); e.preventDefault(); return; }
  if (game.state === "chipselect" && (e.key === "s" || e.key === "S")) { game.skipChipDraft(); e.preventDefault(); return; }
  if (e.key === "b" || e.key === "B" || e.code === "Space") { if (game.state === "playing") game.useBomb(); e.preventDefault(); }
  if (e.key === "x" || e.key === "X") { if (game.state === "playing") game.useSpecial(); e.preventDefault(); }
  if ((e.key === "c" || e.key === "C") && !e.repeat) { if (game.state === "playing") game.startCharge(); e.preventDefault(); }
  if (e.key === "p" || e.key === "P" || e.key === "Escape") { game.togglePause(); e.preventDefault(); }
  if (e.key === "m" || e.key === "M") { toggleMute(); e.preventDefault(); }
  if (e.key === "v" || e.key === "V") Settings.set("haptics", !Settings.data.haptics);
});
window.addEventListener("keyup", (e) => {
  if (e.key === "c" || e.key === "C") { if (game.state === "playing") game.releaseCharge(); e.preventDefault(); }
});
