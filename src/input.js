"use strict";

/* =====================================================================
 * 3) 输入 —— 按游戏状态分派
 * ===================================================================== */
const input = {
  dragging: false, targetX: CONFIG.player.startX, targetY: CONFIG.player.startY,
  // KK:虚拟摇杆状态。joyDX/joyDY 是 -1..1 的方向×强度(死区内为0),joyKnobX/Y 是摇杆头当前绘制位置。
  joystickActive: false, joyDX: 0, joyDY: 0, joyKnobX: CONFIG.joystick.baseX, joyKnobY: CONFIG.joystick.baseY,
  // YY:movePointerId 记录"正在负责移动飞机"的那根手指的 pointerId。移动端常见操作是一根手指按住拖动飞机、
  //   另一根手指点必杀/炸弹/暂停按钮——Pointer Events 本身按手指区分 pointerId,但原来 pointermove/up 从不检查
  //   是哪根手指发来的事件,导致"点技能"那根手指抬起/移动时的坐标会串进移动目标,飞机瞬间被拽向按钮位置。
  movePointerId: null,
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
function toggleMute() {
  const on = !(Settings.data.sound || Settings.data.music);
  Settings.set("sound", on); Settings.set("music", on);
  if (on) Music.play(); else Music.stop();
}
canvas.addEventListener("pointerdown", (e) => {
  Sound.resume(); Music.resume(true);
  const p = toLogic(e.clientX, e.clientY);
  if (game.state === "title") { if (game.titleSettingsHit(p.x, p.y)) { game._resetArmed = false; game.state = "settings"; return; } if (game.titleCodexHit(p.x, p.y)) { game.toCodex(); return; } if (game.titleHelpHit(p.x, p.y)) { game.toTutorial(); return; } if (game.titleShipHit(p.x, p.y)) { game.toShipSelect(); return; } if (game.titleEndlessHit(p.x, p.y)) { game.startEndless(); return; } if (game.titleStartHit(p.x, p.y)) game.toMap(); return; }
  if (game.state === "endlessover") { game.endless = false; game.toTitle(); return; }
  if (game.state === "settings") { game.settingsPointerDown(p.x, p.y); return; }
  if (game.state === "shipselect") { game.shipSelectPointerDown(p.x, p.y); return; }
  if (game.state === "codex") { game.codexPointerDown(p.x, p.y); return; }
  if (game.state === "tutorial") { game.tutorialPointerDown(p.x, p.y); return; }
  if (game.state === "map") { game.mapPointerDown(p.x, p.y); return; }
  if (game.state === "cleared") {
    if (game.clearedCheckHit(p.x, p.y)) { game.autoNext = !game.autoNext; Settings.set("autoNext", game.autoNext); return; }
    const i = game.clearedMenuHit(p.x, p.y); if (i === 0) game.settle(game.autoNext); else if (i === 1) game.startFarm(); return;
  }
  // UU:BUG修复——按钮文案是"返回首页"但之前调的是 toMap()(尤其无尽模式下,无尽没有"当前关卡"概念,落到地图页很莫名其妙)
  if (game.state === "paused") { const i = game.pauseMenuHit(p.x, p.y); if (i === 0) game.resume(); else if (i === 1) { game.endless = false; game.toTitle(); } return; }
  if (game.state !== "playing") { game.toMap(); return; }                                            // 结算/失败界面 → 返回地图
  if (game.farming && game.settleButtonHit(p.x, p.y)) { game.settle(); return; }                     // 刷分中点结算
  if (game.specialButtonHit(p.x, p.y)) { game.useSpecial(); return; }                                // 必杀按钮
  if (game.pauseButtonHit(p.x, p.y)) { game.pause(); return; }                                       // 暂停按钮
  if (game.bombButtonHit(p.x, p.y)) { game.useBomb(); return; }
  // KK:操作方式二选一 —— 虚拟摇杆(定速推杆)或拖动跟随(默认,飞机跟手指位置)
  // YY:记下这根手指的 pointerId,后续 move/up 只认这一根,不会被另一根点按钮的手指干扰
  input.movePointerId = e.pointerId;
  if (Settings.data.controlMode === "joystick") { input.joystickActive = true; updateJoystick(p.x, p.y); }
  else { input.dragging = true; input.targetX = p.x; input.targetY = p.y; }
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  const p = toLogic(e.clientX, e.clientY);
  if (game.state === "settings" && game._sliderDrag === "sfx") { game.setSfxVolumeFromX(p.x); return; }
  if (game.state === "settings" && game._sliderDrag === "music") { game.setMusicVolumeFromX(p.x); return; }
  if (game.state === "map" && game._mapDragging) { game.mapPointerMove(p.x, p.y); return; }
  // YY:忽略非移动手指发来的坐标——否则点技能/炸弹/暂停按钮的那根手指稍微一动就会把飞机的移动目标改成按钮位置
  if (e.pointerId !== input.movePointerId) return;
  if (input.joystickActive) { updateJoystick(p.x, p.y); return; }
  if (!input.dragging) return; input.targetX = p.x; input.targetY = p.y;
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerId === input.movePointerId) { input.dragging = false; resetJoystick(); input.movePointerId = null; }   // YY:只有移动手指抬起才停止跟随
  game._sliderDrag = false;
  if (game.state === "shipselect" && game._shipDragging) { const p = toLogic(e.clientX, e.clientY); game.shipSelectSwipe(p.x); }
  if (game.state === "codex" && game._codexDragging) { const p = toLogic(e.clientX, e.clientY); game.codexSwipe(p.x); }
  if (game.state === "tutorial" && game._tutorialDragging) { const p = toLogic(e.clientX, e.clientY); game.tutorialSwipe(p.x); }
  if (game.state === "map" && game._mapDragging) { const p = toLogic(e.clientX, e.clientY); game.mapPointerUp(p.x, p.y); }
  game._shipDragging = false; game._codexDragging = false; game._tutorialDragging = false; game._mapDragging = false;
});
canvas.addEventListener("pointercancel", (e) => {
  if (e.pointerId === input.movePointerId) { input.dragging = false; resetJoystick(); input.movePointerId = null; }
  game._sliderDrag = false; game._shipDragging = false; game._codexDragging = false; game._tutorialDragging = false; game._mapDragging = false;
});
window.addEventListener("keydown", (e) => {
  Sound.resume(); Music.resume(true);
  if (e.key === "b" || e.key === "B" || e.code === "Space") { if (game.state === "playing") game.useBomb(); e.preventDefault(); }
  if (e.key === "x" || e.key === "X") { if (game.state === "playing") game.useSpecial(); e.preventDefault(); }
  if (e.key === "p" || e.key === "P" || e.key === "Escape") { game.togglePause(); e.preventDefault(); }
  if (e.key === "m" || e.key === "M") { toggleMute(); e.preventDefault(); }
  if (e.key === "v" || e.key === "V") Settings.set("haptics", !Settings.data.haptics);
});
