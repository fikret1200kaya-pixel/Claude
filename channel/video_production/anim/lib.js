// ===== Shared scene helpers (all videos) =====
const SCENES = [];
function scene(name, a, b, fn) { SCENES.push({ name, a, b, fn }); }
function gear(x, y, r, ang, col = STEEL) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; ctx.strokeStyle = col;
  ctx.beginPath(); for (let i = 0; i < 12; i++) { const a0 = i * Math.PI / 6, a1 = a0 + Math.PI / 12; ctx.lineTo(Math.cos(a0) * r * 1.15, Math.sin(a0) * r * 1.15); ctx.lineTo(Math.cos(a1) * r * 1.15, Math.sin(a1) * r * 1.15); ctx.lineTo(Math.cos(a1) * r * .95, Math.sin(a1) * r * .95); ctx.lineTo(Math.cos(a0 + Math.PI / 6) * r * .95, Math.sin(a0 + Math.PI / 6) * r * .95); }
  ctx.closePath(); ctx.fill(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(0, 0, r * .45, 0, 7); ctx.fill(); ctx.restore();
}
function flatCoin(x, y, r) { const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, '#FFE08A'); g.addColorStop(1, '#C8801A'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * .38, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#9a5d10'; ctx.lineWidth = 2; ctx.stroke(); }
function tape(x, y, w, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.fillStyle = '#10182c'; ctx.strokeStyle = CREAM; ctx.lineWidth = 3; rr(-w / 2, -w * .3, w, w * .6, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = CREAM; for (const dx of [-w * .22, w * .22]) { ctx.beginPath(); ctx.arc(dx, 0, w * .11, 0, 7); ctx.fill(); } ctx.fillStyle = ORANGE; ctx.fillRect(-w * .3, -w * .24, w * .6, w * .07); ctx.restore(); }
function bigLine(s, x, y, p, o = {}) { txt(typed(s, p), x, y, Object.assign({ size: 70, color: CREAM, sp: 3 }, o)); }
function slam(s, x, y, t, t0, o = {}) { const p = t - t0; if (p < 0) return; const k = E.outB(cl(p / .3)); txt(s, x, y, Object.assign({ size: 200, color: '#fff', align: 'center', glow: 40, glowColor: ORANGE, sp: 6, scale: lerp(1.5, 1, cl(p / .15)), alpha: cl(p / .08) }, o)); }
function spot(x, y, r, a = 1) { ctx.save(); ctx.globalAlpha *= a; const g = ctx.createRadialGradient(x, y, 20, x, y, r); g.addColorStop(0, 'rgba(255,170,100,.40)'); g.addColorStop(1, 'rgba(255,170,100,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
function numeral(n, label, t, a, sub) {
  const lt = t - a, p = E.outQ(seg(lt, .1, .8));
  txt(n, 96, 470, { size: 400, color: ORANGE, sp: 4, glow: 40, alpha: p, scale: .8 + .2 * p });
  ctx.fillStyle = CREAM; ctx.fillRect(100, 510, 860 * E.outC(seg(lt, .5, 1.3)), 6);
  bigLine(label, 100, 620, seg(lt, .5, 1.5), { size: 96, sp: 5, color: '#fff' });
  if (sub) txt(sub, 100, 600, { size: 50, color: STEEL, sp: 4, alpha: seg(lt, 1.2, 2) });
}

// ===== Documentary photo layer =====
// Full-bleed photo with slow Ken Burns move + cinematic grade. keys: first available image wins.
// o.pan: [dx,dy] direction (-1..1), o.zoom: [from,to], o.side: 'left'|'right'|'bottom'|'none' (dark side for text), o.dark: 0..1
function photoBG(keys, t, a, b, o = {}) {
  const key = [].concat(keys).find(k => IMG[k]); if (!key) return false;
  const im = IMG[key]; const { zoom = [1.04, 1.14], pan = [-1, 0], side = 'left', dark = .5, alpha = 1, tint = .35 } = o;
  const p = cl((t - a) / Math.max(.1, b - a)), z = lerp(zoom[0], zoom[1], p);
  const sc = Math.max(W / im.width, H / im.height) * z, iw = im.width * sc, ih = im.height * sc;
  const mx = (iw - W) / 2, my = (ih - H) / 2;
  const x = -mx + pan[0] * mx * (p - .5) * 1.7, y = -my + pan[1] * my * (p - .5) * 1.7;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(im, x, y, iw, ih);
  ctx.fillStyle = `rgba(11,27,58,${tint})`; ctx.fillRect(0, 0, W, H);                       // navy grade
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,140,60,.18)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  if (side !== 'none') {
    const g = side === 'left' ? ctx.createLinearGradient(0, 0, W, 0) : side === 'right' ? ctx.createLinearGradient(W, 0, 0, 0) : ctx.createLinearGradient(0, H, 0, 0);
    g.addColorStop(0, `rgba(4,10,26,${.55 + .4 * dark})`); g.addColorStop(.6, `rgba(4,10,26,${.3 * dark})`); g.addColorStop(1, 'rgba(4,10,26,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const bg = ctx.createLinearGradient(0, H * .6, 0, H); bg.addColorStop(0, 'rgba(4,10,26,0)'); bg.addColorStop(1, 'rgba(4,10,26,.55)'); ctx.fillStyle = bg; ctx.fillRect(0, H * .6, W, H * .4);
  ctx.restore(); return true;
}
// letterbox bars for a cinematic look (p: 0..1 amount)
function letterbox(p = 1, hgt = 70) { if (p <= 0) return; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, hgt * p); ctx.fillRect(0, H - hgt * p, W, hgt * p); }
// pill chip label
function chip(s, x, y, p, o = {}) {
  if (p <= 0) return; const { size = 46, col = 'rgba(255,107,26,.22)', color = CREAM } = o; const w = measure(s, size, 3) + 56;
  ctx.save(); ctx.globalAlpha *= p; ctx.fillStyle = col; rr(x - 30 * (1 - p), y - size * .95, w, size * 1.35, 10); ctx.fill(); ctx.fillStyle = ORANGE; ctx.fillRect(x - 30 * (1 - p), y - size * .95, 6, size * 1.35); ctx.restore();
  txt(s, x + 26 - 30 * (1 - p), y, { size, color, sp: 3, alpha: p });
}
// ===== extra icons =====
function filmRoll(x, y, s, a = 1, ang = 0) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = '#F2B01E'; ctx.shadowColor = 'rgba(255,170,40,.5)'; ctx.shadowBlur = 20; rr(-s * .32, -s * .5, s * .64, s, s * .08); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-s * .32, -s * .5, s * .64, s * .14); ctx.fillRect(-s * .32, s * .36, s * .64, s * .14);
  ctx.fillStyle = '#3a2a10'; ctx.beginPath(); ctx.moveTo(s * .32, -s * .25); ctx.lineTo(s * .62, -s * .22); ctx.lineTo(s * .62, s * .1); ctx.lineTo(s * .32, s * .12); ctx.fill();
  ctx.fillStyle = '#F5F1E8'; for (let i = 0; i < 3; i++) ctx.fillRect(s * .38 + i * s * .08, -s * .2, s * .04, s * .05);
  ctx.restore();
}
function camIcon(x, y, s, a = 1, col = CREAM) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, s * .05); ctx.shadowColor = ORANGE; ctx.shadowBlur = 16;
  rr(-s * .5, -s * .3, s, s * .62, s * .08); ctx.stroke(); rr(-s * .22, -s * .42, s * .3, s * .14, s * .03); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, s * .02, s * .2, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, s * .02, s * .1, 0, 7); ctx.stroke(); ctx.restore();
}
function phoneIcon(x, y, s, a = 1, screen = null) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.strokeStyle = CREAM; ctx.lineWidth = s * .04; ctx.shadowColor = ORANGE; ctx.shadowBlur = 20;
  rr(-s * .3, -s * .55, s * .6, s * 1.1, s * .09); ctx.stroke(); ctx.shadowBlur = 0;
  if (screen) { ctx.save(); rr(-s * .26, -s * .47, s * .52, s * .94, s * .05); ctx.clip(); screen(); ctx.restore(); }
  ctx.restore();
}
function crtIcon(x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.fillStyle = '#5a3a1e'; rr(-s * .55, -s * .4, s * 1.1, s * .8, s * .06); ctx.fill();
  ctx.fillStyle = '#9fb3c8'; ctx.shadowColor = '#bfe0ff'; ctx.shadowBlur = 30; rr(-s * .45, -s * .32, s * .72, s * .62, s * .1); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#2b1a0d'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(s * .41, -s * .18 + i * s * .2, s * .05, 0, 7); ctx.fill(); }
  ctx.restore();
}
function bill(x, y, w, ang = 0, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = '#7FB069'; rr(-w / 2, -w * .23, w, w * .46, 4); ctx.fill();
  ctx.strokeStyle = '#3d6b2f'; ctx.lineWidth = 2; rr(-w / 2 + 5, -w * .23 + 5, w - 10, w * .46 - 10, 3); ctx.stroke();
  txt('$', 0, w * .12, { size: w * .32, color: '#2f5524', align: 'center', font: 'Liberation Sans', weight: '700' }); ctx.restore();
}
function quoteCard(s, x, y, p, o = {}) {
  const { size = 92, width = 1300, by = '', color = '#fff' } = o;
  txt('“', x - 20, y + size * .9, { size: size * 2.2, color: ORANGE, alpha: .85 * cl(p * 3) });
  const words = s.split(' '); const lines = []; let cur = '';
  ctx.save(); ctx.font = `${size}px "Bebas Neue"`; ctx.letterSpacing = '3px';
  for (const wd of words) { const tst = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tst).width > width && cur) { lines.push(cur); cur = wd; } else cur = tst; }
  ctx.restore(); if (cur) lines.push(cur);
  const total = lines.join(' ').length; let shown = Math.floor(total * cl(p)), used = 0;
  lines.forEach((ln, i) => { const n = cl(shown - used, 0, ln.length); used += ln.length + 1; txt(ln.slice(0, n), x + 60, y + 60 + i * size * 1.05, { size, color, sp: 3 }); });
  if (by) txt(by, x + 64, y + 60 + lines.length * size * 1.05 + 30, { size: 38, color: STEEL, sp: 4, alpha: cl((p - .9) * 10) });
}
