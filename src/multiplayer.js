"use strict";

/* =====================================================================
 * 7.5) 免费点对点联机 MVP
 * ===================================================================== */
const Multiplayer = {
  pc: null, channel: null, remote: null, _sendTimer: 0, _ui: null,
  _iceServers: [{ urls: "stun:stun.l.google.com:19302" }],

  init() {
    const stage = document.getElementById("stage");
    if (!stage || !("RTCPeerConnection" in window)) return;
    // GG:收起态只露出贴边的半圆把手,不占版面;点一下才展开成完整面板(展开态和以前一样)
    const widget = document.createElement("div");
    widget.className = "mp-widget collapsed";
    widget.innerHTML = `
      <div class="mp-peek" data-mp-peek title="联机">
        <span class="mp-peek-dot" data-mp-peek-dot></span>
        <span class="mp-peek-icon">📶</span>
      </div>
      <div class="mp-panel">
        <div class="mp-head">
          <div>
            <div class="mp-title">联机</div>
            <div class="mp-status" data-mp-status>未连接</div>
          </div>
          <button class="mp-toggle" type="button" data-mp-toggle>收起</button>
        </div>
        <div class="mp-body">
          <div class="mp-actions">
            <button type="button" data-mp-host>创建邀请码</button>
            <button type="button" data-mp-join>加入并生成应答</button>
            <button type="button" data-mp-accept>接受应答</button>
            <button type="button" data-mp-copy>复制文本</button>
            <button type="button" data-mp-clear>清空</button>
            <button type="button" data-mp-close>断开</button>
          </div>
          <textarea data-mp-code placeholder="房主:点 创建邀请码,复制给朋友。朋友:粘贴邀请码后点 加入并生成应答,再把应答发回房主。房主:粘贴应答后点 接受应答。"></textarea>
          <div class="mp-hint">免费 WebRTC 点对点:当前同步队友位置,完整合作战斗后续再接。</div>
        </div>
      </div>`;
    stage.appendChild(widget);
    this._ui = {
      widget,
      peek: widget.querySelector("[data-mp-peek]"),
      peekDot: widget.querySelector("[data-mp-peek-dot]"),
      toggle: widget.querySelector("[data-mp-toggle]"),
      status: widget.querySelector("[data-mp-status]"),
      code: widget.querySelector("[data-mp-code]"),
    };
    this._ui.peek.addEventListener("click", () => this.setCollapsed(false));
    this._ui.toggle.addEventListener("click", () => this.setCollapsed(true));
    widget.querySelector("[data-mp-host]").addEventListener("click", () => this.host());
    widget.querySelector("[data-mp-join]").addEventListener("click", () => this.join());
    widget.querySelector("[data-mp-accept]").addEventListener("click", () => this.acceptAnswer());
    widget.querySelector("[data-mp-copy]").addEventListener("click", () => this.copyCode());
    widget.querySelector("[data-mp-clear]").addEventListener("click", () => { this._ui.code.value = ""; });
    widget.querySelector("[data-mp-close]").addEventListener("click", () => this.disconnect());
  },

  setCollapsed(collapsed) { this._ui.widget.classList.toggle("collapsed", collapsed); },
  // GG:状态不只点亮右上角小圆点,连收起态的信标圆钮和展开面板里的状态文字也跟着变色(呼应游戏内 HUD 的状态配色:
  // 已连接=青绿 / 连接中等busy态=黄 / 其余=默认蓝),让"缩在边框"的信标本身就能看出联机状态,不用展开才知道
  status(text) {
    if (!this._ui) return;
    this._ui.status.textContent = text;
    const on = text === "已连接";
    const busy = !on && text !== "未连接" && text !== "连接断开" && text !== "连接关闭";
    for (const el of [this._ui.peekDot, this._ui.peek, this._ui.status]) {
      el.classList.remove("on", "busy", "mp-on", "mp-busy");
      if (el === this._ui.peekDot) { if (on) el.classList.add("on"); else if (busy) el.classList.add("busy"); }
      else { if (on) el.classList.add("mp-on"); else if (busy) el.classList.add("mp-busy"); }
    }
  },
  encode(desc) { return btoa(JSON.stringify(desc)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); },
  decode(text) {
    const clean = text.trim().replaceAll("-", "+").replaceAll("_", "/");
    return JSON.parse(atob(clean + "=".repeat((4 - clean.length % 4) % 4)));
  },
  async waitIce() {
    if (this.pc.iceGatheringState === "complete") return;
    await new Promise((resolve) => {
      const done = () => { this.pc.removeEventListener("icegatheringstatechange", onChange); resolve(); };
      const onChange = () => { if (this.pc.iceGatheringState === "complete") done(); };
      this.pc.addEventListener("icegatheringstatechange", onChange);
      setTimeout(done, 4500); // ponytail: no TURN/signaling yet; wait briefly for host candidates.
    });
  },
  makePeer() {
    this.disconnect(false);
    this.pc = new RTCPeerConnection({ iceServers: this._iceServers });
    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === "connected") this.status("已连接");
      else if (s === "failed" || s === "disconnected") this.status("连接断开");
      else this.status("连接中: " + s);
    };
    this.pc.ondatachannel = (e) => this.bindChannel(e.channel);
  },
  bindChannel(ch) {
    this.channel = ch;
    ch.onopen = () => { this.status("已连接"); this.send({ t: "hello", ship: game.ship.key }); };
    ch.onclose = () => this.status("连接关闭");
    ch.onmessage = (e) => this.receive(e.data);
  },
  async host() {
    try {
      this.makePeer();
      this.bindChannel(this.pc.createDataChannel("skyward-raid"));
      await this.pc.setLocalDescription(await this.pc.createOffer());
      await this.waitIce();
      this._ui.code.value = this.encode(this.pc.localDescription);
      this.status("邀请码已生成");
    } catch (e) { this.status("创建失败"); console.error(e); }
  },
  async join() {
    try {
      const offer = this.decode(this._ui.code.value);
      this.makePeer();
      await this.pc.setRemoteDescription(offer);
      await this.pc.setLocalDescription(await this.pc.createAnswer());
      await this.waitIce();
      this._ui.code.value = this.encode(this.pc.localDescription);
      this.status("应答已生成");
    } catch (e) { this.status("加入失败"); console.error(e); }
  },
  async acceptAnswer() {
    try {
      if (!this.pc) throw new Error("no host peer");
      await this.pc.setRemoteDescription(this.decode(this._ui.code.value));
      this.status("等待连接");
    } catch (e) { this.status("应答无效"); console.error(e); }
  },
  async copyCode() {
    if (!this._ui.code.value) return;
    try { await navigator.clipboard.writeText(this._ui.code.value); this.status("已复制"); }
    catch (e) { this._ui.code.select(); document.execCommand("copy"); this.status("已选择文本"); }
  },
  disconnect(clearRemote = true) {
    if (this.channel) this.channel.close();
    if (this.pc) this.pc.close();
    this.channel = null; this.pc = null;
    if (clearRemote) this.remote = null;
    this.status("未连接");
  },
  send(msg) {
    if (this.channel && this.channel.readyState === "open") this.channel.send(JSON.stringify(msg));
  },
  receive(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (msg.t === "state") this.remote = { ...msg, seenAt: performance.now() };
  },
  update(dt) {
    this._sendTimer -= dt;
    if (this._sendTimer > 0 || !game.player) return;
    this._sendTimer = 0.08;
    this.send({
      t: "state", x: Math.round(game.player.x), y: Math.round(game.player.y),
      hp: Math.round(game.player.hp), maxHp: game.player.maxHp,
      ship: game.ship.key, color: game.ship.color, state: game.state,
      level: game.currentLevel, endless: game.endless,
    });
  },
  draw(ctx) {
    const r = this.remote;
    if (!r || game.state !== "playing" || r.state !== "playing" || performance.now() - r.seenAt > 2000) return;
    const x = clamp(r.x, 20, CONFIG.WIDTH - 20), y = clamp(r.y, 20, CONFIG.HEIGHT - 20);
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = r.color || "#8ec5ff"; ctx.fillStyle = r.color || "#8ec5ff";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 19, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 12, y + 13); ctx.lineTo(x + 12, y + 13); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.font = "12px 'Segoe UI', sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#dbeafe"; ctx.fillText("队友", x, y - 27);
    if (r.maxHp) {
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x - 20, y + 24, 40, 4);
      ctx.fillStyle = "#38d9a9"; ctx.fillRect(x - 20, y + 24, 40 * clamp(r.hp / r.maxHp, 0, 1), 4);
    }
    ctx.restore();
  },
};

window.Multiplayer = Multiplayer;
window.addEventListener("DOMContentLoaded", () => Multiplayer.init());
