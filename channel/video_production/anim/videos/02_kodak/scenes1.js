// ===== Kodak — scenes 1: cold open → the dilemma =====
// Every scene uses a realistic documentary photo (assets/kodak/kNN.jpg) when available,
// otherwise it falls back to the animated graphic background.
function yearCounter(from, to, x, y, t, t0, dur = 1.6, size = 300, o = {}) {
  const p = E.outQ(seg(t, t0, t0 + dur)); txt(String(Math.round(lerp(from, to, p))), x, y, Object.assign({ size, color: '#fff', sp: 6, glow: 40, glowColor: ORANGE }, o));
}
function pixelImage(img, x, y, w, h, p, cells = 100) {   // 0.01 MP = 100 x 100 pixels, revealed line by line
  if (!pixelImage.cache && img) { const c = document.createElement('canvas'); c.width = c.height = cells; const g = c.getContext('2d'); const s = Math.min(img.width, img.height); g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, cells, cells); const d = g.getImageData(0, 0, cells, cells).data; pixelImage.cache = []; for (let i = 0; i < cells * cells; i++) pixelImage.cache.push((d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) | 0); }
  const px = w / cells, py = h / cells, rows = Math.floor(cells * p);
  ctx.fillStyle = '#05080f'; ctx.fillRect(x, y, w, h);
  if (pixelImage.cache) for (let r = 0; r < rows; r++) for (let c = 0; c < cells; c++) { const v = pixelImage.cache[r * cells + c]; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x + c * px, y + r * py, px + .5, py + .5); }
  if (p < 1) { ctx.fillStyle = 'rgba(255,107,26,.9)'; ctx.fillRect(x, y + rows * py, w, 3); }
  ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
}

// --- COLD OPEN ---
scene('k_1975', 0, T0(2), (t, a, b) => {
  photoBG(['k01'], t, a, b + 3, { pan: [-1, 0], zoom: [1.12, 1.2] }) || framed(IMG.proto, 1100, 200, 680, 640, seg(t, .3, 1.1), t, { rot: .015 });
  letterbox(1);
  yearCounter(1960, 1975, 110, 400, t, .1, 1.6, 300);
  [['TOASTER-SIZED', 'toaster'], ['A LENS', 'lens'], ['A TAPE RECORDER', 'tape'], ['A TINY SCREEN', 'screen']].forEach(([s, w], i) => chip(s, 120, 520 + i * 82, E.outC(seg(t, CW(1, w) - .15, CW(1, w) + .35))));
});
scene('k_first', T0(2), T0(3), (t, a, b) => {
  photoBG(['k01'], t, a - 3, b, { pan: [1, 0], zoom: [1.18, 1.26], side: 'bottom', dark: .7 }) || framed(IMG.proto, 710, 110, 500, 470, 1, t, {});
  letterbox(1); flash(t - a - .05, '255,200,120');
  slam("THE WORLD'S FIRST", W / 2, 720, t, a + .05, { size: 120, color: CREAM });
  slam('DIGITAL CAMERA', W / 2, 880, t, a + .35, { size: 220 });
});
scene('k_quote', T0(3), CW(3, 'thirty') - .15, (t, a, b) => {
  photoBG(['k03'], t, a, b, { pan: [0, -1], side: 'left', dark: .8 });
  letterbox(1);
  quoteCard("THAT'S CUTE... BUT DON'T TELL ANYONE ABOUT IT.", 160, 360, seg(t, CW(3, 'thats') - .1, CW(3, 'it') + .4), { size: 110, width: 1250, by: 'KODAK MANAGEMENT, AS RECALLED BY ENGINEER STEVE SASSON' });
});
scene('k_37years', CW(3, 'thirty') - .15, CW(3, 'bankruptcy') + 1.1, (t, a, b) => {
  const p = E.io(seg(t, a + .1, CW(3, 'kodak') + .2));
  ctx.strokeStyle = 'rgba(245,241,232,.25)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(260, 600); ctx.lineTo(1660, 600); ctx.stroke();
  glowStroke(() => { ctx.beginPath(); ctx.moveTo(260, 600); ctx.lineTo(lerp(260, 1660, p), 600); }, ORANGE, 8, 18);
  txt('1975', 260, 690, { size: 90, color: CREAM, align: 'center', sp: 4 }); txt('2012', 1660, 690, { size: 90, color: CREAM, align: 'center', sp: 4, alpha: seg(p, .8, 1) });
  txt(String(Math.round(lerp(1975, 2012, p))), lerp(260, 1660, p), 540, { size: 140, color: '#fff', align: 'center', glow: 30, glowColor: ORANGE });
  txt('37 YEARS LATER', W / 2, 330, { size: 110, color: CREAM, align: 'center', sp: 12, alpha: seg(t, a, a + .5) });
  const sp = t - (CW(3, 'bankruptcy') - .1); flash(sp); const [sx, sy] = shakeAt(sp); ctx.save(); ctx.translate(sx, sy); stamp('BANKRUPT', W / 2, 860, sp, RED, 200, -.08); ctx.restore();
});
scene('k_title', CW(3, 'bankruptcy') + 1.1, T0(4) + 2.4, (t, a) => {
  const lt = t - a, pr = E.outQ(seg(lt, .1, 1.2));
  photoBG(['k15', 'k01'], t, a, a + 6, { side: 'none', tint: .6, alpha: .7 });
  txt('THE INVENTION THEY BURIED', W / 2, H / 2 + 50, { size: 170, color: '#fff', align: 'center', sp: lerp(36, 8, pr), alpha: pr, glow: 36, glowColor: ORANGE });
  ctx.fillStyle = ORANGE; const lw = 860 * E.outC(seg(lt, .6, 1.5)); ctx.fillRect(W / 2 - lw / 2, H / 2 + 90, lw, 8);
  txt('HOW KODAK MISSED ITS OWN REVOLUTION', W / 2, H / 2 + 175, { size: 58, color: CREAM, align: 'center', sp: 10, alpha: seg(lt, .9, 1.7) });
  if (IMG.logo) { ctx.save(); ctx.globalAlpha *= seg(lt, 0, .8); ctx.drawImage(IMG.logo, W / 2 - 70, 170, 140, 140); ctx.restore(); }
  letterbox(1);
});

// --- THE EMPIRE ---
scene('k_eastman', T0(4) + 2.4, T0(5), (t, a, b) => {
  photoBG(['k04'], t, a, b, { pan: [1, 0], side: 'left', dark: .7 });
  tag('01 · THE EMPIRE', t, a);
  const hasP = portrait('eastman', 1330, 210, 440, 540, seg(t, a + .2, a + .9), t - a);
  txt('GEORGE EASTMAN', 110, 330, { size: 130, color: '#fff', sp: 6, glow: 24, glowColor: ORANGE, alpha: seg(t, a, a + .6) });
  txt('FOUNDER OF KODAK · LATE 1800s', 114, 400, { size: 52, color: ORANGE, sp: 8, alpha: seg(t, a + .3, a + .9) });
  const sl = seg(t, CW(4, 'you') - .1, CW(4, 'rest') + .4);
  if (sl > 0) quoteCard('YOU PRESS THE BUTTON, WE DO THE REST.', 70, 470, sl, { size: 84, width: hasP ? 1050 : 1500 });
  chip('PHOTOGRAPHY FOR EVERYONE', 120, 900, E.outC(seg(t, CW(4, 'photography') - .1, CW(4, 'photography') + .5)), { size: 50 });
  letterbox(1);
});
scene('k_century', T0(5), T0(7), (t, a, b) => {
  photoBG(['k07'], t, a, b, { pan: [-1, 0], side: 'left', dark: .75 });
  tag('01 · THE EMPIRE', t, a);
  txt('A CENTURY OF DOMINANCE', 110, 320, { size: 120, color: '#fff', sp: 6, glow: 24, glowColor: ORANGE, alpha: seg(t, a, a + .6) });
  const p = E.io(seg(t, a + .3, T0(6) - .2)); ctx.fillStyle = 'rgba(245,241,232,.15)'; rr(110, 380, 1100, 18, 9); ctx.fill(); ctx.fillStyle = ORANGE; rr(110, 380, 1100 * p, 18, 9); ctx.fill();
  txt('1880s', 110, 450, { size: 46, color: CREAM, sp: 4 }); txt('1980s', 1210, 450, { size: 46, color: CREAM, sp: 4, align: 'right', alpha: seg(p, .8, 1) });
  const m = E.io(seg(t, CW(6, 'majority') - .5, CW(6, 'majority') + 1.2));
  if (t > T0(6) - .2) {
    txt('US FILM & CAMERA SALES', 110, 600, { size: 62, color: CREAM, sp: 6, alpha: seg(t, T0(6) - .2, T0(6) + .4) });
    ctx.fillStyle = 'rgba(111,134,179,.35)'; rr(110, 640, 1100, 110, 12); ctx.fill();
    ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 30; rr(110, 640, 1100 * .85 * m, 110, 12); ctx.fill(); ctx.shadowBlur = 0;
    txt('KODAK', 140, 718, { size: 72, color: NAVY, sp: 6, alpha: m }); txt('OTHERS', 1190, 718, { size: 40, color: CREAM, align: 'right', sp: 4, alpha: m });
    txt('THE VAST MAJORITY', 110, 830, { size: 70, color: '#fff', sp: 6, alpha: seg(m, .6, 1) }); txt('ILLUSTRATIVE', 1210, 800, { size: 26, color: STEEL, align: 'right', sp: 4, alpha: m });
  }
  letterbox(1);
});
scene('k_employees', T0(7), T0(8), (t, a, b) => {
  photoBG(['k05', 'factory_startup'], t, a, b, { pan: [0, 1], zoom: [1.05, 1.18], side: 'bottom', dark: .7 });
  tag('01 · THE EMPIRE', t, a);
  const p = E.io(seg(t, CW(7, 'well') - .3, CW(7, 'people') + .2));
  txt(fmt(100000 * p) + (p >= 1 ? '+' : ''), W / 2, 700, { size: 300, color: '#fff', align: 'center', sp: 6, glow: 46, glowColor: ORANGE });
  txt('EMPLOYEES AT THE PEAK · 1980s', W / 2, 800, { size: 64, color: ORANGE, align: 'center', sp: 10, alpha: seg(t, a + .3, a + 1) });
  letterbox(1);
});
scene('k_razor', T0(8), T0(9), (t, a, b) => {
  photoBG(['k06'], t, a, b, { pan: [1, 0], side: 'none', tint: .6, dark: .9 });
  ctx.fillStyle = 'rgba(4,10,26,.45)'; ctx.fillRect(0, 0, W, H);
  tag('01 · THE EMPIRE', t, a);
  txt('THE RAZOR-AND-BLADES MODEL', W / 2, 250, { size: 100, color: '#fff', align: 'center', sp: 8, glow: 24, glowColor: ORANGE, alpha: seg(t, a, a + .6) });
  const c1 = E.outB(seg(t, CW(8, 'camera') - .2, CW(8, 'camera') + .4));
  if (c1 > 0) { ctx.save(); ctx.translate(430, 560); ctx.scale(c1, c1); camIcon(0, 0, 260); ctx.restore(); chip('SELL THE CAMERA CHEAP', 230, 800, c1, { size: 44 }); }
  const f = seg(t, CW(8, 'forever') - .3, b);
  if (f > 0) {
    glowStroke(() => { ctx.beginPath(); ctx.moveTo(640, 560); ctx.lineTo(lerp(640, 900, cl(f * 4)), 560); }, ORANGE, 10, 16);
    for (let i = 0; i < 5; i++) { const q = cl(f * 3 - i * .25); if (q <= 0) continue; filmRoll(1000 + i * 150, 560 + Math.sin(t * 3 + i) * 10, 150, E.outB(cl(q * 2))); }
    for (let i = 0; i < 10; i++) { const q = ((t * .6 + i / 10) % 1); coin(1000 + (i % 5) * 150 + 40, 460 - q * 300, 26, (1 - q) * cl(f * 3)); }
    chip('EARN FOREVER ON FILM', 1030, 800, cl(f * 3), { size: 44 });
  }
  letterbox(1);
});

// --- THE INVENTION ---
scene('k_sasson', T0(9), T0(10), (t, a, b) => {
  photoBG(['k01', 'proto'], t, a, b, { pan: [1, 0], side: 'left', dark: .8 });
  tag('02 · THE INVENTION', t, a);
  yearCounter(1970, 1975, 110, 380, t, a, 1.0, 230);
  const hasP = portrait('sasson', 1340, 220, 420, 520, seg(t, CW(9, 'steve') - .2, CW(9, 'steve') + .5), t - a);
  txt('STEVE SASSON', 110, 520, { size: 130, color: '#fff', sp: 6, glow: 24, glowColor: ORANGE, alpha: seg(t, CW(9, 'steve') - .2, CW(9, 'steve') + .4) });
  txt('KODAK ENGINEER', 114, 590, { size: 56, color: ORANGE, sp: 10, alpha: seg(t, CW(9, 'engineer') - .2, CW(9, 'engineer') + .4) });
  bigLine('BUILDS THE FIRST SELF-CONTAINED DIGITAL CAMERA', 114, 700, seg(t, CW(9, 'built') - .1, b - .3), { size: 52, sp: 3 });
  if (!hasP && !IMG.k01) framed(IMG.proto, 1300, 200, 480, 560, seg(t, a, a + .8), t - a, { rot: .015 });
  letterbox(1);
});
scene('k_specs', T0(10), T0(11), (t, a, b) => {
  tag('02 · THE INVENTION', t, a);
  const p = seg(t, a + .3, b - .3);
  pixelImage(IMG.k01 || IMG.proto, 1080, 190, 640, 640, p);
  txt('100 × 100 PIXELS', 1400, 900, { size: 46, color: STEEL, align: 'center', sp: 6 });
  const specs = [['0.01 MEGAPIXELS', 'zero'], ['BLACK & WHITE', 'black'], ['~23 SECONDS PER PHOTO', 'twenty'], ['SAVED TO A CASSETTE TAPE', 'cassette']];
  specs.forEach(([s, w], i) => chip(s, 120, 330 + i * 120, E.outC(seg(t, CW(10, w) - .15, CW(10, w) + .35)), { size: 62 }));
  const tp = seg(t, CW(10, 'cassette'), CW(10, 'cassette') + .6); if (tp > 0) tape(330, 880, 170, tp);
  letterbox(1);
});
scene('k_confusion', T0(11), T0(12), (t, a, b) => {
  photoBG(['k03'], t, a, b, { pan: [1, 0], side: 'left', dark: .8 });
  tag('02 · THE INVENTION', t, a);
  txt('MANAGEMENT\'S REACTION', 110, 300, { size: 70, color: STEEL, sp: 8, alpha: seg(t, a, a + .5) });
  const e1 = seg(t, CW(11, 'less') - .1, CW(11, 'excitement') + .3), e2 = seg(t, CW(11, 'more') - .1, CW(11, 'confusion') + .3);
  txt('LESS EXCITEMENT.', 110, 470, { size: 160, color: '#fff', sp: 6, alpha: e1 * (1 - .5 * e2) });
  txt('MORE CONFUSION.', 110, 640, { size: 160, color: ORANGE, sp: 6, glow: 30, alpha: e2 });
  for (let i = 0; i < 3; i++) txt('?', 1300 + i * 170, 560 - Math.sin(t * 2 + i) * 20, { size: 220, color: ORANGE, alpha: .8 * seg(e2, .2 + i * .2, .5 + i * .2), glow: 24 });
  letterbox(1);
});
scene('k_tv', T0(12), T0(13), (t, a, b) => {
  const has = photoBG(['k02'], t, a, b, { pan: [-1, 0], side: 'left', dark: .7 });
  tag('02 · THE INVENTION', t, a);
  if (!has) crtIcon(1350, 540, 520, seg(t, a, a + .6));
  bigLine('WHY WOULD ANYONE WANT TO LOOK AT', 110, 430, seg(t, a + .1, CW(12, 'pictures')), { size: 70, sp: 4, color: CREAM });
  txt('PICTURES ON A TV SCREEN?', 110, 580, { size: 140, color: '#fff', sp: 6, glow: 30, glowColor: ORANGE, alpha: seg(t, CW(12, 'pictures') - .1, CW(12, 'pictures') + .4) });
  letterbox(1);
});
scene('k_threat', T0(13), T0(14), (t, a, b) => {
  photoBG(['k06'], t, a, b, { pan: [0, -1], side: 'left', dark: .85 });
  tag('02 · THE INVENTION', t, a);
  bigLine("IT THREATENED KODAK'S MOST PROFITABLE BUSINESS:", 110, 400, seg(t, CW(13, 'threatened') - .2, CW(13, 'business') + .2), { size: 66, sp: 3, color: CREAM });
  const f = E.outB(seg(t, CW(13, 'film') - .15, CW(13, 'film') + .4)), pulse = 1 + .04 * Math.sin(t * 8);
  txt('FILM.', 110, 690, { size: 330 * (f > 0 ? pulse : 1), color: ORANGE, sp: 10, glow: 50, alpha: Math.min(1, f) });
  letterbox(1);
});
scene('k_patent', T0(14), T0(15), (t, a, b) => {
  photoBG(['k09'], t, a, b, { pan: [1, 0], side: 'left', dark: .85 });
  tag('02 · THE INVENTION', t, a);
  const sp = t - (CW(14, 'patent') - .05); const [sx, sy] = shakeAt(sp, 10); ctx.save(); ctx.translate(sx, sy); stamp('PATENTED', 560, 420, sp, ORANGE, 170, -.08); ctx.restore();
  const c = seg(t, CW(14, 'sold') - .2, CW(14, 'sold') + .8);
  for (let i = 0; i < 3; i++) { const q = E.outB(seg(c, i * .2, .4 + i * .2)); if (q > 0) { ctx.save(); ctx.translate(320 + i * 260, 760); ctx.scale(q, q); camIcon(0, 0, 180); ctx.restore(); } }
  txt('1990s: EARLY DIGITAL CAMERAS', 110, 940, { size: 56, color: CREAM, sp: 6, alpha: c });
  letterbox(1);
});
scene('k_protect', T0(15), T0(16), (t, a, b) => {
  photoBG(['k08'], t, a, b, { pan: [-1, 0], side: 'right', dark: .6, tint: .2 });
  tag('02 · THE INVENTION', t, a);
  const p = E.outB(seg(t, CW(15, 'protecting') - .2, CW(15, 'protecting') + .5));
  if (p > 0) { ctx.save(); ctx.translate(560, 540); ctx.scale(p, p); ctx.strokeStyle = ORANGE; ctx.lineWidth = 14; ctx.shadowColor = ORANGE; ctx.shadowBlur = 30; ctx.beginPath(); ctx.moveTo(0, -260); ctx.bezierCurveTo(230, -240, 260, -140, 250, 0); ctx.bezierCurveTo(230, 170, 90, 250, 0, 300); ctx.bezierCurveTo(-90, 250, -230, 170, -250, 0); ctx.bezierCurveTo(-260, -140, -230, -240, 0, -260); ctx.stroke(); ctx.restore(); filmRoll(560, 560, 260, p); }
  const m = seg(t, CW(15, 'printing') - .3, b);
  for (let i = 0; i < 14; i++) { const q = ((t * .35 + i / 14) % 1); bill(900 + (i * 137 % 900), -60 + q * 1200, 120, Math.sin(i + t) * .6, cl(m * 3) * .9); }
  txt('STILL PRINTING MONEY', 1300, 900, { size: 90, color: '#fff', align: 'center', sp: 6, glow: 24, glowColor: ORANGE, alpha: cl(m * 3) });
  letterbox(1);
});

// --- THE DILEMMA ---
scene('k_dilemma', T0(16), T0(19), (t, a, b) => {
  tag('03 · THE DILEMMA', t, a);
  if (t < T0(17) - .1) { slam("THE INNOVATOR'S", W / 2, 470, t, a + .05, { size: 150, color: CREAM }); slam('DILEMMA', W / 2, 680, t, a + .35, { size: 260 }); letterbox(1); return; }
  if (t < T0(18) - .1) {
    const bx = 330, by = 300, bw = 1260, bh = 480, P = E.io(seg(t, T0(17), T0(18) - .4));
    ctx.strokeStyle = 'rgba(245,241,232,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
    const film = x => .9 - .75 * Math.pow(x, 1.6), dig = x => .08 + .5 * Math.pow(x, 1.4);
    const line = (f, col) => glowStroke(() => { ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 100; if (x > P) break; i ? ctx.lineTo(bx + bw * x, by + bh * (1 - f(x))) : ctx.moveTo(bx + bw * x, by + bh * (1 - f(x))); } }, col, 10, 20);
    line(film, ORANGE); line(dig, STEEL);
    txt('FILM REVENUE', bx + 20, by + 40, { size: 56, color: ORANGE, sp: 4 }); txt('DIGITAL (CHEAPER, LESS PROFIT)', bx + bw, by + bh - 260, { size: 46, color: STEEL, sp: 3, align: 'right', alpha: seg(P, .5, .8) });
    txt('ILLUSTRATIVE', bx + bw, by + bh + 50, { size: 26, color: STEEL, sp: 4, align: 'right' });
    bigLine('EVERY STEP TOWARD DIGITAL DESTROYED FILM PROFITS', W / 2, 930, seg(t, CW(17, 'destroy') - .3, T0(18) - .2), { size: 54, sp: 3, align: 'center' });
    letterbox(1); return;
  }
  photoBG(['saw'], t, T0(18), b, { side: 'left', dark: .6, tint: .1 }) || framed(IMG.saw, 1100, 200, 620, 620, 1, t, {});
  bigLine('CUTTING OFF THE BRANCH', 110, 440, seg(t, T0(18), CW(18, 'branch') + .4), { size: 120, sp: 5 });
  bigLine('IT WAS SITTING ON', 110, 580, seg(t, CW(18, 'branch') + .2, CW(18, 'branch') + 1.4), { size: 120, sp: 5, color: ORANGE });
  letterbox(1);
});
scene('k_hesitate', T0(19), T0(21), (t, a, b) => {
  const c = seg(t, T0(20) - .1, T0(20) + .3);
  if (c > 0) photoBG(['k09'], t, T0(20), b + 6, { pan: [1, 0], side: 'bottom', dark: .7, alpha: c });
  tag('03 · THE DILEMMA', t, a);
  slam('KODAK HESITATED.', W / 2, 440, t, a + .05, { size: 190, color: '#fff', glowColor: STEEL });
  if (t > T0(20) - .05) slam("COMPETITORS DIDN'T.", W / 2, 700, t, T0(20) + .05, { size: 190, color: ORANGE, glowColor: '#fff' });
  letterbox(1);
});
scene('k_rivals', T0(21), T0(23), (t, a, b) => {
  const fuji = t >= T0(22) - .2;
  if (!fuji) photoBG(['k09'], t, a - 3, b, { pan: [1, 0], side: 'left', dark: .7 }); else photoBG(['k10'], t, T0(22) - .2, b, { pan: [-1, 0], side: 'left', dark: .75 });
  tag('03 · THE DILEMMA', t, a);
  if (!fuji) {
    txt('JAPANESE RIVALS PUSHED DIGITAL HARD', 110, 300, { size: 70, color: CREAM, sp: 5, alpha: seg(t, a, a + .5) });
    ['SONY', 'CANON', 'FUJIFILM'].forEach((n, i) => { const q = E.outC(seg(t, CW(21, n.toLowerCase()) - .2, CW(21, n.toLowerCase()) + .4)); if (q <= 0) return; const x = lerp(-400, 110, q) + (t - a) * 30;
      for (let k = 0; k < 5; k++) { ctx.fillStyle = `rgba(255,107,26,${.3 - k * .05})`; ctx.fillRect(x - 60 - k * 60, 420 + i * 170 - 50 + k * 8, 40, 6); }
      txt(n, x, 470 + i * 170, { size: 150, color: '#fff', sp: 8, glow: 24, glowColor: ORANGE, alpha: q }); });
  } else {
    const n0 = E.outB(seg(t, T0(22) - .1, T0(22) + .5)), n1 = E.outB(seg(t, CW(22, 'chemistry') - .2, CW(22, 'chemistry') + .4)), n2 = E.outB(seg(t, CW(22, 'healthcare') - .2, CW(22, 'healthcare') + .4)), n3 = E.outB(seg(t, CW(22, 'cosmetics') - .2, CW(22, 'cosmetics') + .4));
    const node = (s, x, y, q, col) => { if (q <= 0) return; const w = measure(s, 64, 4) + 80; ctx.save(); ctx.globalAlpha *= Math.min(1, q); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; rr(x - w / 2 * q, y - 50, w * q, 100, 18); ctx.fill(); ctx.restore(); txt(s, x, y + 22, { size: 64, color: col === ORANGE ? NAVY : '#fff', align: 'center', sp: 4, alpha: Math.min(1, q) }); };
    const link = (x1, y1, x2, y2, q) => { if (q > 0) glowStroke(() => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, cl(q)), lerp(y1, y2, cl(q))); }, CREAM, 5, 10); };
    node('FUJIFILM', 520, 300, n0, ORANGE); link(520, 350, 520, 470, n1); node('CHEMISTRY KNOW-HOW', 520, 520, n1, '#21407F');
    link(520, 570, 300, 720, n2); link(520, 570, 760, 720, n3); node('HEALTHCARE', 300, 770, n2, '#21407F'); node('COSMETICS', 760, 770, n3, '#21407F');
    txt("KODAK'S RIVAL IN FILM", 520, 200, { size: 46, color: STEEL, align: 'center', sp: 6, alpha: n0 });
  }
  letterbox(1);
});
scene('k_attached', T0(23), T0(24), (t, a, b) => {
  photoBG(['k06'], t, a, b, { pan: [0, 1], side: 'left', dark: .85 });
  tag('03 · THE DILEMMA', t, a);
  txt('KODAK STAYED', 110, 450, { size: 150, color: '#fff', sp: 6, alpha: seg(t, a, a + .5) });
  txt('ATTACHED TO FILM', 110, 610, { size: 150, color: ORANGE, sp: 6, glow: 30, alpha: seg(t, CW(23, 'attached') - .2, CW(23, 'attached') + .4) });
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.globalAlpha *= seg(t, a + .5 + i * .1, a + .9 + i * .1); ctx.strokeStyle = STEEL; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(1300 + i * 70, 560 + (i % 2) * 10, 40, 24, (i % 2) * Math.PI / 2, 0, 7); ctx.stroke(); ctx.restore(); }
  filmRoll(1760, 560, 200, seg(t, a + .3, a + .8));
  letterbox(1);
});
