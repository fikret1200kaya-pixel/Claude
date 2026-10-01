// ===== Kodak — scenes 2: phones → collapse → lessons → outro =====
scene('k_phones', T0(24), T0(26), (t, a, b) => {
  photoBG(['k11'], t, a, b, { pan: [-1, 0], side: 'left', dark: .7 });
  tag('04 · THE COLLAPSE', t, a);
  if (t < T0(25) - .1) { slam('THEN CAME PHONES.', W / 2, H / 2 + 60, t, a + .05, { size: 200 }); letterbox(1); return; }
  const p = E.outB(seg(t, T0(25), T0(25) + .6));
  if (!IMG.k11 && p > 0) phoneIcon(1400, 540, 520 * Math.min(1, p), 1, () => { const g = ctx.createLinearGradient(0, -260, 0, 260); g.addColorStop(0, '#2a4a8a'); g.addColorStop(1, '#ff8a3d'); ctx.fillStyle = g; ctx.fillRect(-160, -260, 320, 520); });
  const pr = E.outC(seg(t, CW(25, 'sharing') - .3, CW(25, 'sharing') + .4)), cr = E.outC(seg(t, CW(25, 'printing') - .1, CW(25, 'printing') + .5));
  txt('CAMERAS INSIDE EVERY PHONE', 110, 360, { size: 90, color: '#fff', sp: 5, alpha: seg(t, T0(25), T0(25) + .6) });
  if (pr > 0) { txt('SHARING', 110, 560, { size: 160, color: ORANGE, sp: 8, glow: 30, alpha: pr }); for (let i = 0; i < 10; i++) { const q = ((t * .5 + i / 10) % 1); txt('♥', 900 + (i * 97 % 400), 620 - q * 380, { size: 50, color: ORANGE, alpha: (1 - q) * pr, font: 'DejaVu Sans' }); } }
  if (cr > 0) { txt('PRINTING', 110, 760, { size: 160, color: STEEL, sp: 8, alpha: cr }); ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 16; ctx.shadowColor = RED; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(100, 700); ctx.lineTo(lerp(100, 720, cr), 700); ctx.stroke(); ctx.restore(); }
  letterbox(1);
});
scene('k_fall', T0(26), T0(27), (t, a, b) => {
  photoBG(['k12'], t, a, b + 6, { pan: [1, 0], side: 'none', tint: .55 });
  ctx.fillStyle = 'rgba(4,10,26,.45)'; ctx.fillRect(0, 0, W, H);
  tag('04 · THE COLLAPSE', t, a);
  const bx = 330, by = 300, bw = 1260, bh = 480, P = E.io(seg(t, a, b - .2)); const r = rngf(12);
  const pts = Array.from({ length: 30 }, (_, i) => { const x = i / 29; return [x, .1 + .8 * Math.pow(x, 1.3) + (r() - .5) * .05]; });
  glowStroke(() => { ctx.beginPath(); pts.forEach(([x, y], i) => { if (x > P) return; i ? ctx.lineTo(bx + bw * x, by + bh * y) : ctx.moveTo(bx + bw * x, by + bh * y); }); }, RED, 10, 24);
  txt("KODAK'S FILM SALES", bx, by - 40, { size: 80, color: '#fff', sp: 6 }); txt('YEAR AFTER YEAR', bx + bw, by + bh + 90, { size: 70, color: RED, sp: 8, align: 'right', alpha: seg(t, CW(26, 'year') - .2, CW(26, 'year') + .4) });
  txt('ILLUSTRATIVE', bx + bw, by - 40, { size: 26, color: STEEL, align: 'right', sp: 4 });
  letterbox(1);
});
scene('k_ch11', T0(27), T0(28), (t, a, b) => {
  photoBG(['k12'], t, a - 4, b, { pan: [1, 0], side: 'left', dark: .7 });
  tag('04 · THE COLLAPSE', t, a);
  txt('JANUARY', 110, 330, { size: 110, color: STEEL, sp: 12, alpha: seg(t, a, a + .5) }); txt('2012', 110, 600, { size: 330, color: '#fff', sp: 6, glow: 40, glowColor: RED, alpha: seg(t, a + .2, a + .7) });
  const sp = t - (CW(27, 'bankruptcy') - .15); flash(sp); const [sx, sy] = shakeAt(sp); ctx.save(); ctx.translate(sx, sy); stamp('CHAPTER 11', 1260, 560, sp, RED, 170, -.08); ctx.restore();
  letterbox(1);
});
scene('k_insta', T0(28), T0(31), (t, a, b) => {
  tag('04 · THE COLLAPSE', t, a);
  if (t < T0(29) - .1) { photoBG(['k12'], t, a - 6, b, { side: 'none', tint: .6 }); slam('THE CRUELEST COMPARISON', W / 2, H / 2 + 60, t, a + .05, { size: 170 }); letterbox(1); return; }
  // left half: tiny startup / right half: giant workforce
  const half = (keys, x0, t0, pan) => { ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, W / 2, H); ctx.clip(); ctx.translate(x0 - W / 4, 0); photoBG(keys, t, t0, b + 4, { pan, side: 'bottom', dark: .8 }) || null; ctx.restore(); };
  half(['k13', 'factory_startup'], 0, T0(29), [-1, 0]);
  const rp = seg(t, T0(30) - .2, T0(30) + .5); if (rp > 0) { ctx.save(); ctx.globalAlpha *= rp; half(['k05', 'factory_startup'], W / 2, T0(30), [1, 0]); ctx.restore(); }
  ctx.fillStyle = ORANGE; ctx.fillRect(W / 2 - 3, 0, 6, H * rp);
  txt('INSTAGRAM · 2012', W / 4, 220, { size: 64, color: CREAM, align: 'center', sp: 8, alpha: seg(t, T0(29), T0(29) + .5) });
  const n13 = seg(t, CW(29, 'thirteen') - .2, CW(29, 'thirteen') + 1.0);
  for (let i = 0; i < 13; i++) { const q = E.outB(seg(n13, i / 16, i / 16 + .2)); if (q <= 0) continue; ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(W / 4 - 300 + (i % 7) * 100, 460 + Math.floor(i / 7) * 100, 30 * q, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
  txt('13 EMPLOYEES', W / 4, 720, { size: 110, color: '#fff', align: 'center', sp: 6, alpha: n13 });
  const bl = E.io(seg(t, CW(29, 'billion') - .6, CW(29, 'billion') + .5)); if (bl > 0) txt('≈ $' + fmt(1000000000 * bl), W / 4, 860, { size: 100, color: ORANGE, align: 'center', sp: 4, glow: 30 });
  if (rp > 0) {
    txt('KODAK · AT ITS PEAK', W * .75, 220, { size: 64, color: CREAM, align: 'center', sp: 8, alpha: rp });
    const g = seg(t, T0(30) + .3, CW(30, 'people') + .3); const n = Math.floor(600 * g);
    ctx.fillStyle = 'rgba(245,241,232,.85)'; for (let i = 0; i < n; i++) { ctx.fillRect(W / 2 + 120 + (i % 40) * 18, 330 + Math.floor(i / 40) * 22, 9, 9); }
    txt('100,000+ EMPLOYEES', W * .75, 720 + 60, { size: 110, color: '#fff', align: 'center', sp: 6, alpha: seg(g, .5, 1) });
  }
  letterbox(1);
});
scene('k_emerged', T0(31), T0(32), (t, a, b) => {
  photoBG(['k14'], t, a, b, { pan: [1, 0], side: 'left', dark: .75 });
  tag('04 · THE COLLAPSE', t, a);
  yearCounter(2012, 2013, 110, 380, t, a, .8, 260);
  const sh = E.io(seg(t, CW(31, 'smaller') - .5, CW(31, 'smaller') + .8));
  ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 24; rr(110, 430, lerp(1100, 260, sh), 60, 10); ctx.fill(); ctx.shadowBlur = 0;
  txt('A MUCH SMALLER COMPANY', 110, 580, { size: 90, color: '#fff', sp: 5, alpha: seg(sh, .3, 1) });
  chip('COMMERCIAL PRINTING & IMAGING', 120, 720, E.outC(seg(t, CW(31, 'printing') - .3, CW(31, 'printing') + .3)), { size: 52 });
  chip('MANY PATENTS SOLD', 120, 830, E.outC(seg(t, CW(31, 'patents') - .3, CW(31, 'patents') + .3)), { size: 52 });
  letterbox(1);
});

// --- THE LESSONS ---
scene('k_lessons_q', T0(32), T0(33), (t, a) => {
  tag('05 · THE LESSONS', t, a); slam('SO WHAT ARE THE LESSONS?', W / 2, H / 2 + 60, t, a + .05, { size: 170 }); letterbox(1);
});
scene('k_l1', T0(33), T0(37), (t, a, b) => {
  photoBG(['k01', 'proto'], t, a, b, { pan: [1, 0], side: 'left', dark: .9, tint: .5 });
  tag('05 · THE LESSONS', t, a); numeral('01', 'INVENTION ≠ ENOUGH', t, a);
  bigLine('KODAK HAD THE TECHNOLOGY FIRST.', 104, 740, seg(t, T0(35), T0(35) + 1.6), { size: 58, sp: 3, color: CREAM });
  bigLine('IT HAD TO COMMIT.', 104, 830, seg(t, CW(36, 'commit') - .6, CW(36, 'commit') + .3), { size: 80, sp: 4, color: ORANGE });
  letterbox(1);
});
scene('k_l2', T0(37), T0(40), (t, a, b) => {
  photoBG(['k06'], t, a, b, { pan: [-1, 0], side: 'left', dark: .9, tint: .5 });
  tag('05 · THE LESSONS', t, a); numeral('02', 'PROTECTING THE CASH COW CAN BE FATAL', t, a);
  bigLine("IF YOU DON'T CANNIBALIZE YOURSELF,", 104, 740, seg(t, T0(39), CW(39, 'product') + .2), { size: 62, sp: 3, color: CREAM });
  bigLine('SOMEONE ELSE WILL.', 104, 830, seg(t, CW(39, 'someone') - .1, CW(39, 'will') + .4), { size: 90, sp: 4, color: ORANGE });
  letterbox(1);
});
scene('k_l3', T0(40), T0(45), (t, a, b) => {
  photoBG(['k11'], t, T0(43), b + 3, { pan: [1, 0], side: 'left', dark: .9, tint: .5, alpha: seg(t, T0(43) - .3, T0(43) + .4) });
  tag('05 · THE LESSONS', t, a); numeral('03', "KNOW WHAT BUSINESS YOU'RE IN", t, a);
  const fp = seg(t, CW(42, 'film') - .2, CW(42, 'film') + .3), cr = E.outC(seg(t, T0(43), T0(43) + .5)), mp = E.outB(seg(t, CW(43, 'memories') - .3, CW(43, 'memories') + .3));
  txt('FILM', 110, 820, { size: 150, color: STEEL, sp: 8, alpha: fp });
  if (cr > 0) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 14; ctx.shadowColor = RED; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(100, 770); ctx.lineTo(lerp(100, 400, cr), 770); ctx.stroke(); ctx.restore(); }
  if (mp > 0) txt('→ MEMORIES', 440, 820, { size: 150, color: ORANGE, sp: 8, glow: 34, alpha: Math.min(1, mp), scale: .8 + .2 * Math.min(1, mp) });
  bigLine('SMARTPHONES & SOCIAL MEDIA DID IT BETTER.', 110, 950, seg(t, T0(44), T0(44) + 2.2), { size: 56, sp: 3, color: CREAM });
  letterbox(1);
});
scene('k_closing', T0(45), T0(48), (t, a, b) => {
  photoBG(['k15', 'k01'], t, a, b, { pan: [0, -1], zoom: [1.05, 1.22], side: 'left', dark: .8 });
  txt("KODAK DIDN'T MISS THE FUTURE.", 110, 330, { size: 90, color: CREAM, sp: 5, alpha: seg(t, a, a + .6) });
  slam('IT SAW IT.', 110, 480, t, CW(46, 'saw') - .05, { size: 130, align: 'left' });
  slam('BUILT IT.', 760, 480, t, CW(46, 'built') - .05, { size: 130, align: 'left' });
  bigLine("...AND DECIDED IT WASN'T READY.", 110, 610, seg(t, CW(46, 'decided') - .2, CW(46, 'ready') + .3), { size: 90, sp: 4, color: ORANGE });
  const r = seg(t, T0(47), T0(47) + .5);
  if (r > 0) { txt('THE BIGGEST RISK:', 110, 780, { size: 80, color: CREAM, sp: 6, alpha: r }); slam('DOING NOTHING.', 110, 930, t, CW(47, 'nothing') - .1, { size: 150, align: 'left', color: ORANGE, glowColor: '#fff' }); }
  letterbox(1);
});
scene('k_outro', T0(48), DATA.T + 2, (t, a) => {
  const lt = t - a;
  if (IMG.logo) { const p = E.outB(seg(lt, .1, .8)); ctx.save(); ctx.translate(480, 440); ctx.scale(p, p); ctx.beginPath(); ctx.arc(0, 0, 175, 0, 7); ctx.fillStyle = '#081C3E'; ctx.fill(); ctx.clip(); ctx.drawImage(IMG.logo, -190, -190, 380, 380); ctx.restore(); }
  txt('RISE & RUIN', 480, 760, { size: 120, color: '#fff', align: 'center', sp: 8, alpha: seg(lt, .4, 1) });
  const sp = E.outB(seg(t, a + .3, a + .9)); if (sp > 0) { ctx.save(); ctx.translate(480, 880); ctx.scale(sp, sp); ctx.fillStyle = RED; rr(-190, -48, 380, 96, 48); ctx.fill(); txt('SUBSCRIBE', 0, 20, { size: 66, color: '#fff', align: 'center', sp: 6 }); ctx.restore(); }
  const nx = E.outC(seg(t, CW(48, 'next') - .1, CW(48, 'next') + .8));
  if (nx > 0) { txt('NEXT UP', 1330, 250, { size: 70, color: ORANGE, align: 'center', sp: 14, alpha: nx });
    ctx.save(); ctx.translate(lerp(2200, 1330, nx), 520); ctx.rotate(.02); ctx.save(); rr(-440, -248, 880, 496, 10); ctx.clip(); if (IMG.nokia) ctx.drawImage(IMG.nokia, -440, -248, 880, 496); ctx.restore(); ctx.strokeStyle = ORANGE; ctx.lineWidth = 6; rr(-440, -248, 880, 496, 10); ctx.stroke(); ctx.restore(); }
});
