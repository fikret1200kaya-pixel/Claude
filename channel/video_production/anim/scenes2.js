// ===== Scenes 2: too late → collapse → lessons → outro =====
function slam(s, x, y, t, t0, o = {}) { const p = t - t0; if (p < 0) return; const k = E.outB(cl(p / .3)); txt(s, x, y, Object.assign({ size: 200, color: '#fff', align: 'center', glow: 40, glowColor: ORANGE, sp: 6, scale: lerp(1.5, 1, cl(p / .15)), alpha: cl(p / .08) }, o)); }
function spot(x, y, r, a = 1) { ctx.save(); ctx.globalAlpha *= a; const g = ctx.createRadialGradient(x, y, 20, x, y, r); g.addColorStop(0, 'rgba(255,170,100,.40)'); g.addColorStop(1, 'rgba(255,170,100,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
function numeral(n, label, t, a, sub) {
  const lt = t - a, p = E.outQ(seg(lt, .1, .8));
  txt(n, 96, 470, { size: 400, color: ORANGE, sp: 4, glow: 40, alpha: p, scale: .8 + .2 * p });
  ctx.fillStyle = CREAM; ctx.fillRect(100, 510, 860 * E.outC(seg(lt, .5, 1.3)), 6);
  bigLine(label, 100, 620, seg(lt, .5, 1.5), { size: 96, sp: 5, color: '#fff' });
  if (sub) txt(sub, 100, 600, { size: 50, color: STEEL, sp: 4, alpha: seg(lt, 1.2, 2) });
}

scene('growing', T0(27), T0(29), (t, a) => {
  tag('05 · TOO LATE', t, a);
  const lt = t - a, bx = 880, by = 300, bw = 840, bh = 520, P = E.io(seg(t, a, T0(29) - .1));
  txt('NETFLIX', 100, 400, { size: 170, color: ORANGE, sp: 8, glow: 30, alpha: seg(lt, .1, .7) });
  const p4 = E.outQ(seg(t, T0(28) - .1, T0(28) + 1.6)), yr = Math.round(lerp(2000, 2004, p4));
  txt(String(yr), 100, 700, { size: 260, color: '#fff', sp: 5, glow: 30, glowColor: ORANGE, alpha: seg(t, T0(28) - .2, T0(28) + .3) });
  ctx.strokeStyle = 'rgba(245,241,232,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
  const f = x => Math.pow(x, 2.1) * .92 + .04;
  ctx.save(); ctx.beginPath(); ctx.moveTo(bx, by + bh); for (let i = 0; i <= 120; i++) { const x = i / 120; if (x > P) break; ctx.lineTo(bx + bw * x, by + bh * (1 - f(x))); } const lx = bx + bw * Math.min(P, 1); ctx.lineTo(lx, by + bh); ctx.closePath(); const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgba(255,107,26,.5)'); g.addColorStop(1, 'rgba(255,107,26,0)'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  glowStroke(() => { ctx.beginPath(); for (let i = 0; i <= 120; i++) { const x = i / 120; if (x > P) break; i ? ctx.lineTo(bx + bw * x, by + bh * (1 - f(x))) : ctx.moveTo(bx + bw * x, by + bh * (1 - f(x))); } }, ORANGE, 10, 24);
  const hx = bx + bw * Math.min(P, 1), hy = by + bh * (1 - f(Math.min(P, 1))); ctx.fillStyle = '#fff'; ctx.shadowColor = ORANGE; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(hx, hy, 13, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  txt('KEPT GROWING', bx + 20, by + 60, { size: 62, color: CREAM, sp: 6, alpha: seg(lt, .2, .9) });
  const ms = E.outB(seg(t, T0(28) + 1.2, T0(28) + 1.8)); if (ms > 0) txt('MILLIONS OF SUBSCRIBERS', bx + bw / 2, by + bh + 90, { size: 66, color: '#fff', align: 'center', sp: 5, glow: 24, glowColor: ORANGE, scale: ms, alpha: ms });
  txt('ILLUSTRATIVE', bx + bw, by - 20, { size: 26, color: STEEL, align: 'right', sp: 4 });
});
scene('wokeup', T0(29), T0(30), (t, a) => {
  tag('05 · TOO LATE', t, a);
  const lt = t - a, sh = Math.sin(lt * 60) * 6 * (1 - seg(lt, .8, 1.4));
  ctx.save(); ctx.translate(sh, 0); clockFace(520, 470, 220, lt * .35 + .1); ctx.restore();
  for (let i = 0; i < 2; i++) { const bs = i ? 1 : -1; glowStroke(() => { ctx.beginPath(); ctx.arc(520 + bs * 250, 470, 60 + (lt * 90 % 40), -.6, .6); }, ORANGE, 6, 10); }
  txt('FINALLY WOKE UP', 880, 400, { size: 130, color: '#fff', sp: 6, glow: 30, glowColor: ORANGE, alpha: seg(lt, .2, .8) });
  bigLine('ITS OWN ONLINE SERVICE', 884, 500, seg(t, CW(29, 'launched') - .2, CW(29, 'launched') + 1.6), { size: 68, sp: 5, color: CREAM });
  const tb = E.outB(seg(t, CW(29, 'program') - .2, CW(29, 'program') + .6)); if (tb > 0) { ctx.save(); ctx.translate(884, 580); ctx.scale(tb, tb); ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 30; rr(0, 0, 700, 150, 18); ctx.fill(); ctx.shadowBlur = 0; txt('TOTAL ACCESS', 350, 108, { size: 110, color: NAVY, align: 'center', sp: 8 }); ctx.restore(); }
});
scene('aggressive', T0(30), T0(33), (t, a) => {
  tag('05 · TOO LATE', t, a);
  slam('AGGRESSIVE.', W / 2, 420, t, T0(30) + .05, { size: 260 });
  if (t > T0(31) - .05) slam('GOOD.', W / 2, 700, t, T0(31) + .05, { size: 260, color: ORANGE, glowColor: '#fff' });
  if (t > T0(32) - .1) { const p = seg(t, T0(32) - .1, T0(32) + .5); ctx.save(); ctx.fillStyle = 'rgba(7,14,34,' + .95 * p + ')'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha *= p; txt('2004', W / 2, 330, { size: 250, color: '#fff', align: 'center', glow: 40, glowColor: ORANGE, sp: 8 });
    // price tag
    ctx.save(); ctx.translate(W / 2, 600); ctx.rotate(-.04); ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(-420, -90); ctx.lineTo(380, -90); ctx.lineTo(450, 0); ctx.lineTo(380, 90); ctx.lineTo(-420, 90); ctx.closePath(); ctx.fill(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(-370, 0, 22, 0, 7); ctx.fill();
    txt('LATE FEES', -20, 40, { size: 140, color: NAVY, align: 'center', sp: 8 }); ctx.restore();
    const cp = E.outC(seg(t, CW(32, 'scrapped') - .1, CW(32, 'scrapped') + .4)); cross(W / 2, 600, 300, RED, cp, 20);
    txt('SCRAPPED IN STORES', W / 2, 820, { size: 70, color: ORANGE, align: 'center', sp: 10, alpha: seg(t, CW(32, 'scrapped'), CW(32, 'scrapped') + .6) });
    ctx.restore(); }
});
scene('catch', T0(33), T0(37), (t, a) => {
  tag('05 · TOO LATE', t, a);
  if (t < T0(34) - .1) { slam('BUT THERE WAS A CATCH.', W / 2, H / 2 + 60, t, T0(33) + .05, { size: 190 }); return; }
  const lt = t - T0(34);
  // scale: wall street revenue vs strategy + debt
  if (t < T0(35) - .2) {
    const f = seg(t, T0(34) + .1, T0(34) + .8); ctx.save(); ctx.globalAlpha *= f;
    const bars = [['REVENUE WALL STREET', 'RELIED ON', STEEL, .85, .35], ['HEAVY', 'DEBT', RED, .25, .8]];
    bars.forEach(([l1, l2, col, h0, h1], i) => { const x = 360 + i * 640, p = E.io(seg(t, T0(34) + .8 + i * 2.6, T0(34) + 2.6 + i * 2.6)); const hh = lerp(h0, h1, p) * 560; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20; rr(x, 800 - hh, 300, hh, 10); ctx.fill(); ctx.shadowBlur = 0; txt(l1, x + 150, 850, { size: 40, color: CREAM, align: 'center', sp: 3 }); txt(l2, x + 150, 895, { size: 40, color: col === RED ? RED : CREAM, align: 'center', sp: 3 }); });
    txt('REVENUE ↓', 510, 300, { size: 90, color: STEEL, align: 'center', sp: 6, alpha: seg(t, T0(34) + 1.5, T0(34) + 2.5) }); txt('DEBT ↑', 1150, 300, { size: 90, color: RED, align: 'center', sp: 6, alpha: seg(t, T0(34) + 3.5, T0(34) + 4.2) });
    ctx.restore(); return; }
  if (t < T0(36) - .2) { const p = E.outC(seg(t, T0(35) - .1, T0(35) + .6)); const has = !!IMG.icahn; spot(has ? 520 : W / 2, 540, 620, p);
    if (has) portrait('icahn', 280, 220, 480, 580, p, t - T0(35));
    const tx = has ? 900 : W / 2, al = has ? 'left' : 'center';
    txt('INVESTOR', tx, has ? 420 : 330, { size: 60, color: ORANGE, sp: 12, align: al, alpha: p }); txt('CARL ICAHN', tx, 580, { size: has ? 170 : 230, color: '#fff', sp: 6, align: al, alpha: p, glow: 24, glowColor: ORANGE });
    bigLine('PUSHED BACK HARD.', tx + (has ? 4 : 0), 680, seg(t, T0(35) + .6, T0(35) + 1.8), { size: 76, sp: 4, color: CREAM, align: al }); return; }
  const p = E.outC(seg(t, T0(36) - .1, T0(36) + .6)); const has = !!IMG.antioco; spot(has ? 520 : W / 2, 540, 620, p);
  if (has) portrait('antioco', 280, 220, 480, 580, p, t - T0(36));
  const tx = has ? 900 : W / 2, al = has ? 'left' : 'center';
  txt('CEO', tx, has ? 400 : 330, { size: 60, color: ORANGE, sp: 12, align: al, alpha: p }); txt('JOHN ANTIOCO', tx, 550, { size: has ? 150 : 210, color: '#fff', sp: 6, align: al, alpha: p, glow: 24, glowColor: ORANGE });
  bigLine('CLASHED WITH THE BOARD', tx + (has ? 4 : 0), 640, seg(t, CW(36, 'clashed') - .1, CW(36, 'clashed') + 1.2), { size: 70, sp: 4, color: CREAM, align: al });
  const sv = seg(t, CW(36, 'seven') - .1, CW(36, 'seven') + .6); if (sv > 0) { ctx.save(); ctx.fillStyle = 'rgba(7,14,34,' + .9 * sv + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); framed(IMG.chair, 1130, 250, 560, 600, sv, t - CW(36, 'seven'), { a: sv }); txt('2007', 160, 520, { size: 340, color: '#fff', sp: 6, glow: 40, glowColor: ORANGE, alpha: sv }); bigLine('HE LEFT.', 168, 640, seg(t, CW(36, 'left') - .2, CW(36, 'left') + .6), { size: 120, sp: 6, color: ORANGE }); }
});
scene('replacement', T0(37), T0(39), (t, a) => {
  tag('05 · TOO LATE', t, a);
  const lt = t - a;
  if (t < T0(38) - .1) { storeIcon(1100, 330, 500, CREAM, 'VIDEO', E.outC(seg(lt, .2, 1)));
    const ap = E.outC(seg(lt, .8, 1.8)); glowStroke(() => { ctx.beginPath(); ctx.moveTo(1000, 760); ctx.bezierCurveTo(800, 900, 500, 900, 300, 560); }, ORANGE, 14, 24);
    ctx.save(); ctx.globalAlpha *= ap; ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.moveTo(1100, 700); ctx.lineTo(1000, 760); ctx.lineTo(1080, 840); ctx.closePath(); ctx.fill(); ctx.restore();
    txt('BACK TO STORES', 200, 360, { size: 140, color: '#fff', sp: 6, glow: 30, glowColor: ORANGE, alpha: seg(lt, .3, 1) }); bigLine('THE ONLINE PUSH PULLED BACK', 204, 450, seg(lt, 1.2, 3), { size: 64, sp: 4, color: STEEL }); return; }
  const p = E.outB(seg(t, T0(38) - .1, T0(38) + .6)); const pu = 1 + .06 * Math.sin(t * 5);
  playIcon(W / 2, 430, 150 * p * pu); txt('NETFLIX WAS ALREADY STREAMING', W / 2, 760, { size: 110, color: '#fff', align: 'center', sp: 6, glow: 24, glowColor: ORANGE, alpha: seg(t, T0(38) + .3, T0(38) + 1) });
  for (let i = 0; i < 6; i++) { const x = ((i * 380 + t * 160) % 2300) - 200; ctx.save(); ctx.globalAlpha *= .25; ctx.fillStyle = CREAM; rr(x, 880 + (i % 2) * 40, 220, 124, 10); ctx.fill(); ctx.restore(); }
});
scene('crisis', T0(39), T0(44), (t, a) => {
  tag('06 · THE COLLAPSE', t, a);
  const lt = t - a;
  if (t < T0(40) - .1) { slam('THE TIMING WAS BRUTAL.', W / 2, H / 2 + 60, t, T0(39) + .05, { size: 190 }); return; }
  if (t < T0(41) - .1) { // plunge
    const bx = 330, by = 300, bw = 1260, bh = 500, P = E.io(seg(t, T0(40), T0(41) - .2)); const r = rngf(8);
    const pts = Array.from({ length: 40 }, (_, i) => { const x = i / 39; return [x, .1 + .8 * x * x + (r() - .5) * .08]; });
    glowStroke(() => { ctx.beginPath(); pts.forEach(([x, y], i) => { if (x > P) return; i ? ctx.lineTo(bx + bw * x, by + bh * y) : ctx.moveTo(bx + bw * x, by + bh * y); }); }, RED, 10, 24);
    txt('2008', 100, 250, { size: 240, color: '#fff', sp: 6, glow: 30, glowColor: RED }); txt('THE FINANCIAL CRISIS', 110, 330, { size: 70, color: RED, sp: 8 }); return; }
  if (t < T0(42) - .1) { for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c, p = E.outC(seg(t, T0(41) + i * .12, T0(41) + .5 + i * .12)); const x = 280 + c * 380, y = 250 + r * 340; const clo = seg(t, T0(41) + .5 + i * .12, T0(41) + .9 + i * .12); ctx.save(); ctx.globalAlpha *= p * (1 - .55 * clo); storeIcon(x, y, 330, CREAM, 'VIDEO', 1); ctx.restore(); if (clo > 0) { ctx.save(); ctx.globalAlpha *= clo; ctx.fillStyle = RED; ctx.translate(x + 165, y + 200); ctx.rotate(-.12); rr(-110, -32, 220, 64, 8); ctx.fill(); txt('CLOSED', 0, 20, { size: 56, color: '#fff', align: 'center', sp: 4 }); ctx.restore(); } }
    txt('STORES WERE CLOSING.', W / 2, 960, { size: 80, color: CREAM, align: 'center', sp: 8 }); return; }
  if (t < T0(43) - .1) { const p = E.outB(seg(t, T0(42), T0(42) + .6)); ctx.save(); ctx.translate(W / 2, 520); ctx.scale(p, p);
    ctx.fillStyle = '#C8302B'; ctx.shadowColor = RED; ctx.shadowBlur = 40; rr(-190, -300, 380, 600, 24); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#0B1B3A'; rr(-150, -250, 300, 220, 12); ctx.fill(); ctx.fillStyle = '#fff'; rr(-150, 20, 300, 60, 8); ctx.fill(); txt('KIOSK', 0, -120, { size: 90, color: ORANGE, align: 'center', sp: 8 }); txt('$1', 0, 190, { size: 160, color: '#fff', align: 'center' }); ctx.restore();
    txt('RENTING MOVIES FOR A DOLLAR', W / 2, 960, { size: 80, color: CREAM, align: 'center', sp: 8, alpha: seg(t, T0(42) + .6, T0(42) + 1.3) }); return; }
  // devices
  const dv = [['LIVING ROOMS', 'tv'], ['GAME CONSOLES', 'pad'], ['PHONES', 'phone']];
  const kk = ['living', 'consoles', 'phones'];
  dv.forEach(([lbl, ic], i) => { const x = 380 + i * 580, tt = [CW(43, 'living'), CW(43, 'game'), CW(43, 'phones')][i], p = E.outB(seg(t, tt - .15, tt + .45)); if (p <= 0) return;
    ctx.save(); ctx.translate(x, 520); ctx.scale(p, p); ctx.strokeStyle = CREAM; ctx.lineWidth = 8; ctx.shadowColor = ORANGE; ctx.shadowBlur = 20;
    if (ic == 'tv') { rr(-170, -120, 340, 220, 14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60, 150); ctx.lineTo(60, 150); ctx.moveTo(0, 100); ctx.lineTo(0, 150); ctx.stroke(); }
    if (ic == 'pad') { rr(-190, -70, 380, 160, 70); ctx.stroke(); ctx.beginPath(); ctx.arc(-110, 10, 22, 0, 7); ctx.moveTo(133, 10); ctx.arc(110, 10, 22, 0, 7); ctx.stroke(); }
    if (ic == 'phone') { rr(-80, -150, 160, 300, 24); ctx.stroke(); }
    ctx.shadowBlur = 0; playIcon(0, ic == 'pad' ? 10 : -10, 36); ctx.restore();
    txt(lbl, x, 800, { size: 70, color: CREAM, align: 'center', sp: 6, alpha: p }); });
  txt('NETFLIX WAS EVERYWHERE', W / 2, 260, { size: 130, color: '#fff', align: 'center', sp: 6, glow: 30, glowColor: ORANGE, alpha: seg(t, T0(43), T0(43) + .6) });
});
scene('bankrupt', T0(44), T0(46), (t, a) => {
  tag('06 · THE COLLAPSE', t, a);
  const lt = t - a;
  if (t < T0(45) - .1) { framed(IMG.closed, 1100, 200, 640, 700, seg(lt, .1, .8), lt, { rot: .015 }); txt('SEPTEMBER', 100, 290, { size: 110, color: STEEL, sp: 12 }); txt('2010', 100, 610, { size: 340, color: '#fff', sp: 6, glow: 40, glowColor: RED });
    const sp = t - (CW(44, 'bankruptcy') - .2); const [sx, sy] = shakeAt(sp); flash(sp); ctx.save(); ctx.translate(sx, sy); stamp('CHAPTER 11', 580, 800, sp, RED, 150, -.07); ctx.restore(); return; }
  const lt2 = t - T0(45); const p = E.io(seg(t, CW(45, 'dish') - .1, CW(45, 'dish') + 2.2));
  txt('2011', 100, 380, { size: 260, color: '#fff', sp: 6, glow: 30, glowColor: ORANGE }); txt('DISH NETWORK BUYS THE REMAINING ASSETS', 104, 470, { size: 66, color: CREAM, sp: 5, alpha: seg(lt2, .1, .8) });
  txt('≈ $' + fmt(300000000 * p), W / 2, 780, { size: 260, color: ORANGE, align: 'center', sp: 6, glow: 36, alpha: seg(lt2, .4, 1) });
  txt('ONCE A 9,000-STORE EMPIRE', W / 2, 880, { size: 54, color: STEEL, align: 'center', sp: 10, alpha: seg(lt2, 3, 3.8) });
});
scene('bend', T0(46), T0(47), (t, a) => {
  tag('06 · THE COLLAPSE', t, a);
  const lt = t - a; ctx.save(); ctx.translate(230, 0); drawMap(seg(lt, 0, .8), t); const [x, y] = mp(...CITY.bend); pin(x, y, seg(t, CW(46, 'bend') - .3, CW(46, 'bend') + 1), 'BEND, OREGON'); ctx.restore();
  txt('ONLY ONE', 100, 330, { size: 130, color: '#fff', sp: 6, glow: 30, glowColor: ORANGE, alpha: seg(lt, .2, .9) }); txt('STILL OPEN', 100, 450, { size: 130, color: ORANGE, sp: 6, alpha: seg(lt, .8, 1.5) });
  bigLine('NOW A TOURIST ATTRACTION', 104, 560, seg(t, CW(46, 'tourist') - .2, CW(46, 'attraction') + .8), { size: 66, sp: 5, color: CREAM });
});
scene('whatwrong', T0(47), T0(49), (t, a) => {
  tag('07 · THE LESSONS', t, a);
  const lt = t - a; slam('WHAT WENT WRONG?', W / 2, 460, t, T0(47) + .05, { size: 220 });
  if (t > T0(48)) { const n = 3; for (let i = 0; i < n; i++) { const p = E.outB(seg(t, T0(48) + .2 + i * .22, T0(48) + .6 + i * .22)); ctx.save(); ctx.translate(W / 2 + (i - 1) * 200, 760); ctx.scale(p, p); ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 30; rr(-70, -90, 140, 180, 20); ctx.fill(); ctx.shadowBlur = 0; txt(String(i + 1), 0, 50, { size: 150, color: NAVY, align: 'center' }); ctx.restore(); } txt('THREE THINGS', W / 2, 960, { size: 70, color: CREAM, align: 'center', sp: 14, alpha: seg(t, T0(48) + .3, T0(48) + 1) }); }
});
scene('lesson1', T0(49), T0(52), (t, a) => {
  tag('07 · THE LESSONS', t, a); numeral('01', 'DEFEND THE OLD MODEL', t, a);
  const lt = t - a; storeIcon(1160, 330, 440, CREAM, 'VIDEO', E.outC(seg(lt, 1, 1.8)));
  const sp = E.outB(seg(t, T0(51) - .1, T0(51) + .6)); if (sp > 0) { ctx.save(); ctx.translate(1380, 520); ctx.scale(sp * 1.3, sp * 1.3); ctx.strokeStyle = ORANGE; ctx.lineWidth = 12; ctx.shadowColor = ORANGE; ctx.shadowBlur = 30; ctx.beginPath(); ctx.moveTo(0, -220); ctx.bezierCurveTo(200, -200, 230, -120, 220, 0); ctx.bezierCurveTo(200, 150, 80, 220, 0, 260); ctx.bezierCurveTo(-80, 220, -200, 150, -220, 0); ctx.bezierCurveTo(-230, -120, -200, -200, 0, -220); ctx.stroke(); ctx.restore(); }
  bigLine('LATE FEES AND STORES FELT SAFE.', 104, 730, seg(t, T0(51), T0(51) + 2), { size: 62, sp: 4, color: CREAM });
  bigLine('CUSTOMERS MOVED ON.', 104, 810, seg(t, CW(51, 'while') - .2, CW(51, 'moved') + 1), { size: 62, sp: 4, color: ORANGE });
});
scene('lesson2', T0(52), T0(56), (t, a) => {
  tag('07 · THE LESSONS', t, a); numeral('02', 'SMALL ≠ HARMLESS', t, a);
  const g = E.io(seg(t, T0(54) - .1, T0(55) + 2.8)), r = lerp(14, 300, Math.pow(g, 2));
  ctx.save(); ctx.translate(1380, 640); ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 50; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0; txt('NETFLIX', 0, 18, { size: Math.min(110, r * .45 + 12), color: NAVY, align: 'center', sp: 4 }); ctx.restore();
  storeIcon(1060, 300, 220, CREAM, 'VIDEO', seg(t, a + .8, a + 1.4) * (1 - .6 * g));
  bigLine('TINY… BUT HEADED WHERE CUSTOMERS WERE', 104, 760, seg(t, T0(55), T0(55) + 2.6), { size: 56, sp: 3, color: CREAM });
});
scene('lesson3', T0(56), T0(59), (t, a) => {
  tag('07 · THE LESSONS', t, a); numeral('03', 'TOO LATE', t, a);
  const lt = t - a, sp = seg(t, T0(57), T0(57) + 2.4);
  clockFace(1380, 400, 190, lt * .25 + .6);
  bigLine('WITHOUT FULL COMMITMENT.', 104, 740, seg(t, CW(57, 'without') - .1, CW(57, 'commitment') + .6), { size: 62, sp: 4, color: CREAM });
  const fp = E.outC(seg(t, T0(58) - .1, T0(58) + 1)); if (fp > 0) { const sh = Math.sin(t * 12) * 6 * fp; ctx.save(); ctx.globalAlpha *= fp; glowStroke(() => { ctx.beginPath(); ctx.moveTo(1100 + sh, 740); ctx.lineTo(1350 + sh, 740); }, ORANGE, 16, 20); glowStroke(() => { ctx.beginPath(); ctx.moveTo(1650 - sh, 740); ctx.lineTo(1400 - sh, 740); }, STEEL, 16, 20); ctx.restore(); }
  bigLine('LEADERSHIP FOUGHT ITSELF.', 104, 820, seg(t, T0(58) + .4, T0(58) + 2.2), { size: 62, sp: 4, color: ORANGE });
});
scene('reinvent', T0(59), T0(62), (t, a) => {
  tag('08 · THE DIFFERENCE', t, a);
  const lt = t - a; txt('NETFLIX KEPT', 100, 300, { size: 130, color: '#fff', sp: 6, alpha: seg(lt, .1, .7) }); txt('CANNIBALIZING ITSELF', 100, 420, { size: 130, color: ORANGE, sp: 6, glow: 24, alpha: seg(lt, .5, 1.1) });
  const xs = [380, 960, 1540], pr = seg(t, T0(60) - .1, T0(60) + 4.2);
  glowStroke(() => { ctx.beginPath(); ctx.moveTo(xs[0], 760); ctx.lineTo(lerp(xs[0], xs[2], E.io(pr)), 760); }, 'rgba(255,107,26,.7)', 8, 12);
  const lab = ['DVDs', 'STREAMING', 'OWN SHOWS'], tm = [T0(60), CW(60, 'streaming') - .3, CW(60, 'making') - .3];
  xs.forEach((x, i) => { const p = E.outB(seg(t, tm[i], tm[i] + .5)); if (i == 0) { disc(x, 620, 110 * Math.min(1, seg(lt, 1, 1.6)), t * 3); txt(lab[i], x, 860, { size: 64, color: CREAM, align: 'center', sp: 5, alpha: seg(lt, 1, 1.6) }); return; } if (p <= 0) return; if (i == 1) playIcon(x, 620, 80 * p); else star(x, 620, 110 * p, 1); txt(lab[i], x, 860, { size: 64, color: CREAM, align: 'center', sp: 5, alpha: p }); });
});
scene('comfortable', T0(62), T0(64), (t, a) => {
  tag('08 · THE DIFFERENCE', t, a);
  framed(IMG.chair, 1330, 230, 440, 560, seg(t, a, a + .8), t - a, { a: .6 });
  const dm = seg(t, T0(63) - .1, T0(63) + .4);
  txt('NOT STUPID.', 100, 480, { size: 220, color: '#fff', sp: 6, glow: 30, glowColor: ORANGE, alpha: (1 - .55 * dm) * seg(t, a + .1, a + .6) });
  if (dm > 0) { const sp = t - (CW(63, 'comfortable') - .1); const p = E.outB(seg(t, T0(63), T0(63) + .6)); txt('COMFORTABLE.', 100, 720, { size: 220, color: ORANGE, sp: 6, glow: 40, glowColor: ORANGE, alpha: p, scale: .85 + .15 * p }); }
  const cp = E.outC(seg(t, T0(62) + 1.2, T0(62) + 1.7)); if (cp > 0) { ctx.save(); ctx.fillStyle = RED; ctx.shadowColor = RED; ctx.shadowBlur = 20; ctx.fillRect(100, 270, 1000 * cp, 10); ctx.restore(); }
});
scene('question', T0(64), T0(65), (t, a) => {
  tag('08 · THE DIFFERENCE', t, a);
  const lt = t - a, p = E.outC(seg(lt, .2, 1));
  ctx.save(); ctx.globalAlpha *= p; ctx.fillStyle = 'rgba(111,134,179,.15)'; rr(120, 300, 770, 520, 24); ctx.fill(); ctx.fillStyle = 'rgba(255,107,26,.16)'; rr(1030, 300, 770, 520, 24); ctx.fill(); ctx.restore();
  txt('PROTECT', 505, 470, { size: 130, color: STEEL, align: 'center', sp: 8, alpha: seg(t, CW(64, 'protecting') - .2, CW(64, 'protecting') + .5) }); txt('WHAT MADE YOU', 505, 570, { size: 80, color: CREAM, align: 'center', sp: 6, alpha: seg(t, CW(64, 'protecting') + .2, CW(64, 'protecting') + .8) }); txt('SUCCESSFUL', 505, 660, { size: 100, color: CREAM, align: 'center', sp: 6, alpha: seg(t, CW(64, 'successful') - .3, CW(64, 'successful') + .4) });
  const bt = CW(64, 'building'); txt('BUILD', 1415, 470, { size: 130, color: ORANGE, align: 'center', sp: 8, glow: 24, alpha: seg(t, bt - .2, bt + .5) }); txt('WHAT COMES', 1415, 570, { size: 80, color: CREAM, align: 'center', sp: 6, alpha: seg(t, bt, bt + .7) }); txt('NEXT', 1415, 670, { size: 130, color: '#fff', align: 'center', sp: 10, glow: 24, glowColor: ORANGE, alpha: seg(t, CW(64, 'next') - .2, CW(64, 'next') + .5) });
  txt('OR', W / 2, 560, { size: 90, color: '#fff', align: 'center', sp: 6, alpha: seg(t, CW(64, 'or') - .1, CW(64, 'or') + .4) });
  txt('THE QUESTION EVERY BUSINESS HAS TO ASK', W / 2, 220, { size: 74, color: CREAM, align: 'center', sp: 8, alpha: seg(lt, .2, 1) });
});
scene('outro', T0(65), DATA.T + 2, (t, a) => {
  const lt = t - a;
  if (IMG.logo) { const p = E.outB(seg(lt, .1, .8)); ctx.save(); ctx.translate(480, 440); ctx.scale(p, p); ctx.fillStyle = '#0B1B3A'; ctx.beginPath(); ctx.arc(0, 0, 190, 0, 7); ctx.fill(); ctx.drawImage(IMG.logo, -150, -150, 300, 300); ctx.restore(); }
  txt('RISE & RUIN', 480, 760, { size: 120, color: '#fff', align: 'center', sp: 8, alpha: seg(lt, .4, 1) });
  const sp = E.outB(seg(t, T0(65) + .3, T0(65) + .9)); if (sp > 0) { ctx.save(); ctx.translate(480, 880); ctx.scale(sp, sp); const press = Math.max(0, Math.sin(seg(t, T0(65) + 1.4, T0(65) + 1.8) * Math.PI)); ctx.scale(1 - .06 * press, 1 - .06 * press); ctx.fillStyle = RED; rr(-190, -48, 380, 96, 48); ctx.fill(); txt('SUBSCRIBE', 0, 20, { size: 66, color: '#fff', align: 'center', sp: 6 }); ctx.restore(); }
  const nx = E.outC(seg(t, CW(66, 'next') - .2, CW(66, 'next') + .8));
  if (nx > 0) { txt('NEXT UP', 1330, 250, { size: 70, color: ORANGE, align: 'center', sp: 14, alpha: nx });
    ctx.save(); ctx.translate(lerp(2200, 1330, nx), 520); ctx.rotate(.02); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 40; ctx.save(); rr(-440, -248, 880, 496, 10); ctx.clip(); if (IMG.kodak) ctx.drawImage(IMG.kodak, -440, -248, 880, 496); ctx.restore(); ctx.shadowBlur = 0; ctx.strokeStyle = ORANGE; ctx.lineWidth = 6; rr(-440, -248, 880, 496, 10); ctx.stroke(); ctx.restore(); }
});
