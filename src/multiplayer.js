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
    const panel = document.createElement("div");
    panel.className = "mp-panel collapsed";
    panel.innerHTML = `
      <div class="mp-head">
        <div>
          <div class="mp-title">联机</div>
          <div class="mp-status" data-mp-status>未连接</div>
        </div>
        <button class="mp-toggle" type="button" data-mp-toggle>展开</button>
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
      </div>`;
    stage.appendChild(panel);
    this._ui = {
      panel,
      toggle: panel.querySelector("[data-mp-toggle]"),
      status: panel.querySelector("[data-mp-status]"),
      code: panel.querySelector("[data-mp-code]"),
    };
    this._ui.toggle.addEventListener("click", () => this.togglePanel());
    panel.querySelector("[data-mp-host]").addEventListener("click", () => this.host());
    panel.querySelector("[data-mp-join]").addEventListener("click", () => this.join());
    panel.querySelector("[data-mp-accept]").addEventListener("click", () => this.acceptAnswer());
    panel.querySelector("[data-mp-copy]").addEventListener("click", () => this.copyCode());
    panel.querySelector("[data-mp-clear]").addEventListener("click", () => { this._ui.code.value = ""; });
    panel.querySelector("[data-mp-close]").addEventListener("click", () => this.disconnect());
  },

  togglePanel() {
    const collapsed = this._ui.panel.classList.toggle("collapsed");
    this._ui.toggle.textContent = collapsed ? "展开" : "收起";
  },
  status(text) { if (this._ui) this._ui.status.textContent = text; },
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
