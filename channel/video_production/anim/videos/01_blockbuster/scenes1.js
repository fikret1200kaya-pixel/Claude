// ===== Scenes 1: cold open → the offer =====

// --- COLD OPEN ---
scene('year2000', 0, T0(1), (t, a) => {
  const lt = t - a, p = E.outQ(seg(lt, .3, 2.2)), yr = Math.round(lerp(1990, 2000, p));
  txt(String(yr), 640, H / 2 + 120, { size: 430, color: '#fff', align: 'center', glow: 46, glowColor: ORANGE, sp: 8 });
  ctx.fillStyle = ORANGE; ctx.fillRect(250, H / 2 + 160, 780 * E.outC(seg(lt, 1.6, 2.4)), 8);
  bigLine('A MEETING THAT CHANGED EVERYTHING', 252, H / 2 + 240, seg(lt, 2.3, 4.2), { size: 54, sp: 5, color: CREAM });
  framed(IMG.chair, 1230, 220, 470, 560, seg(lt, .5, 1.3), lt - .5, { rot: .02 });
});
scene('fifty', T0(1), T0(2), (t, a) => {
  const t0 = CW(1, 'fifty') - .2, t1 = CW(1, 'dollars') + .5, p = E.io(seg(t, t0, t1)), val = 50000000 * p;
  const k = 1 + .05 * Math.sin(seg(t, t1 - .1, t1 + .3) * Math.PI);
  txt('$' + fmt(val), 600, H / 2 + 100, { size: 300, color: '#fff', align: 'center', glow: 50, glowColor: ORANGE, sp: 4, scale: k });
  txt('THE ASKING PRICE', 600, H / 2 + 190, { size: 60, color: ORANGE, align: 'center', sp: 14, alpha: seg(t, a + .3, a + 1) });
  framed(IMG.offer, 1230, 250, 470, 520, seg(t, a, a + .8), t - a, { rot: -.02 });
});
scene('executives', T0(2), T0(3), (t, a) => {
  const lt = t - a, sT = CW(2, 'no') - .05, sp = t - sT;
  const [sx, sy] = shakeAt(sp); ctx.save(); ctx.translate(sx, sy);
  const dim = 1 - .55 * cl(sp / .3);
  framed(IMG.offer, 250, 250, 600, 640, seg(lt, 0, .7), lt, { rot: -.018, a: dim });
  framed(IMG.chair, 1070, 250, 600, 640, seg(lt, .25, .95), lt, { rot: .018, a: dim });
  const lp = seg(t, CW(2, 'listened'), CW(2, 'listened') + .9);
  txt('LISTENED' + '.'.repeat(Math.floor(lp * 3)), W / 2, 190, { size: 110, color: CREAM, align: 'center', sp: 10, alpha: (1 - cl(sp / .15)) * seg(lt, .1, .5) });
  ctx.restore();
  flash(sp);
  if (sp > 0) { ctx.save(); ctx.translate(sx, sy); stamp('NO.', W / 2, 560, sp, RED, 340, -.1); ctx.restore(); }
});
scene('chart', T0(3), T0(6), (t, a) => {
  const bx = 330, by = 280, bw = 1260, bh = 560, P = E.io(seg(t, a + .15, T0(5) - .1));
  // axes
  ctx.strokeStyle = 'rgba(245,241,232,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
  for (let y = 0; y <= 10; y++) { const px = bx + bw * y / 10; ctx.strokeStyle = 'rgba(245,241,232,.08)'; ctx.beginPath(); ctx.moveTo(px, by); ctx.lineTo(px, by + bh); ctx.stroke(); if (y % 2 == 0) txt(String(2000 + y), px, by + bh + 52, { size: 38, color: STEEL, align: 'center', sp: 2 }); }
  const nf = x => 1 / (1 + Math.exp(-9 * (x - .6))) * .92 + .03 * x;
  const bb = x => x < .42 ? .5 + .38 * Math.sin(x / .42 * Math.PI / 2) : .88 * Math.max(0, 1 - Math.pow((x - .42) / .58, 1.5));
  const line = (f, col, w, maxP) => { glowStroke(() => { ctx.beginPath(); for (let i = 0; i <= 240; i++) { const x = i / 240; if (x > maxP) break; const px = bx + bw * x, py = by + bh * (1 - f(x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }, col, w, 22); };
  line(bb, STEEL, 8, P); line(nf, ORANGE, 10, P);
  // head dots
  const hd = (f, col) => { const x = Math.min(P, 1); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(bx + bw * x, by + bh * (1 - f(x)), 12, 0, 7); ctx.fill(); ctx.shadowBlur = 0; };
  hd(bb, '#fff'); hd(nf, '#fff');
  txt('BLOCKBUSTER', bx + 20, by + 40, { size: 50, color: STEEL, sp: 4, alpha: seg(t, a + .3, a + 1) });
  txt('THE STARTUP', bx + 20, by + 96, { size: 50, color: ORANGE, sp: 4, alpha: seg(t, a + .5, a + 1.2) });
  const bt = CW(3, 'billions'); const pp = E.outB(seg(t, bt, bt + .5)); if (pp > 0) txt('WORTH BILLIONS', bx + bw, by - 28, { size: 90, color: '#fff', align: 'right', glow: 30, glowColor: ORANGE, sp: 4, scale: pp, alpha: pp });
  txt('ILLUSTRATIVE · NOT TO SCALE', bx + bw, by + bh + 100, { size: 28, color: STEEL, align: 'right', sp: 4, alpha: .8 });
  // "10 YEARS LATER" tag
  txt('TEN YEARS LATER', bx, 215, { size: 74, color: CREAM, align: 'left', sp: 12, alpha: seg(t, a, a + .5) * (1 - seg(t, T0(5) - .5, T0(5))) });
  const sp = t - CW(5, 'bankrupt') + .1; const [sx, sy] = shakeAt(sp, 16); flash(sp);
  if (sp > 0) { ctx.save(); ctx.translate(sx, sy); stamp('BANKRUPT', W / 2, 560, sp, RED, 220, -.08); ctx.restore(); }
});
scene('title', T0(6), T0(7), (t, a) => {
  const lt = t - a, ttl = 'THE $50 MILLION MISTAKE';
  const pr = E.outQ(seg(lt, .15, 1.6));
  ctx.save(); ctx.font = '400 190px "Bebas Neue"'; ctx.letterSpacing = lerp(40, 8, pr) + 'px';
  const w = ctx.measureText(ttl).width; ctx.restore();
  txt(ttl, W / 2, H / 2 + 60, { size: 190, color: '#fff', align: 'center', sp: lerp(40, 8, pr), alpha: pr, glow: 36, glowColor: ORANGE });
  ctx.fillStyle = ORANGE; const lw = 900 * E.outC(seg(lt, .8, 1.8)); ctx.fillRect(W / 2 - lw / 2, H / 2 + 100, lw, 8);
  txt('HOW BLOCKBUSTER TURNED DOWN NETFLIX', W / 2, H / 2 + 190, { size: 62, color: CREAM, align: 'center', sp: 10, alpha: seg(lt, 1.2, 2.1) });
  if (IMG.logo) { ctx.save(); ctx.globalAlpha *= seg(lt, 0, .8); ctx.beginPath(); ctx.arc(W / 2, 220, 74, 0, 7); ctx.clip(); ctx.drawImage(IMG.logo, W / 2 - 80, 140, 160, 160); ctx.restore(); }
});

// --- THE EMPIRE ---
scene('dallas1985', T0(7), T0(9), (t, a) => {
  tag('01 · THE EMPIRE', t, a);
  const lt = t - a, p = E.outQ(seg(lt, .2, 2.0)), yr = Math.round(lerp(1980, 1985, p));
  txt(String(yr), 96, 380, { size: 300, color: '#fff', sp: 6, glow: 40, glowColor: ORANGE });
  ctx.save(); ctx.translate(230, 0); drawMap(seg(lt, 0, .8), t); const [dx, dy] = mp(...CITY.dallas); pin(dx, dy, seg(t, CW(7, 'dallas') - .1, CW(7, 'dallas') + 1.2), 'DALLAS, TEXAS'); ctx.restore();
  storeIcon(96, 480, 340, CREAM, 'VIDEO', E.outC(seg(lt, 1.2, 2.2)));
  [['BIG, BRIGHT STORES', 'big'], ['THOUSANDS OF MOVIES', 'thousands'], ['A FRIDAY NIGHT GUARANTEE', 'friday']].forEach(([s, w], i) => {
    const tt = CW(8, w) - .15, p2 = E.outC(seg(t, tt, tt + .5)); if (p2 <= 0) return;
    ctx.save(); ctx.globalAlpha *= p2; ctx.fillStyle = 'rgba(255,107,26,.18)'; const ww = measure(s, 46, 3) + 60; rr(480 - 40 * (1 - p2), 560 + i * 78 - 48, ww, 62, 10); ctx.fill(); ctx.restore();
    txt(s, 510 - 40 * (1 - p2), 560 + i * 78, { size: 46, color: CREAM, sp: 3, alpha: p2 });
  });
});
scene('peak9000', T0(9), T0(11), (t, a) => {
  tag('01 · THE EMPIRE', t, a);
  const lt = t - a;
  const wk = E.outB(seg(lt, .05, .5)) * (1 - seg(lt, 1.15, 1.6)); if (wk > .01) txt('IT WORKED.', W / 2, H / 2 + 60, { size: 250, color: '#fff', align: 'center', glow: 50, glowColor: ORANGE, sp: 8, alpha: wk, scale: .7 + .3 * wk });
  const q = seg(lt, 1.4, 1.9); if (q <= 0) return;
  ctx.save(); ctx.globalAlpha *= q; ctx.translate(330, 20); drawMap(1, t);
  const r = rngf(21); const sd = MAPDOTS.filter(d => d[2] < .11).map(d => d.slice()); const [dx, dy] = mp(...CITY.dallas);
  sd.sort((p1, p2) => Math.hypot(p1[0] - dx, p1[1] - dy) - Math.hypot(p2[0] - dx, p2[1] - dy));
  const P = E.io(seg(t, CW(10, 'peak') - .1, CW(10, 'nine') + 1.6)); const n = Math.floor(sd.length * P);
  for (let i = 0; i < n; i++) { const [x, y] = sd[i]; const pop = E.outB(cl((P * sd.length - i) / 6)); ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(x, y, 6.5 * pop, 0, 7); ctx.fill(); }
  ctx.restore();
  txt('~' + fmt(9000 * P), 96, 520, { size: 230, color: '#fff', sp: 4, glow: 34, glowColor: ORANGE });
  txt('STORES WORLDWIDE', 100, 590, { size: 62, color: ORANGE, sp: 10 });
  const tp = seg(t, CW(10, 'employed') - .1, CW(10, 'employed') + 1.2);
  bigLine('TENS OF THOUSANDS OF EMPLOYEES', 100, 700, tp, { size: 46, sp: 3 });
  txt('MID-2000s', 100, 300, { size: 54, color: STEEL, sp: 8, alpha: q });
});
scene('friday', T0(11), T0(12), (t, a) => {
  tag('01 · THE EMPIRE', t, a);
  const lt = t - a, fl = lt < .9 ? (Math.sin(lt * 70) > -.2 ? 1 : .25) * seg(lt, 0, .3) : 1;
  txt('FRIDAY NIGHT', W / 2, 470, { size: 300, color: '#FFB27A', align: 'center', sp: 14, glow: 70, glowColor: ORANGE, alpha: fl });
  txt('FRIDAY NIGHT', W / 2, 470, { size: 300, color: '#fff', align: 'center', sp: 14, glow: 10, glowColor: '#fff', alpha: fl * .55 });
  txt('A RITUAL FOR A WHOLE GENERATION', W / 2, 560, { size: 64, color: CREAM, align: 'center', sp: 10, alpha: seg(lt, 1, 1.8) });
  for (let i = 0; i < 10; i++) { const x = ((i * 230 + 1900 - lt * 150) % 2300) - 180, al = seg(lt, .2, .8); if (i % 2) disc(x, 880, 62, lt * 3 + i, al); else tape(x, 880, 150, al); }
});

// --- THE HIDDEN PROBLEM ---
scene('hidden', T0(12), T0(16), (t, a) => {
  tag('02 · THE HIDDEN PROBLEM', t, a);
  const lt = t - a, tSplit = T0(15) - .2;
  const ph1 = 1 - seg(t, tSplit - .1, tSplit + .3);
  if (ph1 > 0) { ctx.save(); ctx.globalAlpha *= ph1;
    // profit bar
    const bx = 360, by = 420, bw = 1200, bh = 140;
    txt('WHERE THE PROFIT COMES FROM', W / 2, 330, { size: 70, color: CREAM, align: 'center', sp: 8, alpha: seg(lt, .3, 1) });
    const rev = E.outC(seg(t, T0(13) - .1, T0(13) + 1.2));
    ctx.fillStyle = '#21407F'; rr(bx, by, bw * .62 * rev, bh, 12); ctx.fill();
    txt('RENTING MOVIES', bx + bw * .31, by + bh / 2 + 20, { size: 62, color: CREAM, align: 'center', sp: 4, alpha: rev });
    const hid = seg(t, T0(13) + 1.0, T0(13) + 1.8), rv = seg(t, T0(14) - .05, T0(14) + .5);
    const hx = bx + bw * .62 + 8, hw = bw * .38;
    if (hid > 0) { ctx.save(); rr(hx, by, hw * hid, bh, 12); ctx.clip();
      if (rv < 1) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(hx, by, hw, bh); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 6; for (let i = -200; i < hw; i += 34) { ctx.beginPath(); ctx.moveTo(hx + i, by + bh); ctx.lineTo(hx + i + 140, by); ctx.stroke(); } txt('?', hx + hw / 2, by + bh / 2 + 52, { size: 170, color: '#fff', align: 'center', alpha: 1 - rv }); }
      ctx.globalAlpha *= rv; const pul = 1 + .05 * Math.sin(t * 6); ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 40; ctx.fillRect(hx, by, hw, bh); ctx.shadowBlur = 0;
      txt('LATE FEES', hx + hw / 2, by + bh / 2 + 22, { size: 74 * pul, color: NAVY, align: 'center', sp: 4 }); ctx.restore(); }
    txt('ILLUSTRATIVE', bx + bw, by + bh + 60, { size: 28, color: STEEL, align: 'right', sp: 4 });
    bigLine('IT DIDN\'T COME FROM RENTING MOVIES.', W / 2, 720, seg(t, T0(13) + 1.4, T0(13) + 3), { size: 56, align: 'center', sp: 4, color: STEEL }); ctx.restore(); }
  // machine
  const m = seg(t, tSplit, tSplit + .6);
  if (m > 0) { ctx.save(); ctx.globalAlpha *= m;
    ctx.fillStyle = '#16315F'; ctx.strokeStyle = STEEL; ctx.lineWidth = 5; rr(760, 360, 400, 300, 24); ctx.fill(); ctx.stroke();
    gear(900, 510, 70, t * 1.2, STEEL); gear(1030, 470, 46, -t * 1.9, ORANGE);
    txt('THE MACHINE', 960, 710, { size: 50, color: CREAM, align: 'center', sp: 8 });
    ctx.restore();
    // items entering
    const t0 = tSplit + .3;
    for (let i = 0; i < 9; i++) { const st = t0 + i * .55; const p = seg(t, st, st + 1.3); if (p <= 0 || p >= 1) continue; const x = lerp(260, 740, E.io(p)), y = 500 + Math.sin(p * 6) * 14; if (i % 2) disc(x, y, 56, t * 4, 1 - seg(p, .8, 1)); else tape(x, y, 130, 1 - seg(p, .8, 1)); }
    // coins out + stack
    let n = 0;
    for (let i = 0; i < 14; i++) { const st = t0 + 1.0 + i * .33, p = seg(t, st, st + .9); if (p <= 0) continue; const rest = 790 - n * 9; const y = p < 1 ? lerp(600, rest, E.outB(p) * .98 + .02 * p) - Math.sin(p * Math.PI) * 120 : rest; const x = 1400 + (i % 3) * 8 - 8; if (p < 1) coin(lerp(1180, x, p), y, 34, 1); else flatCoin(x, rest, 36); if (p >= 1) n++; }
    txt('QUIETLY FEEDING THE MACHINE', W / 2, 880, { size: 54, color: ORANGE, align: 'center', sp: 8, alpha: seg(t, T0(15) + 2, T0(15) + 3) });
  }
});

// --- THE CHALLENGER ---
scene('netflix1997', T0(16), T0(20), (t, a) => {
  tag('03 · THE CHALLENGER', t, a);
  const lt = t - a, p = E.outQ(seg(lt, .2, 2.0)), yr = Math.round(lerp(1990, 1997, p));
  txt(String(yr), 96, 380, { size: 300, color: '#fff', sp: 6, glow: 40, glowColor: ORANGE });
  ctx.save(); ctx.translate(230, 0); drawMap(1, t);
  const [lx, ly] = mp(...CITY.losgatos); const dests = ['ny', 'chi', 'mia', 'sea', 'den', 'atl', 'bos', 'hou', 'la', 'min'];
  const rt = seg(t, T0(17) - .1, T0(18) - .2);
  dests.forEach((k, i) => { const [x1, y1] = mp(...CITY[k]); const q = cl(rt * 1.4 - i * .06); if (q <= 0) return; const cx = (lx + x1) / 2, cy = Math.min(ly, y1) - 120 - 30 * (i % 3);
    const bz = (u) => [(1 - u) * (1 - u) * lx + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * ly + 2 * (1 - u) * u * cy + u * u * y1];
    ctx.save(); ctx.strokeStyle = 'rgba(255,107,26,.6)'; ctx.setLineDash([8, 10]); ctx.lineWidth = 3; ctx.beginPath(); for (let u = 0; u <= q; u += .02) { const [px, py] = bz(u); u ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore();
    const [ex, ey] = bz(q); if (q < 1) envelope(ex, ey, 46, Math.sin(q * 8) * .2); else { ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x1, y1, 9, 0, 7); ctx.fill(); ctx.shadowBlur = 0; } });
  pin(lx, ly, seg(t, T0(16) + 2, T0(16) + 3.2), 'LOS GATOS, CA', ORANGE, 40);
  ctx.restore();
  // left column text
  const nm = seg(t, CW(16, 'reed') - .1, CW(16, 'randolph') + .8);
  txt('NETFLIX', 100, 500, { size: 150, color: ORANGE, sp: 8, glow: 30, alpha: seg(t, T0(16) + .5, T0(16) + 1.2) });
  const hasP = IMG.hastings || IMG.randolph, gf = 1 - seg(t, T0(17) - .35, T0(17) + .05);
  ctx.save(); ctx.globalAlpha *= gf;
  if (hasP) {
    if (IMG.hastings) portrait('hastings', 100, 540, 190, 230, seg(nm, 0, .5), t - a, false);
    if (IMG.randolph) portrait('randolph', 330, 540, 190, 230, seg(nm, .3, .8), t - a, false);
    const PC = window.PEOPLE_CREDITS || {}; txt('HASTINGS: ' + (PC.hastings || '') + '   ·   RANDOLPH: ' + (PC.randolph || ''), 100, 1030, { size: 19, color: STEEL, font: 'Liberation Sans', alpha: seg(nm, .3, .9) });
    txt('REED HASTINGS', 195, 850, { size: 30, color: CREAM, align: 'center', sp: 3, alpha: seg(nm, .1, .6) }); txt('MARC RANDOLPH', 425, 850, { size: 30, color: CREAM, align: 'center', sp: 3, alpha: seg(nm, .4, .9) });
  } else { bigLine('REED HASTINGS', 104, 630, nm, { size: 54, sp: 5 }); bigLine('MARC RANDOLPH', 104, 690, seg(nm, .5, 1), { size: 54, sp: 5 }); }
  ctx.restore();
  const mo = seg(t, T0(17) - .1, T0(17) + 2.2);
  bigLine('RENT ONLINE.', 104, 800, mo, { size: 66, sp: 5, color: '#fff' }); bigLine('DELIVER BY MAIL.', 104, 870, seg(mo, .5, 1), { size: 66, sp: 5, color: ORANGE });
  // NO STORE / NO LATE FEES overlay
  const o1 = seg(t, T0(18) - .15, T0(18) + .3), o2 = seg(t, T0(19) - .15, T0(19) + .3);
  if (o1 > 0) { ctx.save(); ctx.fillStyle = 'rgba(7,14,34,' + .9 * o1 + ')'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha *= o1; storeIcon(W / 2 - 520, 340, 380, CREAM, 'VIDEO', 1); cross(W / 2 - 330, 560, 190, RED, E.outC(seg(t, T0(18) + .15, T0(18) + .6)), 18); txt('NO STORE.', W / 2 - 330, 840, { size: 100, color: CREAM, align: 'center', sp: 6 }); ctx.restore(); }
  if (o2 > 0) { ctx.save(); ctx.globalAlpha *= o2; coin(W / 2 + 330, 540, 150); cross(W / 2 + 330, 540, 190, RED, E.outC(seg(t, T0(19) + .2, T0(19) + .7)), 18); txt('NO LATE FEES.', W / 2 + 330, 840, { size: 100, color: CREAM, align: 'center', sp: 6 }); ctx.restore(); }
});

// --- THE OFFER ---
scene('offer', T0(20), T0(22), (t, a) => {
  tag('04 · THE OFFER', t, a);
  const lt = t - a, p = E.outQ(seg(lt, .2, 1.8)), yr = Math.round(lerp(1995, 2000, p));
  txt(String(yr), 96, 380, { size: 300, color: '#fff', sp: 6, glow: 40, glowColor: ORANGE });
  // losing money mini chart
  const bx = 100, by = 470, bw = 520, bh = 200, q = seg(t, T0(20) + .8, T0(20) + 3.4);
  ctx.strokeStyle = 'rgba(245,241,232,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
  glowStroke(() => { ctx.beginPath(); for (let i = 0; i <= 60; i++) { const x = i / 60; if (x > q) break; const y = by + 30 + (bh - 60) * (x * .8 + .12 * Math.sin(x * 9)); i ? ctx.lineTo(bx + bw * x, y) : ctx.moveTo(bx + bw * x, y); } }, RED, 8, 16);
  txt('NETFLIX: LOSING MONEY', 100, 740, { size: 56, color: RED, sp: 4, alpha: seg(t, T0(20) + 1, T0(20) + 1.8) });
  bigLine('NEEDED A LIFELINE', 100, 820, seg(t, CW(20, 'needed') - .1, CW(20, 'lifeline') + .5), { size: 62, sp: 5 });
  // right: deal diagram
  const d = seg(t, T0(21) - .1, T0(21) + .9);
  if (d > 0) { ctx.save(); ctx.globalAlpha *= d; ctx.fillStyle = 'rgba(7,14,34,' + .985 * d + ')'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha *= d;
    const bxA = 170, bxB = 1230, y0 = 280;
    ctx.fillStyle = '#21407F'; rr(bxA, y0, 520, 220, 18); ctx.fill(); txt('BLOCKBUSTER', bxA + 260, y0 + 135, { size: 82, color: CREAM, align: 'center', sp: 5 });
    ctx.fillStyle = ORANGE; rr(bxB, y0, 520, 220, 18); ctx.fill(); txt('NETFLIX', bxB + 260, y0 + 135, { size: 100, color: NAVY, align: 'center', sp: 5 });
    const ap = E.outC(seg(t, T0(21) + .9, T0(21) + 2)); glowStroke(() => { ctx.beginPath(); ctx.moveTo(bxB - 30, y0 + 110); ctx.lineTo(lerp(bxB - 30, bxA + 550, ap), y0 + 110); }, ORANGE, 12, 20);
    txt('BUYS FOR', W / 2, y0 + 60, { size: 54, color: CREAM, align: 'center', sp: 8, alpha: ap }); txt('≈ $50 MILLION', W / 2, y0 + 180, { size: 84, color: ORANGE, align: 'center', sp: 6, alpha: ap });
    bigLine('NETFLIX WOULD RUN THE ONLINE BUSINESS.', 170, 640, seg(t, T0(21) + 5.2, T0(21) + 8.0), { size: 64, sp: 4 });
    framed(IMG.offer, 1230, 590, 520, 400, seg(t, T0(21) + 2.2, T0(21) + 3), t - T0(21), { rot: -.015 });
    ctx.restore(); }
});
scene('declined', T0(22), T0(27), (t, a) => {
  tag('04 · THE DECISION', t, a);
  const lt = t - a;
  if (t < T0(23) + .1) { framed(IMG.offer, W / 2 - 300, 280, 600, 520, 1, lt, { rot: -.02, a: .5 }); const sp = t - (T0(22) + .1); flash(sp); const [sx, sy] = shakeAt(sp); ctx.save(); ctx.translate(sx, sy); stamp('DECLINED', W / 2, 560, sp, RED, 260, -.1); ctx.restore(); return; }
  const f = seg(t, T0(23) - .1, T0(23) + .4);
  // quote
  if (t < T0(24) - .1) { ctx.save(); ctx.globalAlpha *= f * (1 - seg(t, T0(24) - .35, T0(24) - .1)); txt('“', 300, 440, { size: 380, color: ORANGE, alpha: .8 });
    bigLine('THE IDEA WASN\'T TAKEN SERIOUSLY.', 420, 470, seg(t, T0(23), T0(23) + 2.2), { size: 100, sp: 4 });
    txt('ACCORDING TO ACCOUNTS FROM PEOPLE IN THE ROOM', 420, 560, { size: 44, color: STEEL, sp: 5, alpha: seg(t, T0(23) + 1.8, T0(23) + 2.6) });
    [560, 860, 1160, 1460].forEach((x, i) => { txt('?', x, 760 - Math.sin(t * 2 + i) * 14, { size: 200, color: ORANGE, align: 'center', alpha: .85 * seg(lt, 3 + i * .15, 3.8 + i * .15), glow: 24 }); });
    ctx.restore(); return; }
  if (t < T0(25) - .1) { const p = E.outB(seg(t, T0(24), T0(24) + .6)); txt('A NICHE?', W / 2, H / 2 + 110, { size: 360, color: '#fff', align: 'center', glow: 40, glowColor: ORANGE, scale: p, alpha: Math.min(1, p) * (1 - seg(t, T0(25) - .35, T0(25) - .1)) }); txt('ONLINE RENTAL', W / 2, 330, { size: 90, color: STEEL, align: 'center', sp: 14, alpha: seg(t, T0(24), T0(24) + .5) }); return; }
  // stores grid + tiny envelope
  const gp = seg(t, T0(25), T0(26) - .2);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { const i = r * 8 + c, p = E.outB(seg(gp * 28 - i, 0, 3)); if (p <= 0) continue; ctx.save(); ctx.translate(210 + c * 200 + 100, 300 + r * 190 + 80); ctx.scale(p, p); storeIcon(-80, -70, 160, CREAM, 'VIDEO', .85); ctx.restore(); }
  txt('THOUSANDS OF STORES', W / 2, 190, { size: 90, color: CREAM, align: 'center', sp: 10, alpha: seg(t, T0(25), T0(25) + .5) });
  const ev = seg(t, T0(26) - .1, T0(26) + .6); if (ev > 0) { ctx.save(); ctx.fillStyle = 'rgba(7,14,34,' + .78 * ev + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); envelope(W / 2, 520 + Math.sin(t * 3) * 10, 220 * E.outB(ev), Math.sin(t * 2) * .08, ev);
    bigLine('A TINY COMPANY SHIPPING DISCS IN RED ENVELOPES?', W / 2, 800, seg(t, T0(26) + .3, T0(26) + 2.8), { size: 66, align: 'center', sp: 4 }); }
});
