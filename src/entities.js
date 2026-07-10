"use strict";

/* =====================================================================
 * 5) 实体
 * ===================================================================== */
class Player {
  constructor() {
    const c = CONFIG.player, ship = game.ship;
    const diff = game.activeEndlessDiff();
    this.ship = ship;
    this.x = c.startX; this.y = c.startY; this.radius = c.radius * (ship.radiusMult || 1);
    this.maxHp = Math.round(c.maxHp * ship.hpMult * diff.playerHpMult * (1 + game.gearValue("wing"))); this.baseMaxHp = this.maxHp; this.hp = this.maxHp;   // RG:机装-翼载强化
    this.fireInterval = c.fireInterval * ship.fireMult;
    this.power = 1 + diff.startPower; this.overcharge = 0; this.powerDamage = 0; this.wingDamage = 0;
    this.bombs = clamp(game.activeDiff.startBombs + ship.bombs, 0, CONFIG.player.maxBombs);
    this.wings = clamp(ship.wings + diff.startWings, 0, CONFIG.wingMax);      // A:僚机数
    this.energy = 0;             // B:必杀能量 0-100
    this.specialCooldown = 0;    // Q:必杀冷却(秒),能量满 + 冷却结束才可释放
    this.invulnAmount = game.activeDiff.invuln;
    this._fireTimer = 0; this._fireIntervalCur = this.fireInterval; this._homingTimer = 0; this._laserTimer = 0; this._missileTimer = 0;
    this.charge = 0; this.charging = false; this.chargeCooldown = 0;
    this.slowTimer = 0; this.slowMult = 1;
    this.invulnTimer = 0; this._flameTimer = 0;   // RR:引擎尾焰粒子发射计时
    this._reviveShieldT = 0;   // RV2:复活后的纯视觉光环计时(不参与无敌判定,判定仍看 invulnTimer),game.doRevive() 里设置
    // X4:机型专属必杀状态——护盾(防御型)/隐身(侦查型)。攻击型必杀(全屏重伤)/平衡型必杀(冲击波)不需要常驻状态,现开现用。
    this.shieldHp = 0; this.shieldMax = 0; this.shieldTimer = 0; this.shieldHits = 0; this.stealthTimer = 0;
    this.cannonMode = false;   // MO:双形态机——false 普通形态 / true 大炮形态(useSpecialMorph 切换)
    this._morphTransT = 0;   // MO4:形态切换后的"相位重组"残影过渡剩余时间(useSpecialMorph 触发,见 _drawMorphTransition)
    this.morphShieldUp = false;   // MO11:曜迁双影被动——切换形态获得的相位护盾,可完整抵挡一次伤害,见 takeDamage/useSpecialMorph
    this._recoilT = 0;   // MO6:大炮开火后坐力动画剩余时间
  }
  update(dt) {
    const c = CONFIG.player;
    if (this.slowTimer > 0) { this.slowTimer -= dt; if (this.slowTimer <= 0) this.slowMult = 1; }
    const moveSlow = this.slowTimer > 0 ? this.slowMult : 1;
    // 机动性手感曲线:对 lerpMult 取平方放大差异——低于 1 的机型明显迟滞(0.85→0.72),高于 1 的明显跟手(1.5→2.25)
    const agility = Math.pow(this.ship.lerpMult || 1, 2) * (1 + game.gearValue("engine"));   // RG:机装-引擎核心
    if (Settings.data.controlMode === "joystick") {   // KK:定速推杆,而非贴向触点位置
      const speed = Math.min(CONFIG.joystick.maxSpeed * agility, 900) * moveSlow;   // 封顶 900px/s,防止高机动机型贴边失控
      this.x += input.joyDX * speed * dt; this.y += input.joyDY * speed * dt;
    } else {
      const lerp = Math.min(0.92, c.lerp * agility * moveSlow);   // 封顶防止高机动机型直接瞬移/过冲
      this.x += (input.targetX - this.x) * lerp; this.y += (input.targetY - this.y) * lerp;
    }
    const pull = game.pullVectorAt(this.x, this.y);
    this.x += pull.x * dt; this.y += pull.y * dt;
    this.x = clamp(this.x, this.radius, CONFIG.WIDTH - this.radius); this.y = clamp(this.y, this.radius, CONFIG.HEIGHT - this.radius);
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this._reviveShieldT > 0) this._reviveShieldT -= dt;
    if (this._morphTransT > 0) this._morphTransT -= dt;
    if (this._recoilT > 0) this._recoilT -= dt;   // MO6:大炮开火后坐力动画剩余时间(见 update() 里 spawnPlayerBullet("cannon") 那一支和 _drawBody 的位移计算)
    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
    if (!this.charging && game.chargeReady()) game.startCharge();
    if (this.charging) {
      this.charge = Math.min(CONFIG.charge.max, this.charge + dt * game.chipValue("chargeCore", "chargeRate", 1) * game.shipWeaponValue("chargeRate", 1));
      if (this.charge >= CONFIG.charge.max) game.releaseCharge();
    }
    if (this.stealthTimer > 0) this.stealthTimer -= dt;
    if (this.shieldTimer > 0) { this.shieldTimer -= dt; if (this.shieldTimer <= 0) { this.shieldHp = 0; this.shieldMax = 0; this.shieldHits = 0; } }
    this.addEnergy(CONFIG.special.passiveGainPerSec * dt);   // X3:必杀能量随时间缓慢自然回复,不完全依赖击杀
    // RR:引擎尾焰拖尾粒子(叠加在三角形闪烁尾焰之下,做出推进的动态感)
    this._flameTimer -= dt;
    if (this._flameTimer <= 0) { this._flameTimer = 0.03; game.spawnEngineFlame(this.x, this.y + 11); }
    this._fireTimer -= dt;
    if (this._fireTimer <= 0) {
      // MO:大炮形态——整个主炮循环放慢到 10%(fireIntervalMult),普通弹幕替换为单发贯穿能量炮弹
      const morph = this.cannonMode ? this.ship.morph : null;
      this._fireTimer = this.fireInterval * game.mainGunCooldownMult() * (morph ? morph.fireIntervalMult : 1);
      this._fireIntervalCur = this._fireTimer;   // MO3:大炮形态充能弧用——记下这一发的完整循环时长,供 draw() 算充能进度
      const pattern = CONFIG.weapon[clamp(this.power, 1, c.maxPower)];
      // MO7:大炮形态炮弹数随火力配置——(主炮路数 + 僚机数)/2 向上取整,主炮/僚机越多这一炮打得越密;
      // MO8:多发时按普通形态主炮弹幕的角度(pattern 里的 deg/ox)发射,而不是全部笔直向前——
      //   循环取用 pattern 的口位,炮弹数超过主炮路数时就重复用同一组角度再打一轮
      if (morph) {
        const speed = morph.bulletSpeed || c.bulletSpeed;
        const cannonCount = Math.ceil((pattern.length + this.wings) / 2);
        for (let i = 0; i < cannonCount; i++) {
          const s = pattern[i % pattern.length], rad = s.deg * DEG;
          game.spawnPlayerBullet(this.x + s.ox, this.y - this.radius, Math.sin(rad) * speed, -Math.cos(rad) * speed, "cannon");
        }
        this._recoilT = 0.1;   // MO6:单发重炮的后坐力顿挫,见 _drawBody
      }
      else for (const s of pattern) { const rad = s.deg * DEG; game.spawnPlayerBullet(this.x + s.ox, this.y - this.radius, Math.sin(rad) * c.bulletSpeed, -Math.cos(rad) * c.bulletSpeed); }
      for (let i = 0; i < this.wings; i++) game.spawnPlayerBullet(this.x + wingOffsetX(i), this.y + 4, 0, -c.bulletSpeed, "wing");   // 僚机直射(任意数量排布)
      const side = game.bonusStacks("sideCannons"), sideCfg = CONFIG.bonuses.sideCannons;
      for (let i = 1, n = Math.min(side, sideCfg.maxPairs); i <= n; i++) {
        const a = (sideCfg.angle + (i - 1) * 6) * DEG, ox = sideCfg.offset * i;
        game.spawnPlayerBullet(this.x - ox, this.y, -Math.sin(a) * c.bulletSpeed, -Math.cos(a) * c.bulletSpeed);
        game.spawnPlayerBullet(this.x + ox, this.y, Math.sin(a) * c.bulletSpeed, -Math.cos(a) * c.bulletSpeed);
      }
      if (game.chipActive("sideGuns")) {
        const a = CONFIG.chips.sideGuns.angle * DEG;
        game.spawnPlayerBullet(this.x - 18, this.y, -Math.sin(a) * c.bulletSpeed, -Math.cos(a) * c.bulletSpeed);
        game.spawnPlayerBullet(this.x + 18, this.y, Math.sin(a) * c.bulletSpeed, -Math.cos(a) * c.bulletSpeed);
      }
      if (morph) Sound.cannonShot(); else Sound.shoot();   // MO4:大炮形态单独配一记低频重炮音效,和普通哔声区分出"分量感"
    }
    this.updateSecondaries(dt);
  }
  updateSecondaries(dt) {
    const s = CONFIG.secondary, oc = this.overcharge || 0, allCd = game.shipWeaponValue("cooldownMult", 1);
    if (this.power >= s.homingPower) {
      this._homingTimer -= dt;
      if (this._homingTimer <= 0) {
        this._homingTimer = Math.max(0.24, (s.homingInterval - oc * 0.05) * game.chipValue("homingSwarm", "intervalMult", 1) * game.shipWeaponValue("homingIntervalMult", 1) * allCd * game.weaponCooldownMult() * game.homingCooldownMult());
        const count = 1 + (oc >= 3 ? 1 : 0) + game.chipValue("homingSwarm", "extraCount", 0) + game.bonusValue("swarmCore", "extraCount") + game.homingVolleyBonus();
        for (let i = 0; i < count; i++) game.spawnHomingShot(this.x + (i - (count - 1) / 2) * 18, this.y - this.radius, oc);
        Sound.homing();
      }
    }
    if (this.power >= s.laserPower) {
      this._laserTimer -= dt;
      if (this._laserTimer <= 0) {
        this._laserTimer = Math.max(0.55, (s.laserInterval - oc * 0.06) * game.shipWeaponValue("laserIntervalMult", 1) * allCd * game.weaponCooldownMult());
        game.spawnPlayerLaser(this.x, this.y - this.radius, oc);
        const split = game.bonusStacks("laserSplitter"), cfg = CONFIG.bonuses.laserSplitter;
        for (let i = 1, n = Math.min(split, cfg.maxPairs); i <= n; i++) {
          game.spawnPlayerLaser(this.x - cfg.offset * i, this.y - this.radius, oc, cfg.damageMult, cfg.widthMult);
          game.spawnPlayerLaser(this.x + cfg.offset * i, this.y - this.radius, oc, cfg.damageMult, cfg.widthMult);
        }
        Sound.laser();
      }
    }
    if (this.power >= s.missilePower) {
      this._missileTimer -= dt;
      if (this._missileTimer <= 0) {
        this._missileTimer = Math.max(0.45, (s.missileInterval - oc * 0.04) * game.chipValue("missileBarrage", "intervalMult", 1) * game.shipWeaponValue("missileIntervalMult", 1) * allCd * game.weaponCooldownMult() * Math.max(0.6, 1 - game.bonusValue("missileRack", "missileCooldownMult")));
        const xs = [-16, 16], extra = game.chipValue("missileBarrage", "extraCount", 0) + game.bonusValue("missileRack", "missileCount") + game.missileVolleyBonus();
        if (extra >= 1) xs.push(0);
        if (extra >= 2) xs.push(-32, 32);
        for (const ox of xs) game.spawnMissile(this.x + ox, this.y + 4, oc);
        Sound.missile();
      }
    }
  }
  // X4:护盾(防御型必杀)优先吸收伤害——盾量池打光了溢出部分才真正扣血
  // MO11:曜迁双影的相位护盾(morphShieldUp)独立于上面这套盾量池——不计伤害数值,完整挡下这一次伤害后立刻破碎并触发冲击波
  // X5:BUG修复——光学迷彩(stealthTimer)不再拦在这里免伤,改成"敌机不锁定/不开火"的隐匿玩法(见 game.stealthActive 的调用点),
  //   隐身期间仍可能被已经在飞的弹幕或贴脸撞击打中
  takeDamage(d) {
    if (this.invulnTimer > 0) return;
    let dmg = d * (this.ship.dmgTakenMult || 1) * game.chipValue("volatileCore", "damageTakenMult", 1) * game.damageTakenMult(), blocked = false;
    if (this.morphShieldUp) {
      this.morphShieldUp = false;
      game.spawnShieldHitSpark(this.x, this.y);
      dmg = 0; blocked = true;
      game.onMorphShieldBreak(this);
    } else if (this.shieldHp > 0) {
      game.spawnShieldHitSpark(this.x, this.y);
      blocked = true;
      if (dmg <= this.shieldHp) { this.shieldHp -= dmg; dmg = 0; }
      else { dmg -= this.shieldHp; this.shieldHp = 0; this.shieldTimer = 0; }
      if (this.shieldHits > 0 && --this.shieldHits <= 0) { this.shieldHp = 0; this.shieldTimer = 0; }
      if (this.shieldHp <= 0) this.shieldHits = 0;
    }
    if (dmg > 0 && game.chipActive("capacitor") && this.overcharge > 0) {
      const block = Math.min(dmg, CONFIG.chips.capacitor.block);
      dmg -= block; this.overcharge--; blocked = true;
      game.spawnShieldHitSpark(this.x, this.y);
      game.floats.push(new FloatText(this.x, this.y - 46, "电容格挡 -" + Math.round(block), CONFIG.chips.capacitor.color));
    }
    const hpBefore = this.hp;
    if (dmg > 0) this.hp -= dmg;
    if (dmg > 0) game.tryLastStand(this);
    const hpLoss = Math.max(0, Math.min(hpBefore, hpBefore - this.hp));
    game.recordEndlessDamage(hpLoss, blocked);
    if (hpLoss > 0) game.triggerPainConverter(this, hpLoss);
    if (blocked) game.triggerReactiveArmor(this);
    if (dmg > 0) game.tryEmergencyBarrier(this);
    game.onPlayerHit(blocked);
    this.invulnTimer = this.invulnAmount; Sound.hit(); Haptics.hit(); game.addShake(4, 0.12); if (CONFIG.combo.resetOnHit) game.breakCombo();
  }
  // GG12:无尽后期成长钩子——敌机血量 5 分钟后指数膨胀,固定 +1/+0.25 的溢出转化很快沦为杯水车薪,
  //   改成 5 分钟起每 5 分钟翻一倍(与 dmgDoubleInterval 的敌方成长曲线同步),让非 morph 机型后期也有得刮
  overflowStepMult() {
    if (!game.endless) return 1;
    const rampT = CONFIG.endless.dmgRampTime || 300;
    return game._endlessT < rampT ? 1 : Math.pow(2, 1 + Math.floor((game._endlessT - rampT) / (CONFIG.endless.dmgDoubleInterval || 300)));
  }
  addPower() {
    if (this.power < CONFIG.player.maxPower) this.power++;
    else { this.overcharge = clamp(this.overcharge + 1, 0, CONFIG.player.maxOvercharge); this.powerDamage += (CONFIG.overflow.powerDamageStep || 1) * this.overflowStepMult(); }
  }
  addBomb()    { this.bombs = clamp(this.bombs + 1, 0, CONFIG.player.maxBombs); }
  addWing()    { if (this.wings < CONFIG.wingMax) this.wings++; else this.wingDamage += (CONFIG.overflow.wingDamageStep || 0.25) * this.overflowStepMult(); }
  addEnergy(n) { this.energy = clamp(this.energy + n * (this.ship.energyMult || 1) * (1 + game.gearValue("powerCore")), 0, 100); }   // RG:机装-动力核心
  heal(n)      { this.hp = clamp(this.hp + n, 0, this.maxHp); }
  applySlow(mult, dur) {
    this.slowMult = Math.min(this.slowTimer > 0 ? this.slowMult : 1, mult || 1);
    this.slowTimer = Math.max(this.slowTimer || 0, dur || 0);
  }
  grantShield(n, dur) {
    this.shieldHp = Math.max(this.shieldHp, n);
    this.shieldMax = Math.max(this.shieldMax, n);
    this.shieldTimer = Math.max(this.shieldTimer, dur);
    this.shieldHits = 0;
    game.spawnShockwave(this.x, this.y, this.radius * 2.2, "#74c0fc");
  }
  // X4:原来的机身绘制拆成 _drawBody,供隐身态(稳定半透明)和正常态共用,避免复制一遍
  _drawBody(ctx) {
    const x = this.x, y = this.y;
    // 僚机(带小尾焰;可在设置里隐藏,世界坐标下绘制,不随机身缩放)
    if (!Settings.data.hideWings) for (let i = 0; i < this.wings; i++) {
      const wx = x + wingOffsetX(i), wy = y + 6;
      ctx.fillStyle = "#ffa94d"; ctx.fillRect(wx - 1.5, wy + 6, 3, 4 + Math.random() * 3);
      if (ImageAssets.draw(ctx, ImageAssets.wingman(this.ship.key), wx, wy, 34)) continue;
      ctx.fillStyle = "#ced4da"; ctx.beginPath(); ctx.moveTo(wx, wy - 9); ctx.lineTo(wx - 7, wy + 7); ctx.lineTo(wx + 7, wy + 7); ctx.closePath(); ctx.fill();
    }
    // 主引擎尾焰(闪烁)
    const fl = 11 + Math.sin(game.titleT * 28) * 4;
    ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.moveTo(x - 5, y + 11); ctx.lineTo(x + 5, y + 11); ctx.lineTo(x, y + 11 + fl); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ff922b"; ctx.beginPath(); ctx.moveTo(x - 3, y + 11); ctx.lineTo(x + 3, y + 11); ctx.lineTo(x, y + 11 + fl * 0.6); ctx.closePath(); ctx.fill();
    // MO4:形态切换的"相位重组"残影——画在实际机身之前,让新形态的机身从一圈发光残影里"收缩成形"
    if (this._morphTransT > 0) this._drawMorphTransition(ctx);
    // MO6:大炮开火后坐力——机身沿 sin 曲线顿挫下沉再弹回(0.1s),只偏移剪影本身,尾焰/僚机仍锚在原位,做出"单发有分量"的手感
    const recoilY = this._recoilT > 0 ? Math.sin(clamp(1 - this._recoilT / 0.1, 0, 1) * Math.PI) * 4 : 0;
    if (recoilY) { ctx.save(); ctx.translate(0, recoilY); }
    // X:机身按 ship.bodyShape 分派专属剪影,整体按 radiusMult 缩放;MO:双形态机按当前形态换机身图
    drawShipBody(ctx, x, y, this.ship, this.cannonMode ? "cannon" : null);
    if (this.cannonMode) this._drawCannonChargeArc(ctx);
    if (recoilY) ctx.restore();
  }
  // MO4:切换形态瞬间——机身外先炸一下白光,随后一圈青色残影从 1.4 倍缩到 1 倍并淡出,呼应"曜迁"(相位重组)而不是硬切图
  _drawMorphTransition(ctx) {
    const dur = 0.25, t = clamp(1 - this._morphTransT / dur, 0, 1), x = this.x, y = this.y;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // 白光爆闪,只在最初几帧明显(三次方衰减)
    ctx.globalAlpha = Math.pow(1 - t, 3) * 0.75;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x, y, this.radius * 1.5, 0, Math.PI * 2); ctx.fill();
    // 缩放残影——1.4 倍缩到 1 倍,新形态机身在残影里"收缩成形"
    ctx.globalAlpha = (1 - t) * 0.55;
    const scale = 1.4 - 0.4 * t;
    ctx.translate(x, y); ctx.scale(scale, scale); ctx.translate(-x, -y);
    drawShipBody(ctx, x, y, this.ship, this.cannonMode ? "cannon" : null);
    ctx.restore();
  }
  // MO3:大炮形态充能弧——机身下方一圈从 12 点方向顺时针推进的细弧,填满即代表下一发炮弹已就绪,
  //   缓解"攻速降到10%"带来的等待感,让玩家能预判开火时机而不是干等
  _drawCannonChargeArc(ctx) {
    const x = this.x, y = this.y, r = this.radius + 10, total = this._fireIntervalCur || 1;
    const ratio = clamp(1 - this._fireTimer / total, 0, 1), ready = ratio >= 0.999;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    const start = -Math.PI / 2, end = start + Math.PI * 2 * ratio;
    ctx.strokeStyle = ready ? "#ffd43b" : this.ship.color; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.globalAlpha = ready ? 0.75 + Math.sin(game.titleT * 10) * 0.25 : 0.85;
    ctx.beginPath(); ctx.arc(x, y, r, start, end); ctx.stroke();
    ctx.restore();
  }
  // X4:护盾(防御型必杀)——玻璃质感能量泡:径向渐变(边缘亮/中心透)+ 顶部高光弧(立体感)+ 六边形纹理(科技感)+ 随盾量衰减
  _drawShield(ctx) {
    const x = this.x, y = this.y, r = this.radius + 14, ratio = clamp(this.shieldHp / (this.shieldMax || 1), 0, 1);
    const pulse = 0.85 + Math.sin(game.titleT * 4) * 0.15;
    ctx.save(); ctx.globalAlpha = (0.35 + ratio * 0.35) * pulse;
    const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
    g.addColorStop(0, "rgba(120,220,255,.05)"); g.addColorStop(0.75, "rgba(80,180,255,.16)"); g.addColorStop(1, "rgba(150,230,255,.55)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // 六边形纹理线,营造"能量护盾"的科技质感,而不是一片纯色泡泡
    ctx.strokeStyle = "rgba(200,240,255,.25)"; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + game.titleT * 0.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
    // 外缘亮环
    ctx.strokeStyle = "rgba(210,245,255,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    // 顶部高光弧——模拟球面反光,是"立体感"和"真实透明感"的关键笔触
    ctx.globalAlpha *= 0.8; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(x, y, r - 4, Math.PI * 1.15, Math.PI * 1.55); ctx.stroke();
    ctx.restore();
  }
  // X6:相位护盾"待命中"常驻标识——虚线描边圈+缓慢脉动,和防御型那个实心玻璃泡泡(_drawShield)视觉上明显区分,
  //   不看浮字/听音效也能一眼确认自己现在有没有这层盾,免得忘了带盾贴脸拼刀
  _drawMorphShieldReady(ctx) {
    const x = this.x, y = this.y, r = this.radius + 9, pulse = 0.55 + Math.sin(game.titleT * 5) * 0.35;
    ctx.save(); ctx.globalAlpha = 0.5 + pulse * 0.3; ctx.strokeStyle = "#66d9e8"; ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // X4:隐身(侦查型必杀)光晕——比护盾更冷、更"虚化",两条错相位的青色描边圈缓慢扩散淡出,呼应"隐匿"而非"防护"
  _drawStealthShimmer(ctx) {
    const x = this.x, y = this.y;
    ctx.save(); ctx.strokeStyle = "rgba(153,233,242,.5)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { const ph = (game.titleT * 1.4 + i * 0.5) % 1, rr = this.radius + 6 + ph * 22; ctx.globalAlpha = (1 - ph) * 0.5; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  draw(ctx) {
    // RV2:复活护盾光环——独立于下面的受击闪烁逻辑先画,不会被"无敌期间机身每隔几帧闪一下消失"的效果连带闪没,
    //   让"我刚刚复活、还在保护期"这件事任何一帧都看得见,不用靠猜闪烁节奏
    if (this._reviveShieldT > 0) this._drawReviveShield(ctx);
    if (this.stealthTimer > 0) {   // X4:稳定半透明,而不是像普通受击无敌那样快速闪烁——两者要能一眼区分开
      // X8:隐身最后 1 秒机身透明度开始闪烁,提示"马上要现形了",别站在弹幕堆里等着暴毙
      const ending = this.stealthTimer < 1;
      ctx.save(); ctx.globalAlpha = ending ? 0.4 + Math.abs(Math.sin(game.titleT * 14)) * 0.45 : 0.4;
      this._drawBody(ctx); ctx.restore();
      this._drawStealthShimmer(ctx);
      return;
    }
    if (this.invulnTimer > 0 && (Math.floor(this.invulnTimer * 20) % 2 === 0)) return;
    this._drawBody(ctx);
    if (this.shieldHp > 0) this._drawShield(ctx);
    if (this.morphShieldUp) this._drawMorphShieldReady(ctx);
  }
  // RV2:护盾光环——常亮描边圈 + 轻微呼吸感的透明度脉动,最后 1 秒(_reviveShieldT<1)线性淡出提示"保护即将结束"
  _drawReviveShield(ctx) {
    const fade = clamp(this._reviveShieldT, 0, 1);
    const pulse = 0.75 + Math.abs(Math.sin(game.titleT * 10)) * 0.25;
    ctx.save();
    ctx.globalAlpha = 0.55 * fade * pulse;
    ctx.strokeStyle = "#66d9e8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}
// X:机型专属机身剪影(delta 平衡/twin 攻击/bulk 防御/dart 侦查),按 ship.radiusMult 整体缩放
// QQ:机翼/机身/座舱全部改渐变(取代纯色)+ 机翼加柔和投影,做出立体感;原始剪影坐标完全不变。
function drawShipBody(ctx, x, y, ship, variant = null) {
  const col = ship.color, s = ship.radiusMult || 1, shape = ship.bodyShape || "delta";
  // MO:双形态机在大炮形态下换用专属机身图("morph-cannon");找不到形态图时退回普通形态图,再不行才是矢量剪影
  const img = (variant === "cannon" && ship.morph ? ImageAssets.player(ship.key + "-cannon") : null) || ImageAssets.player(ship.key);
  if (ImageAssets.draw(ctx, img, x, y, 64 * s)) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const wingGrad = ctx.createLinearGradient(0, -4, 0, 16);
  wingGrad.addColorStop(0, "#3d4f70"); wingGrad.addColorStop(1, "#161d2b");
  const bodyGrad = ctx.createLinearGradient(-10, -20, 10, 14);
  bodyGrad.addColorStop(0, UI.shade(col, 0.42)); bodyGrad.addColorStop(0.55, col); bodyGrad.addColorStop(1, UI.shade(col, -0.35));
  const armorGrad = ctx.createLinearGradient(0, 3, 0, 13);
  armorGrad.addColorStop(0, "#5c6572"); armorGrad.addColorStop(1, "#33383f");
  const cockpitGrad = ctx.createRadialGradient(-1, -6.5, 0.4, 0, -4, 6);
  cockpitGrad.addColorStop(0, "#ffffff"); cockpitGrad.addColorStop(0.55, "#bde3ff"); cockpitGrad.addColorStop(1, "#3b7dc4");

  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 7; ctx.shadowOffsetY = 4; ctx.fillStyle = wingGrad;
  if (shape === "twin") { ctx.fillRect(-17, 6, 9, 8); ctx.fillRect(8, 6, 9, 8); }
  else if (shape === "bulk") { ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(0, 2); ctx.lineTo(20, 12); ctx.lineTo(12, 16); ctx.lineTo(-12, 16); ctx.closePath(); ctx.fill(); }
  else if (shape === "dart") { ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(0, 3); ctx.lineTo(11, 8); ctx.lineTo(6, 10); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(-16, 10); ctx.lineTo(0, 1); ctx.lineTo(16, 10); ctx.lineTo(9, 14); ctx.lineTo(-9, 14); ctx.closePath(); ctx.fill(); }
  ctx.restore();   // 阴影只加机翼这一层,不然多层叠加显脏

  if (shape === "bulk") { ctx.fillStyle = armorGrad; ctx.fillRect(-14, 3, 6, 10); ctx.fillRect(8, 3, 6, 10); }

  ctx.fillStyle = bodyGrad;
  if (shape === "twin") { ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-6, 12); ctx.lineTo(6, 12); ctx.closePath(); ctx.fill(); }
  else if (shape === "bulk") { ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-10, 12); ctx.lineTo(10, 12); ctx.closePath(); ctx.fill(); }
  else if (shape === "dart") { ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-5, 9); ctx.lineTo(5, 9); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-8, 11); ctx.lineTo(8, 11); ctx.closePath(); ctx.fill(); }

  ctx.fillStyle = "rgba(255,255,255,.4)";
  if (shape === "twin") { ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-2, 6); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill(); }
  else if (shape === "dart") { ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-2, 5); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); }
  else if (shape !== "bulk") { ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-3, 6); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill(); }

  ctx.fillStyle = cockpitGrad; ctx.beginPath(); ctx.ellipse(0, -4, 3.2, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// DD:constructor 委托给 init(),配合下面的 Pool 复用实例(无尽模式长时间跑,减少高频 new 的 GC 压力)
class PlayerBullet {
  constructor(x, y, vx, vy, source = "main") { this.init(x, y, vx, vy, source); }
  init(x, y, vx, vy, source = "main") {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.source = source; this.radius = CONFIG.bullet.radius; this.pierce = game.bonusValue("pierce", "pierce"); this.hitEnemies = new Set(); this.dead = false;
    // MO:大炮形态能量炮弹——大范围弹道判定 + 无限贯穿(靠 hitEnemies 去重保证每架敌机只结算一次)
    if (source === "cannon") { const m = game.player && game.player.ship.morph; this.radius = m && m.bulletRadius || 15; this.pierce = 9999; }
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; if (this.y < -30 || this.x < -30 || this.x > CONFIG.WIDTH + 30) this.dead = true; }
  // QQ:纯色改渐变(弹头亮白、弹尾橙),做出"能量弹"质感;不用 shadowBlur(子弹多,省性能)
  draw(ctx) {
    if (this.source === "cannon") {   // MO2:高速轨道炮弹重做——旋转六边形护罩 + 拉长双色拖影 + 穿甲弹头高光,配合提速后的速度感做出"未来科技轨道炮"质感
      const r = this.radius, x = this.x, y = this.y, flick = Math.sin(game.titleT * 34 + x) * 3;
      const tailLen = r * 4.4;   // 提速后尾焰相应拉长,强化高速感
      const tail = ctx.createLinearGradient(x, y + r * 0.3, x, y + tailLen + flick);
      tail.addColorStop(0, "rgba(153,233,242,.9)"); tail.addColorStop(0.4, "rgba(102,217,232,.5)"); tail.addColorStop(0.75, "rgba(132,94,247,.28)"); tail.addColorStop(1, "rgba(132,94,247,0)");
      ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y + r * 0.25); ctx.lineTo(x + r * 0.4, y + r * 0.25); ctx.lineTo(x, y + tailLen + flick); ctx.closePath(); ctx.fill();
      // 两道细拖影线,做出"轨道炮能量轨迹"的速度线感
      ctx.strokeStyle = "rgba(190,246,255,.55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - r * 0.85, y); ctx.lineTo(x - r * 0.3, y + tailLen * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + r * 0.85, y); ctx.lineTo(x + r * 0.3, y + tailLen * 0.7); ctx.stroke();
      // 旋转六边形能量护罩,和弹体色系呼应,营造"能量约束场"的科技感
      ctx.save(); ctx.translate(x, y); ctx.rotate(game.titleT * 6);
      ctx.strokeStyle = "rgba(132,94,247,.65)"; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, px = Math.cos(a) * r * 1.35, py = Math.sin(a) * r * 1.1; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      // 弹体核心:白热→青→紫的能量椭圆,前端加尖锐高光模拟穿甲弹头
      const body = ctx.createRadialGradient(x, y - r * 0.35, r * 0.1, x, y, r);
      body.addColorStop(0, "#fff"); body.addColorStop(0.4, "#99e9f2"); body.addColorStop(0.75, "#845ef7"); body.addColorStop(1, "rgba(132,94,247,.2)");
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x, y, r * 0.68, r * 1.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(220,250,255,.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, r * 0.68, r * 1.05, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x, y - r * 1.1); ctx.lineTo(x - r * 0.22, y - r * 0.55); ctx.lineTo(x + r * 0.22, y - r * 0.55); ctx.closePath(); ctx.fill();
      return;
    }
    const g = ctx.createLinearGradient(this.x, this.y - 8, this.x, this.y + 4);
    g.addColorStop(0, "#fff9db"); g.addColorStop(1, "#ffa94d");
    ctx.fillStyle = g; ctx.fillRect(this.x - 2, this.y - 8, 4, 12);
  }
}

class EnemyBullet {
  constructor(x, y, vx, vy, damage, opts = null) { this.init(x, y, vx, vy, damage, opts); }
  init(x, y, vx, vy, damage, opts = null) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.damage = damage; this.kind = opts && opts.kind || ""; this.radius = opts && opts.radius || CONFIG.enemyBullet.radius; this.dead = false;
    this.triggerRadius = opts && opts.triggerRadius || 0; this.fuse = opts && opts.fuse || 0; this.ringCount = opts && opts.ringCount || 0; this.ringSpeed = opts && opts.ringSpeed || 0; this.ringDamage = opts && opts.ringDamage || damage; this._armed = false;
    this.life = opts && opts.life || 0; this.maxLife = this.life; this.speed = opts && opts.speed || Math.hypot(vx, vy); this.turn = opts && opts.turn || 0; this.color = opts && opts.color || "";
    this.slowMult = opts && opts.slowMult || 1; this.slowDur = opts && opts.slowDur || 0; this.tick = opts && opts.tick || 0.7; this._tickT = 0;
  }
  update(dt) {
    // X5:隐身期间已发射的追踪弹也不再修正朝向(保持当前速度直飞),不然玩家隐身了追踪弹还在贴脸拐弯很违和
    if (this.kind === "homing" && game.player && !game.stealthActive()) {
      const a = Math.atan2(game.player.y - this.y, game.player.x - this.x), sp = this.speed || Math.hypot(this.vx, this.vy);
      const k = clamp((this.turn || 0) * dt, 0, 1);
      this.vx += (Math.cos(a) * sp - this.vx) * k;
      this.vy += (Math.sin(a) * sp - this.vy) * k;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.kind === "mine" && game.player) {
      const dx = game.player.x - this.x, dy = game.player.y - this.y;
      if (!this._armed && dx * dx + dy * dy <= this.triggerRadius * this.triggerRadius) this._armed = true;
      if (this._armed) {
        this.fuse -= dt;
        if (this.fuse <= 0) { game.fireRing(this.x, this.y, this.ringCount || 8, this.ringSpeed || 170, this.ringDamage || this.damage); game.spawnShockwave(this.x, this.y, this.triggerRadius || 70, "#ff922b"); this.dead = true; }
      }
    }
    if ((this.kind === "fire" || this.kind === "ice") && game.player) {
      this.life -= dt;
      if (hit(this, game.player)) {
        this._tickT -= dt;
        if (this.kind === "ice" && game.player.applySlow) game.player.applySlow(this.slowMult || 0.6, this.slowDur || 1);
        if (this._tickT <= 0) { game.player.takeDamage(this.damage); this._tickT = this.tick || 0.7; }
      }
      if (this.life <= 0) this.dead = true;
      return;
    }
    if (this.life > 0) { this.life -= dt; if (this.life <= 0) this.dead = true; }
    if (this.y > CONFIG.HEIGHT + 20 || this.y < -20 || this.x < -20 || this.x > CONFIG.WIDTH + 20) this.dead = true;
  }
  // QQ:双色平涂改一个径向渐变(白热核心→暗红边缘),一次 fill 顺带比原来两次 fill 还省一点
  draw(ctx) {
    if (this.kind === "mine") {
      if (this._armed) {
        ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(game.titleT * 18) ** 2;
        ImageAssets.draw(ctx, ImageAssets.effect("mineWarningPulse"), this.x, this.y, (this.triggerRadius || this.radius * 3.5) * 2);
        ctx.restore();
      }
      const mineImg = ImageAssets.effect(this._armed ? "mineArmed" : "floatingMine");
      if (ImageAssets.draw(ctx, mineImg, this.x, this.y, this.radius * 2.9)) return;
      ctx.save(); ctx.globalAlpha = this._armed ? 0.75 + 0.25 * Math.sin(game.titleT * 24) ** 2 : 0.85;
      ctx.fillStyle = this._armed ? "#ffd43b" : "#ff922b"; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#212529"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.x - this.radius * 0.55, this.y); ctx.lineTo(this.x + this.radius * 0.55, this.y); ctx.moveTo(this.x, this.y - this.radius * 0.55); ctx.lineTo(this.x, this.y + this.radius * 0.55); ctx.stroke();
      ctx.restore(); return;
    }
    if (this.kind === "fire" || this.kind === "ice") {
      const fire = this.kind === "fire", a = this.maxLife ? clamp(this.life / this.maxLife, 0, 1) : 1;
      ctx.save(); ctx.globalAlpha = 0.38 + a * 0.35;
      if (ImageAssets.draw(ctx, ImageAssets.effect(fire ? "fireZone" : "iceZone"), this.x, this.y, this.radius * 2.65)) { ctx.restore(); return; }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.18 + a * 0.34;
      const g = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.radius);
      g.addColorStop(0, fire ? "rgba(255,236,153,.9)" : "rgba(255,255,255,.85)");
      g.addColorStop(0.45, fire ? "rgba(255,146,43,.55)" : "rgba(116,192,252,.52)");
      g.addColorStop(1, fire ? "rgba(224,49,49,0)" : "rgba(34,211,238,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(game.titleT * 8) ** 2; ctx.strokeStyle = fire ? "#ff922b" : "#74c0fc"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (0.86 + 0.08 * Math.sin(game.titleT * 5)), 0, Math.PI * 2); ctx.stroke();
      ctx.restore(); return;
    }
    if (this.kind === "homing") {
      const a = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(a + Math.PI / 2);
      const trail = ctx.createLinearGradient(0, -8, 0, 22);
      trail.addColorStop(0, "#fff9db"); trail.addColorStop(0.45, "#ffd43b"); trail.addColorStop(1, "rgba(255,212,59,0)");
      ctx.fillStyle = trail; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-5, 5); ctx.lineTo(0, 22); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    const g = ctx.createRadialGradient(this.x - 1, this.y - 1, 0.5, this.x, this.y, this.radius);
    g.addColorStop(0, "#fff"); g.addColorStop(0.4, "#ff8787"); g.addColorStop(1, "#c92a2a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
  }
}

class HomingShot {
  constructor(x, y, overcharge = 0) { this.init(x, y, overcharge); }
  init(x, y, overcharge = 0) {
    const s = CONFIG.secondary;
    this.x = x; this.y = y; this.overcharge = overcharge; this.radius = s.homingRadius;
    this.speed = s.homingSpeed + overcharge * 28; this.turn = s.homingTurn + overcharge * 0.55 + game.shipWeaponValue("homingTurnBonus", 0); this.damage = (s.homingDamage + Math.floor(overcharge / 2) + game.chipValue("homingSwarm", "damageBonus", 0) + game.shipWeaponValue("homingDamageBonus", 0) + game.bonusValue("swarmCore", "homingDamage")) * (1 + game.gearValue("hardpoint"));   // RG:机装-武装挂架
    this.targetRange = game.chipValue("homingSwarm", "targetRange", 300) * game.rangeMult() * (1 + game.bonusValue("swarmCore", "targetRangeMult"));
    this.vx = 0; this.vy = -this.speed; this.dead = false; this.life = 2.6;
  }
  update(dt) {
    const jam = game.jamFactor(this.x, this.y);
    const target = game.nearestEnemy(this.x, this.y, this.targetRange / jam);
    if (target) {
      const a = Math.atan2(target.y - this.y, target.x - this.x);
      const tx = Math.cos(a) * this.speed, ty = Math.sin(a) * this.speed;
      const k = clamp((this.turn / jam) * dt, 0, 1);
      this.vx += (tx - this.vx) * k; this.vy += (ty - this.vy) * k;
    }
    this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
    if (this.life <= 0 || this.y < -30 || this.x < -30 || this.x > CONFIG.WIDTH + 30) this.dead = true;
  }
  draw(ctx) {
    const a = Math.atan2(this.vy, this.vx), tail = 18 + this.overcharge * 2;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(a + Math.PI / 2);
    const g = ctx.createLinearGradient(0, -10, 0, tail);
    g.addColorStop(0, "#fff"); g.addColorStop(0.35, "#74c0fc"); g.addColorStop(1, "rgba(116,192,252,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-5, 4); ctx.lineTo(0, tail); ctx.lineTo(5, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

class Missile {
  constructor(x, y, overcharge = 0) { this.init(x, y, overcharge); }
  init(x, y, overcharge = 0) {
    const s = CONFIG.secondary;
    this.x = x; this.y = y; this.overcharge = overcharge; this.radius = 8;
    this.speed = s.missileSpeed + overcharge * 18; this.turn = s.missileTurn + overcharge * 0.25; this.damage = (s.missileDamage + overcharge + game.chipValue("missileBarrage", "damageBonus", 0) + game.shipWeaponValue("missileDamageBonus", 0) + game.bonusValue("explosivePayload", "missileDamage") + game.routeBonus("导弹", 3)) * (1 + game.gearValue("hardpoint"));   // RG:机装-武装挂架
    this.splash = (s.missileSplash + overcharge * 5) * game.chipValue("missileBarrage", "splashMult", 1) * game.shipWeaponValue("missileSplashMult", 1) * (1 + game.bonusValue("explosivePayload", "splashMult") + game.routeBonus("导弹", 0.18)); this.vx = 0; this.vy = -this.speed; this.dead = false; this.life = 3.5 * game.rangeMult();
  }
  update(dt) {
    const jam = game.jamFactor(this.x, this.y);
    const target = game.nearestEnemy(this.x, this.y, 360 * game.rangeMult() / jam);
    if (target) {
      const a = Math.atan2(target.y - this.y, target.x - this.x);
      const tx = Math.cos(a) * this.speed, ty = Math.sin(a) * this.speed;
      const k = clamp((this.turn / jam) * dt, 0, 1);
      this.vx += (tx - this.vx) * k; this.vy += (ty - this.vy) * k;
    }
    this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
    if (this.life <= 0 || this.y < -40 || this.x < -40 || this.x > CONFIG.WIDTH + 40) this.dead = true;
  }
  draw(ctx) {
    const a = Math.atan2(this.vy, this.vx);
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(a + Math.PI / 2);
    const trail = ctx.createLinearGradient(0, 6, 0, 28);
    trail.addColorStop(0, "rgba(255,146,43,.9)"); trail.addColorStop(1, "rgba(255,146,43,0)");
    ctx.fillStyle = trail; ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(0, 30); ctx.lineTo(4, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ced4da"; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-6, 8); ctx.lineTo(6, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ff6b6b"; ctx.fillRect(-3, 2, 6, 6);
    ctx.restore();
  }
}

class PlayerLaser {
  constructor(x, y, overcharge = 0, damageMult = 1, widthMult = 1) { this.init(x, y, overcharge, damageMult, widthMult); }
  init(x, y, overcharge = 0, damageMult = 1, widthMult = 1) {
    const s = CONFIG.secondary;
    this.x = x; this.y = y; this.overcharge = overcharge; this.width = s.laserWidth + overcharge * 3;
    this.damage = (s.laserDamage + Math.floor(overcharge / 2) + ((game.player && game.player.powerDamage) || 0) + game.shipWeaponValue("laserDamageBonus", 0) + game.bonusValue("laserLens", "laserDamage") + game.laserDamageBonus()) * (1 + game.gearValue("hardpoint")); this.life = (s.laserDuration + overcharge * 0.01 + game.bonusValue("laserLens", "laserDuration")) * game.rangeMult() * game.laserDurationMult();   // RG:机装-武装挂架
    this.width *= Math.max(0.52, 1 - game.bonusValue("laserLens", "laserWidthShrink"));
    if (game.chipActive("laserFocus")) {
      const c = CONFIG.chips.laserFocus;
      this.width *= c.laserWidthMult; this.damage += c.laserDamageBonus; this.life += c.laserDurationBonus;
    }
    this.damage *= damageMult; this.width *= widthMult;
    this.maxLife = this.life; this.dead = false; this.hitEnemies = new Set();
  }
  update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
  draw(ctx) {
    const a = clamp(this.life / this.maxLife, 0, 1), half = this.width / 2;
    ctx.save(); ctx.globalAlpha = a;
    const glow = ctx.createLinearGradient(this.x - half * 2, 0, this.x + half * 2, 0);
    glow.addColorStop(0, "rgba(77,171,247,0)"); glow.addColorStop(0.5, "rgba(116,192,252,.5)"); glow.addColorStop(1, "rgba(77,171,247,0)");
    ctx.fillStyle = glow; ctx.fillRect(this.x - half * 2, 0, half * 4, this.y);
    ctx.fillStyle = "#fff"; ctx.fillRect(this.x - Math.max(2, half * 0.22), 0, Math.max(4, half * 0.44), this.y);
    ctx.restore();
  }
}

class Enemy {
  constructor(type, x, yOffset = 0, move = "straight", elite = null) { this.init(type, x, yOffset, move, elite); }
  init(type, x, yOffset = 0, move = "straight", elite = null) {
    const t = CONFIG.enemy[type], chosenMove = t.move && (!move || move === "straight") ? t.move : (move || "straight");
    const diff = game.activeEndlessDiff();
    this.type = type; this.isBoss = false; this.x = x; this.y = t.fromBottom ? CONFIG.HEIGHT + t.radius + yOffset : -t.radius - yOffset;
    this.baseX = x; this.baseY = this.y; this.radius = t.radius; this.hp = t.hp; this.speed = t.speed * diff.enemySpeedMult; this.score = t.score; this.color = t.color; this.cfg = t;
    this._fireTimer = 0.6 + game.rng() * 0.6; this.dead = false; this._endlessSpawnT = game.endless ? game._endlessT : null;
    this.elite = elite || this.rollElite(); this.eliteCfg = this.elite ? CONFIG.elite[this.elite] : null;
    const hpMult = game.endless ? game.endlessEnemyHpMult() : 1;
    this.eliteShieldMax = 0; this.eliteShield = 0; this._eliteCd = 1.2 + game.rng(); this._eliteWarn = 0;
    if (game.endless) this.hp = Math.max(1, Math.round(this.hp * hpMult * diff.enemyHpMult), game.endlessEnemyHpFloor());
    if (this.eliteCfg) { this.hp = Math.round(this.hp * (this.eliteCfg.hpMult || 1)); this.score = Math.round(this.score * (this.eliteCfg.scoreMult || 1)); }
    if (game.endless) this.hp = Math.max(this.hp, game.endlessEnemyHpFloor());
    if (this.eliteCfg && this.eliteCfg.speedMult) this.speed *= this.eliteCfg.speedMult;
    this.eliteShieldMax = Math.round((t.shield || 0) * hpMult * diff.enemyHpMult) + (this.eliteCfg && this.eliteCfg.shield ? this.eliteCfg.shield : 0);
    this.eliteShield = this.eliteShieldMax;
    this.maxHp = this.hp;
    // 运动状态
    this.move = chosenMove; this.mp = CONFIG.moves[chosenMove] || {}; this._mt = 0; this._entered = false;
    this.phase = "in"; this._ht = 0; this._aimed = false; this.vx = 0; this.vy = 0; this._flash = 0;
    this._carrierSpawn = 0;   // W2:carrier 裂解出的僚机短暂带一圈紫色识别环,归零后就是普通敌机(池复用要清零,不然会带着上一轮的状态)
    this._cannonHits = 0;     // MO:吃了几发大炮炮弹(每5发追加巨额暴击);池复用必须清零
    this._kbT = 0; this._kbVX = 0; this._kbVY = 0;   // MO6:爆震波击退——衰减式推力,池复用必须清零(见 game.updateMorphBlasts / Enemy.update)
    this._sniperWarn = 0; this._sniperAim = 0;
    this._supportTimer = (t.repairInterval || 0) * (0.45 + game.rng() * 0.25); this._supportPulse = 0; this._armorPierceFx = 0;
    this._beaconTimer = (t.markInterval || 0) * (0.45 + game.rng() * 0.35); this._beaconWarn = 0; this._beaconX = 0;
    this._mineTimer = (t.mineInterval || 0) * (0.55 + game.rng() * 0.35);
    this._phaseTimer = (t.blinkInterval || 0) * (0.45 + game.rng() * 0.35); this._phaseWarn = 0; this._phaseTargetX = 0;
    this._homingSkillTimer = (t.homingInterval || 0) * (0.5 + game.rng() * 0.35); this._zoneTimer = (t.zoneInterval || 0) * (0.5 + game.rng() * 0.35);
    this._reflectCd = 0; this.guardShield = 0; this.guardedBy = null; this._wardenPulse = 0; this._stolenKind = ""; this._escapeTimer = 0;
  }
  rollElite() {
    if (this.type === "small" || !game.player) return null;
    const e = CONFIG.elite;
    let chance = game.currentLevel >= e.minLevel ? e.baseChance + game.currentLevel * e.levelChance : 0;
    if (game.endless) chance = e.endlessChance + game.threatLevel() * e.threatChance + Math.min(game._endlessT / 900, 0.08);
    if (game.rng() > Math.min(chance, e.maxChance)) return null;
    return game.pick(e.types || ["shield", "charger"]);
  }
  applyMove(dt) {
    const W = CONFIG.WIDTH, m = this.mp;
    if (this.type === "harvester") {
      if (this._escapeTimer > 0) { this._escapeTimer -= dt; this.y -= (this.cfg.escapeSpeed || 220) * dt; return; }
      const p = game.nearestPowerup(this.x, this.y, this.cfg.stealRadius || 180);
      if (p) {
        const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy), sp = this.speed * 1.25;
        if (d < this.radius + p.radius + 4) game.stealPowerupFor(this, p);
        else if (d > 1) { this.x = clamp(this.x + dx / d * sp * dt, this.radius, W - this.radius); this.y += dy / d * sp * dt; }
        return;
      }
    }
    if (this.move === "sine") {
      this.y += this.speed * dt;
      this.x = clamp(this.baseX + Math.sin(this._mt * m.freq) * m.amp, this.radius, W - this.radius);
    } else if (this.move === "zigzag") {
      this.y += this.speed * dt;
      const ph = (this._mt % m.period) / m.period, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;   // 三角波 0→1→0
      this.x = clamp(this.baseX + (tri * 2 - 1) * m.amp, this.radius, W - this.radius);
    } else if (this.move === "swoop") {
      if (this.phase === "in") { this.y += this.speed * dt; if (this.y >= m.holdY) this.phase = "hold"; }
      else if (this.phase === "hold") { this._ht += dt; this.x += Math.sin(this._mt * 4) * 60 * dt; if (this._ht >= m.hold) { this.phase = "dive"; this.vy = this.speed * m.diveVy; this.vx = clamp((game.player ? game.player.x - this.x : 0), -120, 120); } }
      else { this.x += this.vx * dt; this.y += this.vy * dt; }
    } else if (this.move === "dive") {
      // X5:隐身期间不获取瞄准——已经俯冲的继续飞完既定路线,还没锁定的就一直保持直线下落,等隐身结束再择机锁定
      if (!this._aimed) { this.y += this.speed * dt; if (this.y > CONFIG.HEIGHT * m.triggerY && game.player && !game.stealthActive()) { const a = Math.atan2(game.player.y - this.y, game.player.x - this.x), sp = this.speed * m.speedMul; this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp; this._aimed = true; } }
      else { this.x += this.vx * dt; this.y += this.vy * dt; }
    } else if (this.move === "rearChase") {
      // X5:隐身期间停止追踪转向(tracking=false)——已有的速度矢量照常飞,只是不再朝玩家新位置修正
      const p = game.player || { x: this.x, y: -this.radius }, warn = m.warn || 2, track = m.track || m.boost || 2, phaseMul = this._mt < warn ? 0.7 : (this._mt < warn + (m.boost || 2) ? (m.boostMul || 1.8) : (m.speedMul || 1));
      const sp = this.speed * phaseMul, tracking = this._mt < warn + track && !game.stealthActive(), a = Math.atan2(p.y - this.y, p.x - this.x), turn = tracking ? clamp((m.turn || 4) * dt, 0, 1) : 0;
      if (!this.vx && !this.vy) { this.vx = 0; this.vy = -sp; }
      if (tracking) {
        this.vx += (Math.cos(a) * sp - this.vx) * turn;
        this.vy += (Math.sin(a) * sp - this.vy) * turn;
      } else {
        const d = Math.hypot(this.vx, this.vy) || 1;
        this.vx = this.vx / d * sp; this.vy = this.vy / d * sp;
      }
      this.x = clamp(this.x + this.vx * dt, -this.radius, W + this.radius);
      this.y += this.vy * dt;
    } else if (this.move === "orbit") {   // Z:绕基准点公转 + 缓慢下降
      this.baseY += this.speed * 0.5 * dt;
      this.x = clamp(this.baseX + Math.cos(this._mt * m.speed) * m.radius, this.radius, W - this.radius);
      this.y = this.baseY + Math.sin(this._mt * m.speed) * m.radius * 0.6;
    } else {
      this.y += this.speed * dt;   // straight
    }
  }
  // MO6:爆震波击退——衰减式推力,叠加在 applyMove 之后。sine/zigzag/orbit 类型每帧都会从 baseX 重新算 x,
  //   单纯推 x 下一帧就被吃回去,所以这几种额外把推力写回 baseX,让振荡中心跟着一起偏移才看得出效果。
  updateKnockback(dt) {
    if (this._kbT <= 0) return;
    const k = clamp(this._kbT / 0.35, 0, 1), dx = this._kbVX * k * dt, dy = this._kbVY * k * dt;
    this.x = clamp(this.x + dx, this.radius, CONFIG.WIDTH - this.radius);
    this.y += dy;
    if (this.move === "sine" || this.move === "zigzag" || this.move === "orbit") this.baseX = clamp(this.baseX + dx, this.radius, CONFIG.WIDTH - this.radius);
    this._kbT -= dt;
  }
  update(dt) {
    this._mt += dt;
    if (this._flash > 0) this._flash -= dt;
    if (this._carrierSpawn > 0) this._carrierSpawn -= dt;
    if (this._armorPierceFx > 0) this._armorPierceFx -= dt;
    this.applyMove(dt);
    this.updateKnockback(dt);
    this.updateElite(dt);
    this.updateSupport(dt);
    this.updateBeacon(dt);
    this.updateMineLayer(dt);
    this.updatePhaseWing(dt);
    this.updateHomingSkill(dt);
    this.updateZoneSkill(dt);
    this.updateWarden(dt);
    if (this._reflectCd > 0) this._reflectCd -= dt;
    if (this.y >= -this.radius && this.y <= CONFIG.HEIGHT + this.radius) this._entered = true;
    if (this._entered && (this.y > CONFIG.HEIGHT + this.radius || this.y < -this.radius - 80 || this.x < -70 || this.x > CONFIG.WIDTH + 70)) this.dead = true;
    // GG10:兜底清理——从未入屏却越走越远的敌机(如 fromBottom 类型误配下落系 move 一路往下飞)也要回收,
    //   否则永久占用 maxEnemies 名额,无尽模式几分钟后就刷不出新怪
    if (!this._entered && (this.y > CONFIG.HEIGHT + this.radius + 240 || this.y < -this.radius - 600 || this.x < -300 || this.x > CONFIG.WIDTH + 300)) this.dead = true;
    // X5:光学迷彩隐身期间整个开火块冻结(计时器不走)——不获取新瞄准也不触发新弹幕,隐身结束后从冻结的地方接着走,不会"追帧"爆发
    if (this.cfg.fireInterval > 0 && this.y > 0 && this.y < CONFIG.HEIGHT * 0.7 && game.player && !game.stealthActive()) {
      this._fireTimer -= dt;
      if (this.type === "sniper" && this._sniperWarn > 0) {
        this._sniperWarn -= dt;
        const fireMult = this.eliteCfg && this.eliteCfg.fireMult ? this.eliteCfg.fireMult : 1;
        if (this._sniperWarn <= 0) { this._fireTimer = this.cfg.fireInterval * game.activeDiff.fireMult * fireMult; game.fireFan(this.x, this.y, this._sniperAim, 22 * DEG, this.cfg.shots, this.cfg.bulletSpeed, this.cfg.damage); }
      } else if (this._fireTimer <= 0) {
        const aim = Math.atan2(game.player.y - this.y, game.player.x - this.x);
        const fireMult = this.eliteCfg && this.eliteCfg.fireMult ? this.eliteCfg.fireMult : 1;
        if (this.type === "sniper") { this._sniperAim = aim; this._sniperWarn = this.cfg.warn || 0.55; }
        else { this._fireTimer = this.cfg.fireInterval * game.activeDiff.fireMult * fireMult; game.fireFan(this.x, this.y, aim, 22 * DEG, this.cfg.shots, this.cfg.bulletSpeed, this.cfg.damage); }
      }
    }
  }
  updateElite(dt) {
    if (!this.eliteCfg || this.y <= 0 || this.y >= CONFIG.HEIGHT * 0.76) return;
    if (this.elite === "repair") {
      this._eliteCd -= dt;
      if (this._eliteCd > 0) return;
      this._eliteCd = this.eliteCfg.regenEvery || 2.6;
      if (this.hp >= this.maxHp) return;
      const before = this.hp, heal = Math.max(1, Math.round(this.maxHp * (this.eliteCfg.regenPct || 0.06)));
      this.hp = Math.min(this.maxHp, this.hp + heal);
      game.floats.push(new FloatText(this.x, this.y - this.radius - 18, "再生 +" + Math.round(this.hp - before), this.eliteCfg.color));
      return;
    }
    if (this.elite !== "charger" || !game.player || game.stealthActive()) return;   // X5:隐身期间冻结蓄力/开火
    if (this._eliteWarn > 0) {
      this._eliteWarn -= dt;
      if (this._eliteWarn <= 0) {
        const c = this.eliteCfg, a = Math.atan2(game.player.y - this.y, game.player.x - this.x);
        game.fireFan(this.x, this.y, a, c.spread * DEG, c.count, c.speed, this.cfg.damage * c.damageMult);
        Sound.tone(860, 0.08, "sawtooth", 0.12, 220);
        this._eliteCd = c.cd;
      }
      return;
    }
    this._eliteCd -= dt;
    if (this._eliteCd <= 0) this._eliteWarn = this.eliteCfg.warn;
  }
  updateSupport(dt) {
    if (this._supportPulse > 0) this._supportPulse -= dt;
    if (this.type !== "support" || this.y <= 0 || this.y >= CONFIG.HEIGHT * 0.78) return;
    this._supportTimer -= dt;
    if (this._supportTimer > 0) return;
    this._supportTimer = this.cfg.repairInterval || 2.4;
    if (game.repairNearbyEnemies(this) > 0) this._supportPulse = 0.45;
  }
  updateBeacon(dt) {
    if (this.type !== "beacon" || this.y <= 0 || this.y >= CONFIG.HEIGHT * 0.72 || !game.player || game.stealthActive()) return;   // X5:隐身期间冻结标记/开火
    if (this._beaconWarn > 0) {
      this._beaconWarn -= dt;
      if (this._beaconWarn <= 0) {
        const n = this.cfg.markShots || 3, gap = 24;
        for (let i = 0; i < n; i++) game.spawnEnemyBullet(this._beaconX, -18 - i * gap, 0, this.cfg.bulletSpeed || 300, this.cfg.damage || 8);
        this._beaconTimer = this.cfg.markInterval || 2.8;
        Sound.tone(680, 0.08, "triangle", 0.1, 200);
      }
      return;
    }
    this._beaconTimer -= dt;
    if (this._beaconTimer <= 0) { this._beaconX = game.player.x; this._beaconWarn = this.cfg.markDelay || 0.75; }
  }
  updateMineLayer(dt) {
    if (this.type !== "mineLayer" || this.y <= 0 || this.y >= CONFIG.HEIGHT * 0.72 || game.stealthActive()) return;   // X5:隐身期间冻结布雷
    this._mineTimer -= dt;
    if (this._mineTimer > 0) return;
    this._mineTimer = this.cfg.mineInterval || 2.2;
    game.spawnEnemyBullet(this.x, this.y + this.radius * 0.45, 0, 58, this.cfg.damage || 9, { kind: "mine", radius: this.cfg.mineRadius || 18, triggerRadius: this.cfg.triggerRadius || 70, fuse: this.cfg.mineFuse || 0.45, ringCount: this.cfg.ringCount || 8, ringSpeed: this.cfg.ringSpeed || 170, ringDamage: this.cfg.damage || 9 });
    Sound.tone(360, 0.07, "square", 0.08, 180);
  }
  updatePhaseWing(dt) {
    if (this.type !== "phaseWing" || this.y <= 0 || this.y >= CONFIG.HEIGHT * 0.72 || !game.player || game.stealthActive()) return;   // X5:隐身期间冻结闪现瞄点/开火
    if (this._phaseWarn > 0) {
      this._phaseWarn -= dt;
      if (this._phaseWarn <= 0) {
        this.x = this.baseX = this._phaseTargetX;
        game.fireFan(this.x, this.y + this.radius, Math.PI / 2, 46 * DEG, this.cfg.shots || 5, this.cfg.bulletSpeed || 275, this.cfg.damage || 8);
        this._phaseTimer = this.cfg.blinkInterval || 2.4;
        Sound.tone(760, 0.08, "sawtooth", 0.1, 220);
      }
      return;
    }
    this._phaseTimer -= dt;
    if (this._phaseTimer <= 0) {
      const side = game.player.x < CONFIG.WIDTH / 2 ? 1 : -1;
      this._phaseTargetX = clamp(game.player.x + side * (this.cfg.blinkRange || 170), this.radius + 18, CONFIG.WIDTH - this.radius - 18);
      this._phaseWarn = this.cfg.blinkDelay || 0.55;
    }
  }
  canUseEndlessSkill(minTime = 0) {
    return game.endless && (!minTime || game._endlessT >= minTime) && this.y > 0 && this.y < CONFIG.HEIGHT * 0.76 && game.player && !game.stealthActive();   // X5:隐身期间冻结无尽词缀技能(追踪弹/属性场)
  }
  updateHomingSkill(dt) {
    if (!this.cfg.homingInterval || !this.canUseEndlessSkill(this.cfg.homingMinTime || 0)) return;
    this._homingSkillTimer -= dt;
    if (this._homingSkillTimer > 0) return;
    this._homingSkillTimer = this.cfg.homingInterval || 4;
    game.spawnEnemyHomingBullet(this.x, this.y + this.radius * 0.45, this.cfg.homingSpeed || 220, this.cfg.homingTurn || 2.8, this.cfg.homingDamage || this.cfg.damage || 7);
    Sound.tone(720, 0.08, "triangle", 0.1, 180);
  }
  updateZoneSkill(dt) {
    if (!this.cfg.zoneKind || !this.canUseEndlessSkill(this.cfg.zoneMinTime || 0)) return;
    this._zoneTimer -= dt;
    if (this._zoneTimer > 0) return;
    this._zoneTimer = this.cfg.zoneInterval || 4.5;
    game.spawnEnemyZone(this.x, this.y + this.radius * 0.35, this.cfg.zoneKind, this.cfg);
    Sound.tone(this.cfg.zoneKind === "ice" ? 520 : 300, 0.08, "sawtooth", 0.09, 160);
  }
  updateWarden(dt) {
    if (this.type !== "warden" || this.y <= 0 || this.y >= CONFIG.HEIGHT * 0.78) return;
    this._wardenPulse -= dt;
    if (this._wardenPulse > 0) return;
    this._wardenPulse = 0.35;
    const r = this.cfg.guardRadius || 0, max = this.cfg.maxTargets || 4;
    let n = 0;
    for (const e of game.enemies) {
      if (n >= max || e.dead || e === this || e.isBoss || e.guardShield > 0) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      if (dx * dx + dy * dy > r * r) continue;
      e.guardShield = this.cfg.guardShield || 8; e.guardedBy = this; n++;
    }
  }
  reflectShot() {
    if (this.type !== "mirrorDrone" || this._reflectCd > 0 || this.dead || game.stealthActive()) return;   // X5:隐身期间不触发反射弹
    this._reflectCd = this.cfg.reflectCd || 0.9;
    const dir = game.rng() < 0.5 ? -1 : 1;
    game.spawnEnemyBullet(this.x, this.y, dir * (this.cfg.reflectSpeed || this.cfg.bulletSpeed || 230), 35, this.cfg.damage || 7);
    this._flash = 0.08;
  }
  damage(d, source = "") {
    let dealt = 0;
    d *= 1 - Math.max(game.endlessEnemyDamageReduction ? game.endlessEnemyDamageReduction() : 0, this._bossEliteDr || 0);
    if (this.guardShield > 0) {
      const used = Math.min(this.guardShield, d);
      this.guardShield -= used; d -= used; dealt += used; this._flash = 0.06;
      if (this.guardShield > 0) { game.recordEndlessPlayerDamage(dealt); return false; }
    }
    if (this.eliteShield > 0) {
      const mult = 1 + game.bonusValue("shieldBreaker", "shieldDamageMult");
      const used = Math.min(this.eliteShield, d * mult);
      this.eliteShield -= used; d -= used / mult; dealt += used; this._flash = 0.06;
      if (this.eliteShield <= 0) game.triggerShieldBreak(this);
      if (this.eliteShield > 0) { game.recordEndlessPlayerDamage(dealt); return false; }
    }
    if (this._bossEliteMinLifeT && game._endlessT < this._bossEliteMinLifeT && game.boss && !game.boss.dead && this.hp - d <= 0) {
      dealt += Math.max(0, this.hp - 1); this.hp = 1; game.recordEndlessPlayerDamage(dealt); this._flash = 0.06; return false;
    }
    dealt += Math.max(0, Math.min(this.hp, d));
    this.hp -= d; game.recordEndlessPlayerDamage(dealt); this._flash = 0.06; if (this.hp <= 0) { this.dead = true; return true; }
    if (source === "bullet") this.reflectShot();
    return false;
  }
  // QQ:主体色改渐变(受光面亮/边缘暗)+ 整体加柔和投影,取代纯色平涂,读起来更有质感
  draw(ctx) {
    const x = this.x, y = this.y, r = this.radius, t = this.type;
    if (ImageAssets.draw(ctx, ImageAssets.enemy(t), x, y, r * 2.8)) {
      if (this._flash > 0) {
        const hit = clamp(this._flash / 0.06, 0, 1);
        ctx.save();
        ctx.strokeStyle = UI.rgba("#ffd43b", 0.22 + hit * 0.5);
        ctx.lineWidth = 1.5 + hit * 2.5;
        ctx.shadowColor = "#ffd43b";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, r * (1.25 + (1 - hit) * 0.18), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      this.drawCarrierSpawnRing(ctx);
      this.drawRoleAura(ctx);
      this.drawEliteMark(ctx);
      this.drawCannonHitPips(ctx);
      this.drawLostLock(ctx);
      return;
    }
    let c;
    if (this._flash > 0) c = "#fff";
    else { c = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); c.addColorStop(0, UI.shade(this.color, 0.4)); c.addColorStop(1, UI.shade(this.color, -0.25)); }
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
    ctx.fillStyle = c;
    if (t === "gunner") {                       // 重炮机:方形舰体 + 双炮管 + 核心
      ctx.fillRect(x - r * 0.72, y - r * 0.5, r * 1.44, r);
      // RR:重装装甲缝隙线 + 铆钉,区别于小型/中型的光滑机身
      ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - r * 0.72, y - r * 0.1); ctx.lineTo(x + r * 0.72, y - r * 0.1); ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,.35)";
      for (const rx of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.arc(x + rx * r, y - r * 0.35, 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "#495057"; ctx.fillRect(x - r * 0.55, y + r * 0.35, 5, r * 0.7); ctx.fillRect(x + r * 0.55 - 5, y + r * 0.35, 5, r * 0.7);
      ctx.fillStyle = "#dfe6f0"; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (t === "splitter") {              // 分裂机:三段连体
      ctx.fillStyle = "#0b3b2e"; ctx.fillRect(x - r * 0.75, y - 3, r * 1.5, 6);
      for (let k = -1; k <= 1; k++) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + k * r * 0.55, y, r * 0.42, 0, Math.PI * 2); ctx.fill(); }
    } else if (t === "large") {                 // 大型:重装机 + 侧舱 + 座舱
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r, y - r * 0.5); ctx.lineTo(x - r * 0.4, y - r); ctx.lineTo(x + r * 0.4, y - r); ctx.lineTo(x + r, y - r * 0.5); ctx.closePath(); ctx.fill();
      // RR:装甲板缝隙线,呼应 BOSS 的装甲纹理,做出"重装"辨识度
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.1); ctx.lineTo(x + r * 0.5, y - r * 0.1); ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x, y + r * 0.6); ctx.stroke();
      ctx.fillStyle = "#7a2b45"; ctx.fillRect(x - r * 0.78, y - r * 0.2, r * 0.32, r * 0.6); ctx.fillRect(x + r * 0.46, y - r * 0.2, r * 0.32, r * 0.6);
      ctx.fillStyle = "#ffe3ef"; ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fill();
    } else if (t === "medium") {                // 中型:双尾翼战机
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r, y - r * 0.7); ctx.lineTo(x, y - r); ctx.lineTo(x + r, y - r * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#7a4a12"; ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (t === "sniper") {                // Z:狙击机:细长机身 + 长瞄准管
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r * 0.5, y - r * 0.3); ctx.lineTo(x, y - r); ctx.lineTo(x + r * 0.5, y - r * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#495057"; ctx.fillRect(x - 2, y - r - 10, 4, 12);
    } else if (t === "detonator") {              // Z:雷机:圆形弹体 + 警示十字
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x + r * 0.5, y); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x, y + r * 0.5); ctx.stroke();
    } else if (t === "phantom") {                // V:幻影机:细窄机身 + 双侧刃翼
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r * 0.35, y - r * 0.2); ctx.lineTo(x, y - r); ctx.lineTo(x + r * 0.35, y - r * 0.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = UI.shade(this.color, -0.35);
      ctx.beginPath(); ctx.moveTo(x - r * 0.3, y + r * 0.1); ctx.lineTo(x - r, y - r * 0.35); ctx.lineTo(x - r * 0.55, y + r * 0.25); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + r * 0.3, y + r * 0.1); ctx.lineTo(x + r, y - r * 0.35); ctx.lineTo(x + r * 0.55, y + r * 0.25); ctx.closePath(); ctx.fill();
    } else if (t === "carrier") {                // V:母舰机:厚重舰体 + 双侧发射舱(呼应死亡裂出僚机)
      ctx.beginPath(); ctx.moveTo(x - r * 0.85, y - r * 0.2); ctx.lineTo(x - r * 0.5, y - r * 0.7); ctx.lineTo(x + r * 0.5, y - r * 0.7); ctx.lineTo(x + r * 0.85, y - r * 0.2); ctx.lineTo(x + r * 0.6, y + r * 0.6); ctx.lineTo(x - r * 0.6, y + r * 0.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - r * 0.7, y); ctx.lineTo(x + r * 0.7, y); ctx.stroke();
      ctx.fillStyle = "#2b1a4a"; ctx.beginPath(); ctx.arc(x - r * 0.55, y + r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.55, y + r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e5dbff"; ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.24, 0, Math.PI * 2); ctx.fill();
    } else if (t === "shieldCarrier") {
      ctx.beginPath(); ctx.moveTo(x - r * 0.85, y - r * 0.25); ctx.lineTo(x - r * 0.35, y - r * 0.75); ctx.lineTo(x + r * 0.35, y - r * 0.75); ctx.lineTo(x + r * 0.85, y - r * 0.25); ctx.lineTo(x + r * 0.55, y + r * 0.65); ctx.lineTo(x - r * 0.55, y + r * 0.65); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#d0ebff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - r * 0.55, y - r * 0.05); ctx.lineTo(x + r * 0.55, y - r * 0.05); ctx.moveTo(x, y - r * 0.52); ctx.lineTo(x, y + r * 0.45); ctx.stroke();
      ctx.fillStyle = "#e7f5ff"; ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (t === "jammer") {
      ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x - r * 0.85, y); ctx.lineTo(x, y + r); ctx.lineTo(x + r * 0.85, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#99e9f2"; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x, y, r * (0.32 + k * 0.22), 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = "#e3fafc"; ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, Math.PI * 2); ctx.fill();
    } else if (t === "support") {
      ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e6fcf5"; ctx.fillRect(x - 4, y - r * 0.45, 8, r * 0.9); ctx.fillRect(x - r * 0.45, y - 4, r * 0.9, 8);
      ctx.strokeStyle = UI.shade(this.color, -0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, Math.PI * 2); ctx.stroke();
    } else if (t === "beacon") {
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r * 0.55, y - r * 0.35); ctx.lineTo(x, y - r); ctx.lineTo(x + r * 0.55, y - r * 0.35); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff3bf"; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r * 0.22, 0, Math.PI * 2); ctx.fill();
    } else if (t === "mineLayer") {
      ctx.beginPath(); ctx.moveTo(x - r * 0.85, y - r * 0.2); ctx.lineTo(x - r * 0.45, y - r * 0.75); ctx.lineTo(x + r * 0.45, y - r * 0.75); ctx.lineTo(x + r * 0.85, y - r * 0.2); ctx.lineTo(x + r * 0.55, y + r * 0.62); ctx.lineTo(x - r * 0.55, y + r * 0.62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#212529"; ctx.beginPath(); ctx.arc(x - r * 0.32, y + r * 0.18, r * 0.16, 0, Math.PI * 2); ctx.arc(x + r * 0.32, y + r * 0.18, r * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (t === "phaseWing") {
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r * 0.35, y - r * 0.25); ctx.lineTo(x, y - r); ctx.lineTo(x + r * 0.35, y - r * 0.25); ctx.closePath(); ctx.fill();
      ctx.fillStyle = UI.shade(this.color, -0.28); ctx.beginPath(); ctx.moveTo(x - r * 0.25, y); ctx.lineTo(x - r, y - r * 0.55); ctx.lineTo(x - r * 0.55, y + r * 0.45); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + r * 0.25, y); ctx.lineTo(x + r, y - r * 0.55); ctx.lineTo(x + r * 0.55, y + r * 0.45); ctx.closePath(); ctx.fill();
    } else if (t === "mirrorDrone") {
      ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x - r * 0.85, y); ctx.lineTo(x, y + r); ctx.lineTo(x + r * 0.85, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e7f5ff"; ctx.beginPath(); ctx.arc(x, y, r * 0.24, 0, Math.PI * 2); ctx.fill();
    } else if (t === "tether") {
      ctx.beginPath(); ctx.arc(x, y, r * 0.76, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#c3fae8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2); ctx.stroke();
    } else if (t === "warden") {
      ctx.beginPath(); ctx.rect(x - r * 0.72, y - r * 0.72, r * 1.44, r * 1.44); ctx.fill();
      ctx.strokeStyle = "#dbe4ff"; ctx.lineWidth = 2; ctx.strokeRect(x - r * 0.5, y - r * 0.5, r, r);
    } else if (t === "harvester") {
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r * 0.75, y - r * 0.55); ctx.lineTo(x, y - r * 0.35); ctx.lineTo(x + r * 0.75, y - r * 0.55); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#fff3bf"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 0.22, y + r * 0.15); ctx.lineTo(x, y + r * 0.48); ctx.lineTo(x + r * 0.22, y + r * 0.15); ctx.stroke();
    } else if (t === "kamikaze") {
      ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x - r * 0.72, y + r * 0.62); ctx.lineTo(x, y + r * 0.25); ctx.lineTo(x + r * 0.72, y + r * 0.62); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#fff5f5"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - r * 0.35, y); ctx.lineTo(x + r * 0.35, y); ctx.moveTo(x, y - r * 0.45); ctx.lineTo(x, y + r * 0.45); ctx.stroke();
    } else {                                    // 小型:轻型截击机
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r, y - r * 0.8); ctx.lineTo(x, y - r * 0.35); ctx.lineTo(x + r, y - r * 0.8); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // W2:carrier 裂解出的僚机短暂带一圈脉动紫环,提示玩家"这是母舰刚炸出来的",1秒后自然消失,不需要额外状态清理
    this.drawCarrierSpawnRing(ctx);
    this.drawRoleAura(ctx);
    this.drawEliteMark(ctx);
    this.drawCannonHitPips(ctx);
    this.drawLostLock(ctx);
  }
  // X8:统一的"取消预警"接口——隐身/信号屏蔽启动时由 game.onLostLockStart 调用,
  //   把已进入预警动画的攻击(狙击线/充能/信标标记/闪现瞄点)直接作废并重置各自冷却;
  //   以后新加带预警的敌机类型,在这里补一行即可,不用去改隐身逻辑
  cancelWarn() {
    if (this._sniperWarn > 0) { this._sniperWarn = 0; this._fireTimer = this.cfg.fireInterval * game.activeDiff.fireMult; }
    if (this._eliteWarn > 0) { this._eliteWarn = 0; this._eliteCd = (this.eliteCfg && this.eliteCfg.cd) || 2.4; }
    if (this._beaconWarn > 0) { this._beaconWarn = 0; this._beaconTimer = this.cfg.markInterval || 2.8; }
    if (this._phaseWarn > 0) { this._phaseWarn = 0; this._phaseTimer = this.cfg.blinkInterval || 2.4; }
  }
  // X7:光学迷彩期间敌机头顶亮起黄色"?"——一眼看出"它已经找不到你了",给隐身一个明确的正反馈;
  //   只给有攻击能力的敌机画(fireInterval>0 或带技能/精英),纯撞击杂兵本来也不"锁定"谁,画了反而误导
  // X8:出现时带 0.2 秒的弹出缩放(从 1.6 倍缩回 1 倍),配合全场同时亮起,做出"所有敌机同时丢失目标"的演出感
  drawLostLock(ctx) {
    if (!game.stealthActive() || this.y <= 0) return;
    if (!(this.cfg.fireInterval > 0 || this.eliteCfg || this.cfg.homingInterval || this.cfg.zoneKind || this.type === "beacon" || this.type === "phaseWing" || this.type === "mineLayer")) return;
    const popT = clamp((game.titleT - (game._lostLockStartT || 0)) / 0.2, 0, 1);
    const pop = 1.6 - 0.6 * popT;
    const pulse = 0.55 + Math.sin(game.titleT * 6 + this.x * 0.05) * 0.3;
    ctx.save(); ctx.globalAlpha = pulse * (0.4 + popT * 0.6); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd43b"; ctx.font = "bold " + Math.round(14 * pop) + "px 'Segoe UI', sans-serif";
    ctx.fillText("?", this.x, this.y - this.radius - (this.eliteCfg ? 34 : 22));
    ctx.restore();
  }
  // MO3:大炮形态五连暴击进度可视化——机身上方一排小圆点,亮起数 = 已吃的炮弹数(对 critEvery 取余),
  //   集满(下一发即暴击)时整排变金色并放大脉动,让"每5发追加巨额暴击"这个机制看得见、可预判
  drawCannonHitPips(ctx) {
    if (!this._cannonHits || this.y <= 0 || !game.player || !game.player.cannonMode) return;
    const morph = game.player.ship.morph; if (!morph) return;
    const every = morph.critEvery || 5, n = this._cannonHits % every || every;
    const full = n === every && this._cannonHits > 0;
    const x = this.x, y = this.y - this.radius - (this.eliteCfg ? 24 : 12), gap = 9, total = (every - 1) * gap;
    ctx.save(); ctx.textAlign = "center";
    for (let i = 0; i < every; i++) {
      const lit = i < n, px = x - total / 2 + i * gap, pulse = full ? 0.7 + Math.sin(game.titleT * 12) * 0.3 : 1;
      ctx.globalAlpha = lit ? pulse : 0.25;
      ctx.fillStyle = full ? "#ffd43b" : (lit ? "#99e9f2" : "rgba(255,255,255,.4)");
      ctx.beginPath(); ctx.arc(px, y, full && lit ? 3.4 : 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  drawRoleAura(ctx) {
    if (this.y <= 0) return;
    const x = this.x, y = this.y, r = this.radius;
    if (this.guardShield > 0) {
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = "#91a7ff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(this._mt * 8) * 2, 0, Math.PI * 2); ctx.stroke();
      UI.bar(ctx, x - r, y + r + 7, r * 2, 4, clamp(this.guardShield / Math.max(1, (this.guardedBy && this.guardedBy.cfg.guardShield) || 8), 0, 1), "#91a7ff", "#91a7ff", {});
      ctx.restore();
    }
    if (this.type === "beacon" && this._beaconWarn > 0) {
      ctx.save(); ctx.globalAlpha = 0.18 + 0.25 * Math.sin(this._mt * 28) ** 2; ctx.fillStyle = "#ff6b6b"; ctx.fillRect(this._beaconX - 8, 0, 16, CONFIG.HEIGHT);
      ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this._beaconX - 16, game.player ? game.player.y : CONFIG.HEIGHT * 0.75); ctx.lineTo(this._beaconX + 16, game.player ? game.player.y : CONFIG.HEIGHT * 0.75); ctx.stroke(); ctx.restore();
    } else if (this.type === "phaseWing" && this._phaseWarn > 0) {
      ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this._mt * 28) ** 2; ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(this._phaseTargetX, y, r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(this._phaseTargetX, y); ctx.lineTo(this._phaseTargetX, CONFIG.HEIGHT); ctx.stroke(); ctx.restore();
    } else if (this.type === "tether") {
      const rr = Math.min(this.cfg.pullRadius || 0, 135);
      ctx.save(); ctx.globalAlpha = 0.14 + 0.12 * Math.sin(this._mt * 6) ** 2; ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
      if (game.player) { ctx.globalAlpha = 0.18; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(game.player.x, game.player.y); ctx.stroke(); }
      ctx.restore();
    } else if (this.type === "warden") {
      ctx.save(); ctx.globalAlpha = 0.12 + 0.08 * Math.sin(this._mt * 6) ** 2; ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, this.cfg.guardRadius || 140, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (this.type === "harvester" && this._stolenKind) {
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = this.color; ctx.font = "bold 10px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("补给", x, y - r - 10); ctx.restore();
    } else if (this.type === "shieldCarrier" && this.eliteShield > 0 && !this.eliteCfg) {
      const rr = r + 8 + Math.sin(this._mt * 8) * 2;
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = this.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.fillStyle = this.color; ctx.font = "bold 10px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("护盾", x, y - r - 10);
      UI.bar(ctx, x - r, y + r + 7, r * 2, 4, clamp(this.eliteShield / Math.max(1, this.eliteShieldMax || this.cfg.shield), 0, 1), this.color, this.color, {});
      ctx.restore();
    } else if (this.type === "jammer") {
      const rr = Math.min(this.cfg.jamRadius || 0, 130), a = 0.18 + Math.abs(Math.sin(this._mt * 6)) * 0.12;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.85; ctx.fillStyle = this.color; ctx.font = "bold 10px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("干扰", x, y - r - 10);
      ctx.restore();
    } else if (this.type === "support") {
      const rr = this.cfg.repairRadius || 120, a = this._supportPulse > 0 ? 0.32 : 0.1;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = this.color; ctx.lineWidth = this._supportPulse > 0 ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.85; ctx.fillStyle = this.color; ctx.font = "bold 10px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("修复", x, y - r - 10);
      ctx.restore();
    } else if (this.type === "kamikaze") {
      ctx.save();
      ctx.globalAlpha = 0.28 + Math.sin(this._mt * 14) * 0.12; ctx.strokeStyle = this.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, r + 7, 0, Math.PI * 2); ctx.stroke();
      if (game.player) { ctx.globalAlpha = 0.18; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(game.player.x, game.player.y); ctx.stroke(); }
      ctx.globalAlpha = 0.9; ctx.setLineDash([]); ctx.fillStyle = this.color; ctx.font = "bold 10px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText(this._mt < (this.mp.warn || 2) ? "警告" : "自爆", x, y - r - 10);
      ctx.restore();
    } else if (this.type === "sniper" && this._sniperWarn > 0) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.35 * Math.sin(this._mt * 30) ** 2;
      ctx.strokeStyle = this.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(this._sniperAim) * 900, y + Math.sin(this._sniperAim) * 900); ctx.stroke();
      ctx.restore();
    }
  }
  drawCarrierSpawnRing(ctx) {
    if (this._carrierSpawn <= 0) return;
    const x = this.x, y = this.y, r = this.radius;
    ctx.save(); ctx.globalAlpha = clamp(this._carrierSpawn, 0, 1) * 0.8;
    ctx.strokeStyle = "#9775fa"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r + 5 + Math.sin(this._mt * 14) * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  drawEliteMark(ctx) {
    if (!this.eliteCfg) return;
    const x = this.x, y = this.y, r = this.radius, c = this.eliteCfg.color;
    ctx.save();
    ctx.globalAlpha = 0.78 + Math.sin(this._mt * 8) * 0.12;
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = c; ctx.font = "bold 10px 'Segoe UI', sans-serif"; ctx.textAlign = "center";
    ctx.fillText(this.eliteCfg.name, x, y - r - 10);
    if (this.eliteShield > 0) {
      UI.bar(ctx, x - r, y + r + 7, r * 2, 4, clamp(this.eliteShield / Math.max(1, this.eliteShieldMax || this.eliteCfg.shield), 0, 1), c, c, {});
    }
    if (this._eliteWarn > 0 && game.player) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this._mt * 26) ** 2;
      ctx.strokeStyle = c; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(game.player.x, game.player.y); ctx.stroke();
    }
    if (this.eliteCfg.jamRadius) {
      ctx.globalAlpha = 0.10 + 0.06 * Math.sin(this._mt * 6) ** 2;
      ctx.strokeStyle = c; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, this.eliteCfg.jamRadius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

// 弹幕库:BOSS 攻击的统一执行器(供各 BOSS 的 phases.attacks 引用)
// Y:laser 有独立冷却(atk.cd,默认3秒),不跟随 phase.cd 高频触发(避免和 spiral 等快速 tick 撞在一起刷屏)
function runBossAttack(b, atk) {
  const g = game, dmg = b.bulletDamage;
  const bulletMult = g.endless && !g.endlessLite ? (g.activeEndlessDiff().bossBulletMult || 1) : 1, count = n => Math.max(n, Math.round(n * bulletMult));
  if (atk.type === "fanDown") g.fireFan(b.x, b.y + b.radius, Math.PI / 2, atk.spread * DEG, count(atk.count), atk.speed, dmg);
  else if (atk.type === "aimed") { const a = Math.atan2(g.player.y - b.y, g.player.x - b.x); g.fireFan(b.x, b.y, a, atk.spread * DEG, count(atk.count), atk.speed, dmg); }
  else if (atk.type === "ring") g.fireRing(b.x, b.y, count(atk.count), atk.speed, dmg);
  else if (atk.type === "spiral") { const arms = count(atk.arms); b._spiral += atk.step * DEG; for (let i = 0; i < arms; i++) { const a = b._spiral + i * (Math.PI * 2 / arms); g.spawnEnemyBullet(b.x, b.y, Math.cos(a) * atk.speed, Math.sin(a) * atk.speed, dmg); } }
  else if (atk.type === "wall") { const gapX = g.player.x; for (let x = 24; x < CONFIG.WIDTH - 24; x += Math.max(24, atk.spacing / bulletMult)) { if (Math.abs(x - gapX) < atk.gap) continue; g.spawnEnemyBullet(x, b.y + b.radius * 0.4, 0, atk.speed, dmg); } }
  else if (atk.type === "laser") { if (b._laserCd <= 0) { g.spawnBossLaser(atk.aimed ? g.player.x : b.x, atk.warn || 0.6, atk.dur || 0.8, atk.width || 46, dmg); b._laserCd = atk.cd || 3.0; } }
  else if (atk.type === "dualLaser") {
    if (b._laserCd <= 0) {
      const x = atk.aimed ? g.player.x : b.x, off = atk.offset || 80;
      g.spawnBossLaser(clamp(x - off, 32, CONFIG.WIDTH - 32), atk.warn || 0.6, atk.dur || 0.8, atk.width || 42, dmg);
      g.spawnBossLaser(clamp(x + off, 32, CONFIG.WIDTH - 32), atk.warn || 0.6, atk.dur || 0.8, atk.width || 42, dmg);
      b._laserCd = atk.cd || 3.4;
    }
  }
  else if (atk.type === "prismBurst") {
    if (b._laserCd <= 0) {
      const x = g.player ? g.player.x : b.x, n = count(atk.count || 6), speed = atk.speed || 210;
      g.spawnBossLaser(x, atk.warn || 0.55, atk.dur || 0.7, atk.width || 44, dmg);
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), y = b.y + b.radius + row * 18;
        g.spawnEnemyBullet(b.x + side * b.radius * 0.65, y, side * speed, 70 + row * 20, dmg * 0.75);
      }
      b._laserCd = atk.cd || 3.8;
    }
  }
  else if (atk.type === "gravity") { if (b._gravityCd <= 0) { g.spawnGravityPulse(b.x, b.y, atk.warn || 0.7, atk.dur || 1.8, atk.radius || 420, atk.strength || 90, b.def.colors[b.phaseIndex] || "#4dabf7"); b._gravityCd = atk.cd || 4.4; } }
  else if (atk.type === "escort") g.spawnBossEscort(b, atk);
  else if (atk.type === "weak") g.openBossWeakPoint(b, Object.assign({ color: b.def.colors[b.phaseIndex] || "#ffd43b" }, atk));
}

// Y:BOSS 造型剪影(供 Boss.draw 与首页图鉴共用)
// QQ:纯色改渐变(受光面亮/边缘暗),给BOSS舰体加立体感;供 Boss.draw 与首页图鉴共用
function fillBossShape(ctx, x, y, r, shape, color, assetIndex) {
  if (assetIndex != null && ImageAssets.draw(ctx, ImageAssets.boss(assetIndex), x, y, r * 2.45)) return;
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
  grad.addColorStop(0, UI.shade(color, 0.35)); grad.addColorStop(1, UI.shade(color, -0.3));
  ctx.fillStyle = grad;
  if (shape === "cross") { ctx.fillRect(x - r, y - r * 0.4, 2 * r, r * 0.8); ctx.fillRect(x - r * 0.4, y - r, r * 0.8, 2 * r); return; }
  ctx.beginPath();
  if (shape === "hex") { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }
  else if (shape === "star") { for (let i = 0; i < 10; i++) { const rad = i % 2 === 0 ? r : r * 0.5, a = -Math.PI / 2 + i * Math.PI / 5, px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }
  // V:世界5 最终BOSS 造型 —— 正八边形,比六边形更"重",比星形更"沉稳/邪异"
  else if (shape === "octagon") { for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }
  else { ctx.moveTo(x, y + r); ctx.lineTo(x - r, y - r * 0.6); ctx.lineTo(x - r * 0.5, y - r); ctx.lineTo(x + r * 0.5, y - r); ctx.lineTo(x + r, y - r * 0.6); }
  ctx.closePath(); ctx.fill();
}

class Boss {
  constructor(defIndex) {
    const def = CONFIG.bosses[defIndex % CONFIG.bosses.length];
    this.def = def; this.isBoss = true;
    this.x = CONFIG.WIDTH / 2; this.y = -def.radius; this.radius = def.radius;
    this.maxHp = Math.round(def.hp * game.activeDiff.bossHpMult); this.hp = this.maxHp;
    this.bulletDamage = def.damage; this.score = def.score;   // 注意:不能叫 this.damage,会覆盖 damage() 方法
    this._fireScale = game.activeDiff.fireMult;              // 难度射速
    this.dead = false; this._t = 0; this._moveT = 0; this._entered = false; this._flash = 0;
    this._fireTimer = 1.2; this._spiral = 0; this._targetX = this.x;
    this._enraged = false; this._laserCd = 0; this._gravityCd = 0; this._lastPhaseIndex = 0;   // Y:狂暴阶段 / 镭射独立冷却
    this.defIndex = defIndex % CONFIG.bosses.length;   // W2:记下具体是哪个BOSS,给"击败特定BOSS"成就用
    const inv = CONFIG.bossInvuln || {}, min = inv.minCount || 0, max = inv.maxCount || min;
    this._invulnTotal = min + Math.floor(game.rng() * Math.max(1, max - min + 1));
    this._invulnLeft = this._invulnTotal; this._invulnTimer = 0;
  }
  get phaseIndex() { const r = this.hp / this.maxHp, ph = this.def.phases; for (let i = 0; i < ph.length; i++) if (r > ph[i].until) return i; return ph.length - 1; }
  get phase() { return this.phaseIndex + 1; }         // 兼容旧引用
  move(dt) {
    const def = this.def, cx = CONFIG.WIDTH / 2;
    if (def.movement === "sweep") this.x = cx + Math.sin(this._t * def.moveSpeed) * def.moveRange;
    else if (def.movement === "figure8") { this.x = cx + Math.sin(this._t * def.moveSpeed) * def.moveRange; this.y = def.enterY + Math.sin(this._t * def.moveSpeed * 2) * 40; }
    else if (def.movement === "dart") {
      this.x += (this._targetX - this.x) * 0.06;
      if (this._moveT > (def.dartEvery || 2)) { this._moveT = 0; const m = def.radius + 40; this._targetX = m + game.rng() * (CONFIG.WIDTH - 2 * m); }
    }
  }
  update(dt) {
    const def = this.def;
    if (!this._entered) { this.y += 90 * dt; if (this.y >= def.enterY) { this.y = def.enterY; this._entered = true; } return; }
    this._t += dt; this._moveT += dt; if (this._flash > 0) this._flash -= dt; if (this._laserCd > 0) this._laserCd -= dt; if (this._gravityCd > 0) this._gravityCd -= dt; if (this._weakTimer > 0) this._weakTimer = Math.max(0, this._weakTimer - dt); if (this._invulnTimer > 0) this._invulnTimer = Math.max(0, this._invulnTimer - dt); this.move(dt);
    const phaseIndex = this.phaseIndex;
    if (phaseIndex !== this._lastPhaseIndex) { this._lastPhaseIndex = phaseIndex; game.onBossPhaseChange(this, phaseIndex); }
    // Y:血量 <=20% 时触发一次狂暴,此后攻击频率永久提升
    if (!this._enraged && this.hp / this.maxHp <= 0.2) { this._enraged = true; this._fireScale *= 0.7; game.onBossEnrage(this); }
    if (this.affix) game.updateBossAffix(this, dt);
    const phase = def.phases[phaseIndex];
    // X5:隐身期间 BOSS 攻击计时器也冻结——不新开一轮弹幕,隐身结束后从冻结的地方接着倒数
    if (!game.stealthActive()) {
      this._fireTimer -= dt;
      if (this._fireTimer <= 0) { this._fireTimer = phase.cd * this._fireScale; for (const atk of phase.attacks) runBossAttack(this, atk); }
    }
  }
  damage(d) {
    if (this._invulnTimer > 0) { this._flash = 0.04; return false; }
    const before = this.hp;
    const dr = Math.max(this._endlessDr || 0, game.endlessBossDamageReductionBoost ? game.endlessBossDamageReductionBoost() : 0);
    if (dr > 0) d *= 1 - dr;
    if (this.def.guardDR && game.bossEscortCount() > 0 && this._weakTimer <= 0) d *= 1 - this.def.guardDR;
    const threshold = this._invulnLeft > 0 ? this._invulnLeft / (this._invulnTotal + 1) : 0, nextHp = this.hp - d;
    if (threshold > 0 && this.hp / this.maxHp > threshold && nextHp / this.maxHp <= threshold) {
      this.hp = Math.max(1, Math.round(this.maxHp * threshold)); game.recordEndlessPlayerDamage(Math.max(0, before - this.hp)); this._flash = 0.09; this.startInvuln(); return false;
    }
    this.hp = nextHp; game.recordEndlessPlayerDamage(Math.max(0, before - Math.max(0, this.hp))); this._flash = 0.09; if (this.hp <= 0) { this.dead = true; return true; } return false;
  }
  startInvuln() {
    const inv = CONFIG.bossInvuln || {}, min = inv.minDuration || 5, max = inv.maxDuration || min;
    const fixed = game.endless && !game.endlessLite ? game.activeEndlessDiff().bossInvulnDuration : null;
    this._invulnTimer = fixed != null ? fixed : min + game.rng() * Math.max(0, max - min); this._invulnLeft--;
    if (game.onBossInvuln) game.onBossInvuln(this);
  }
  draw(ctx) {
    const flash = this._flash > 0, color = flash ? "#fff" : this.def.colors[this.phaseIndex], r = this.radius, x = this.x, y = this.y;
    // Y:狂暴态外圈红色脉动光晕
    if (this._enraged) { const gr = r + 14 + Math.sin(this._t * 6) * 4; ctx.fillStyle = "rgba(255,40,40,.22)"; ctx.beginPath(); ctx.arc(x, y, gr, 0, Math.PI * 2); ctx.fill(); }
    if (this.affix && !flash) { ctx.strokeStyle = UI.rgba(this.affix.color, .72); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 20 + Math.sin(this._t * 5) * 3, 0, Math.PI * 2); ctx.stroke(); }
    if (this._invulnTimer > 0) { ctx.strokeStyle = "rgba(116,192,252,.92)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r + 28 + Math.sin(this._t * 8) * 4, 0, Math.PI * 2); ctx.stroke(); }
    // X7:光学迷彩期间 BOSS 头顶也亮"?"——和小怪同一套"失去索敌"反馈(X8:同样带弹出缩放)
    if (game.stealthActive() && this._entered) {
      const popT = clamp((game.titleT - (game._lostLockStartT || 0)) / 0.2, 0, 1), pop = 1.6 - 0.6 * popT;
      ctx.save(); ctx.globalAlpha = (0.55 + Math.sin(game.titleT * 6) * 0.3) * (0.4 + popT * 0.6); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffd43b"; ctx.font = "bold " + Math.round(22 * pop) + "px 'Segoe UI', sans-serif";
      ctx.fillText("?", x, y - r - 40);
      ctx.restore();
    }
    const bossImage = ImageAssets.boss(this.defIndex);
    if (ImageAssets.draw(ctx, bossImage, x, y, r * 2.45)) {
      if (flash) {
        const hit = clamp(this._flash / 0.09, 0, 1);
        ctx.save();
        ctx.strokeStyle = UI.rgba("#ffd43b", 0.25 + hit * 0.55);
        ctx.lineWidth = 2 + hit * 3;
        ctx.shadowColor = "#ffd43b";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(x, y, r * (1.2 + (1 - hit) * 0.16), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (this._weakTimer > 0) {
        if (!ImageAssets.draw(ctx, ImageAssets.effect("weakpointMarker"), x, y - 6, Math.max(42, r * 0.72))) {
          ctx.save(); ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 6, r * 0.22, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      }
      return;
    }
    // 侧翼炮塔
    ctx.fillStyle = "#2b3038"; ctx.fillRect(x - r - 7, y - 8, 12, 26); ctx.fillRect(x + r - 5, y - 8, 12, 26);
    ctx.fillStyle = "#495057"; ctx.fillRect(x - r - 3, y + 16, 4, 8); ctx.fillRect(x + r - 1, y + 16, 4, 8);
    // 舰体(剪影逻辑抽到 fillBossShape,供图鉴复用)
    fillBossShape(ctx, x, y, r, this.def.shape, color);
    // 装甲板线 + RR:铆钉点缀,强化"重型装甲"金属质感
    ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.2); ctx.lineTo(x + r * 0.6, y - r * 0.2); ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x, y + r * 0.5); ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,.3)";
    for (const [rx, ry] of [[-0.6, -0.2], [0.6, -0.2], [0, -0.6], [0, 0.5]]) { ctx.beginPath(); ctx.arc(x + rx * r, y + ry * r, 2, 0, Math.PI * 2); ctx.fill(); }
    // 脉动核心(发光)—— QQ:加 shadowBlur 做真正的辉光,而不只是纯色圆点
    const pr = 11 + Math.sin(this._t * 4) * 3, coreCol = ["#845ef7", "#e64980", "#f03e3e"][this.phaseIndex];
    ctx.save(); ctx.shadowColor = flash ? "#fff" : coreCol; ctx.shadowBlur = 16;
    ctx.fillStyle = flash ? "#fff" : "#ffe3e3"; ctx.beginPath(); ctx.arc(x, y - 6, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = coreCol; ctx.beginPath(); ctx.arc(x, y - 6, pr * 0.5, 0, Math.PI * 2); ctx.fill();
    if (this._weakTimer > 0) { ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 6, pr + 9, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
}

class PowerUp {
  constructor(x, y, kind) { this.x = x; this.y = y; this.kind = kind; this.radius = CONFIG.powerup.radius; this.dead = false; this._magnet = false; this._magnetRatio = 0; }
  update(dt) {
    this.y += CONFIG.powerup.speed * dt; this._magnet = false; this._magnetRatio = 0;
    if (game.player) {
      const dx = game.player.x - this.x, dy = game.player.y - this.y, d = Math.hypot(dx, dy), mr = CONFIG.powerup.magnetRadius * game.pickupRangeMult();
      if (d > 1 && d < mr) {
        const pull = 1 - d / mr;
        const step = Math.min(d, CONFIG.powerup.magnetSpeed * (0.28 + pull) * dt);
        this.x += dx / d * step; this.y += dy / d * step; this._magnet = true;
        this._magnetRatio = pull;
      }
    }
    if (this.y > CONFIG.HEIGHT + this.radius) this.dead = true;
  }
  draw(ctx) {
    const x = this.x, y = this.y, r = this.radius;
    const bg = { heal: "#e03131", power: "#2f9e44", bomb: "#5f3dc4", wing: "#495057", chip: "#4dabf7" }[this.kind] || "#adb5bd";
    const pulse = 0.78 + Math.sin(game.titleT * 6 + x * 0.03) * 0.12;
    ctx.save();
    if (this._magnet) {
      if (game.player) {
        ctx.globalAlpha = 0.18 + this._magnetRatio * 0.32;
        ctx.strokeStyle = bg; ctx.lineWidth = 2.2; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(game.player.x, game.player.y); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 0.38 + this._magnetRatio * 0.32; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r + 7 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.75; ImageAssets.draw(ctx, ImageAssets.effect("powerupGlow"), x, y, r * 3.1); ctx.globalAlpha = 1;
    drawPowerupIcon(ctx, x, y, r, this.kind, bg, 12 * pulse);
    ctx.restore();
  }
}
// OO:掉落物图标——优先用真实美术图(assets/images/ui/powerups),没有素材才退回矢量占位图。
// 单独抽出来,图鉴的道具页直接复用,保证图鉴里看到的图案和局内实际掉落的道具完全一致。
function drawPowerupIcon(ctx, x, y, r, kind, bg, glowBlur = 8) {
  if (ImageAssets.draw(ctx, ImageAssets.uiPowerup(kind), x, y, r * 2.5)) return;
  drawPowerupToken(ctx, x, y, r, kind, bg, glowBlur);
}
// 矢量占位图标(渐变底 + 描边 + 白色图案)——无素材时的兜底画法,仅 drawPowerupIcon 内部调用。
function drawPowerupToken(ctx, x, y, r, kind, bg, glowBlur = 8) {
  bg = bg || { heal: "#e03131", power: "#2f9e44", bomb: "#5f3dc4", wing: "#495057", chip: "#4dabf7" }[kind] || "#adb5bd";
  ctx.save(); ctx.shadowColor = bg; ctx.shadowBlur = glowBlur;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r * 1.4);
  g.addColorStop(0, UI.shade(bg, 0.55)); g.addColorStop(0.65, bg); g.addColorStop(1, UI.shade(bg, -0.45));
  UI.roundRect(ctx, x - r, y - r, r * 2, r * 2, 6); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  UI.roundRect(ctx, x - r + 1.5, y - r + 1.5, r * 2 - 3, r * 2 - 3, 5);
  ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#fff";
  const s = r / 14;
  if (kind === "heal") {           // 血包:白色十字
    ctx.fillRect(x - 3 * s, y - 8 * s, 6 * s, 16 * s); ctx.fillRect(x - 8 * s, y - 3 * s, 16 * s, 6 * s);
  } else if (kind === "power") {   // 火力:白色双上箭头
    for (let k = 0; k < 2; k++) { const oy = k * 8 * s - 4 * s; ctx.beginPath(); ctx.moveTo(x, y + oy - 4 * s); ctx.lineTo(x - 7 * s, y + oy + 4 * s); ctx.lineTo(x + 7 * s, y + oy + 4 * s); ctx.closePath(); ctx.fill(); }
  } else if (kind === "chip") {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-7 * s, -7 * s, 14 * s, 14 * s); ctx.restore();
    ctx.fillStyle = "#4dabf7"; ctx.fillRect(x - 3 * s, y - 3 * s, 6 * s, 6 * s);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6;
    for (const [dx, dy] of [[0, -11], [11, 0], [0, 11], [-11, 0]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * s, y + dy * s); ctx.stroke(); }
  } else if (kind === "bomb") {     // 炸弹:圆弹体 + 引线 + 火星
    ctx.beginPath(); ctx.arc(x, y + 2 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4 * s, y - 4 * s); ctx.lineTo(x + 8 * s, y - 9 * s); ctx.stroke();
    ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(x + 9 * s, y - 10 * s, 2.6 * s, 0, Math.PI * 2); ctx.fill();
  } else {                          // 僚机:两片小机翼
    ctx.beginPath(); ctx.moveTo(x - 2 * s, y - 8 * s); ctx.lineTo(x - 11 * s, y + 6 * s); ctx.lineTo(x - 2 * s, y + 3 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 2 * s, y - 8 * s); ctx.lineTo(x + 11 * s, y + 6 * s); ctx.lineTo(x + 2 * s, y + 3 * s); ctx.closePath(); ctx.fill();
  }
}

class ImageEffect {
  constructor(x, y, key, size, life = 0.35) { this.x = x; this.y = y; this.key = key; this.size = size; this.life = life; this.maxLife = life; this.dead = false; }
  update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
  draw(ctx) {
    const img = ImageAssets.effect(this.key);
    if (!img) return;
    ctx.save(); ctx.globalAlpha = clamp(this.life / this.maxLife, 0, 1);
    ImageAssets.draw(ctx, img, this.x, this.y, this.size);
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, vx, vy, color) { this.init(x, y, vx, vy, color); }
  init(x, y, vx, vy, color) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color; this.life = 0.4 + Math.random() * 0.4; this.maxLife = this.life; this.size = 2 + Math.random() * 3; this.dead = false; }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.92; this.vy *= 0.92; this.life -= dt; if (this.life <= 0) this.dead = true; }
  // RR:叠一个小号白热核心(而不是每个粒子都建渐变——粒子量大,渐变对象分配比多画一次fillRect贵)
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color; ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.fillStyle = "rgba(255,255,255,.55)"; const hs = this.size * 0.42; ctx.fillRect(this.x - hs / 2, this.y - hs / 2, hs, hs);
    ctx.globalAlpha = 1;
  }
}

// CC:冲击波圆环(击杀反馈)—— 从小圈快速扩散到 maxR 并淡出
class Shockwave {
  constructor(x, y, maxR, color) { this.x = x; this.y = y; this.maxR = maxR; this.color = color; this.r = maxR * 0.15; this.life = 0.4; this.maxLife = 0.4; this.dead = false; }
  update(dt) { this.life -= dt; if (this.life <= 0) { this.dead = true; return; } const t = 1 - this.life / this.maxLife; this.r = this.maxR * (0.15 + 0.85 * t); }
  // II:save/restore 包起来,不留 lineWidth/strokeStyle 尾巴(审计发现的同类隐患,目前无可见影响但顺手加固)
  // RR:描边改渐变(内侧亮白外侧渐隐到底色),比纯色圆环更有"能量冲击波"的质感
  draw(ctx) {
    ctx.save(); const t = 1 - this.life / this.maxLife; ctx.globalAlpha = Math.max(0, 1 - t) * 0.65;
    const g = ctx.createRadialGradient(this.x, this.y, Math.max(0, this.r - 6), this.x, this.y, this.r);
    g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, this.color);
    ctx.strokeStyle = g; ctx.lineWidth = 3 * (1 - t) + 1; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

// X4:平衡型必杀"破阵冲击波"——从玩家位置向上发射的弧形能量波,随行进逐渐变宽,清除沿途弹幕并对扫到的敌机造成一次伤害。
// 只在使用必杀时生成(低频事件),不进对象池,和 Shockwave 同样直接 new/丢弃。
class SpecialWave {
  constructor(x, y, color) { this.init(x, y, color); }
  init(x, y, color) {
    this.x = x; this.y = y; this.color = color || "#4dabf7";
    this.width = 70; this.thickness = 40; this.vy = -560; this.t = 0; this.dead = false; this.hitEnemies = new Set();
  }
  update(dt) { this.t += dt; this.y += this.vy * dt; this.width += 240 * dt; if (this.y < -this.thickness) this.dead = true; }
  // RR:三层叠加做出"精致"感——半透明扇形尾迹(残留能量)+ 渐变亮边(波前轮廓)+ 中心辉光描边(能量核心)
  draw(ctx) {
    const alpha = clamp(1 - this.t / 0.9, 0, 1), halfW = this.width / 2;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha * 0.9;
    const trailG = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.thickness * 1.8);
    trailG.addColorStop(0, UI.rgba(this.color, .35)); trailG.addColorStop(1, UI.rgba(this.color, 0));
    ctx.fillStyle = trailG;
    ctx.beginPath(); ctx.moveTo(this.x - halfW, this.y + this.thickness * 1.8); ctx.quadraticCurveTo(this.x, this.y - this.thickness * 0.3, this.x + halfW, this.y + this.thickness * 1.8); ctx.closePath(); ctx.fill();
    const edgeG = ctx.createLinearGradient(this.x - halfW, 0, this.x + halfW, 0);
    edgeG.addColorStop(0, UI.rgba(this.color, 0)); edgeG.addColorStop(0.5, "#fff"); edgeG.addColorStop(1, UI.rgba(this.color, 0));
    ctx.strokeStyle = edgeG; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(this.x - halfW, this.y + this.thickness * 0.5); ctx.quadraticCurveTo(this.x, this.y - this.thickness * 0.5, this.x + halfW, this.y + this.thickness * 0.5); ctx.stroke();
    ctx.globalAlpha = alpha * 0.75; ctx.shadowColor = this.color; ctx.shadowBlur = 16;
    ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.x - halfW * 0.7, this.y + this.thickness * 0.5); ctx.quadraticCurveTo(this.x, this.y - this.thickness * 0.3, this.x + halfW * 0.7, this.y + this.thickness * 0.5); ctx.stroke();
    ctx.restore();
  }
}

// DD:对象池 —— 高频 new/丢弃的四种对象(子弹×2/敌机/粒子)改为复用实例,减少无尽模式长时间运行的 GC 压力。
// 用法:pools.x.get(...同构造函数参数) 取一个(池里没有就 new 一个),对象标记 dead 后在 filter 之前 pools.x.release(o) 还回去。
class Pool {
  constructor(Ctor) { this.Ctor = Ctor; this.free = []; }
  get(...args) { const o = this.free.pop(); if (o) { o.init(...args); return o; } return new this.Ctor(...args); }
  release(o) { this.free.push(o); }
}
const pools = {
  playerBullet: new Pool(PlayerBullet),
  enemyBullet: new Pool(EnemyBullet),
  homingShot: new Pool(HomingShot),
  missile: new Pool(Missile),
  playerLaser: new Pool(PlayerLaser),
  enemy: new Pool(Enemy),
  particle: new Pool(Particle),
};
function pruneDead(list, release) {
  let write = 0;
  for (let read = 0; read < list.length; read++) {
    const o = list[read];
    if (o.dead) {
      if (release) release(o);
    } else {
      list[write++] = o;
    }
  }
  list.length = write;
}
const releaseDead = {
  playerBullet: (o) => pools.playerBullet.release(o),
  enemyBullet: (o) => pools.enemyBullet.release(o),
  homingShot: (o) => pools.homingShot.release(o),
  missile: (o) => pools.missile.release(o),
  playerLaser: (o) => pools.playerLaser.release(o),
  enemy: (o) => { if (!o.isBoss) pools.enemy.release(o); },
  particle: (o) => pools.particle.release(o),
};

class FloatText {
  constructor(x, y, text, color) { this.x = x; this.y = y; this.text = text; this.color = color; this.life = 0.8; this.dead = false; }
  update(dt) { this.y -= 32 * dt; this.life -= dt; if (this.life <= 0) this.dead = true; }
  draw(ctx) { ctx.globalAlpha = clamp(this.life / 0.8, 0, 1); ctx.fillStyle = this.color; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center"; ctx.fillText(this.text, this.x, this.y); ctx.textAlign = "left"; ctx.globalAlpha = 1; }
}
