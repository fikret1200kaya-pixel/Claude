'use strict';
/* ====== FATİH — İzometrik grafik motoru (prosedürel sprite'lar) ======
   Dünya (x,y) px  ->  ekran ((x-y), (x+y)/2 - z)   (2:1 izometrik)            */
const iso = (x, y, z) => [x - y, (x + y) / 2 - (z || 0)];

/* ---------- renk yardımcıları ---------- */
const _hc = {};
function hex2rgb(h) { if (_hc[h]) return _hc[h]; if (h[0] === 'r') { const m = h.match(/[\d.]+/g); return _hc[h] = [+m[0], +m[1], +m[2]]; } const n = parseInt(h.slice(1), 16); return _hc[h] = [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const _sc = {};
function shade(h, f) {
  const k = h + f; if (_sc[k]) return _sc[k]; const [r, g, b] = hex2rgb(h); let o;
  if (f <= 1) o = [r * f, g * f, b * f]; else { const t = f - 1; o = [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t]; }
  return _sc[k] = `rgb(${o[0] | 0},${o[1] | 0},${o[2] | 0})`;
}
const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${(A[0] + (B[0] - A[0]) * t) | 0},${(A[1] + (B[1] - A[1]) * t) | 0},${(A[2] + (B[2] - A[2]) * t) | 0})`; };
const hash2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const OUT = 'rgba(20,12,6,.55)';

/* ======================  3B İSKELET ÇİZİCİ (birimler)  ====================== */
class Rig {
  constructor(c, ox, oy, theta, S) { this.c = c; this.ox = ox; this.oy = oy; this.ct = Math.cos(theta); this.st = Math.sin(theta); this.S = S || 1; this.q = []; }
  P(lx, ly, z) { const S = this.S, wx = lx * this.ct - ly * this.st, wy = lx * this.st + ly * this.ct; return [this.ox + (wx - wy) * S, this.oy + (wx + wy) * S / 2 - z * S, wx + wy]; }
  cap(a, b, w, col, bias) { const A = this.P(...a), B = this.P(...b); this.q.push({ d: (A[2] + B[2]) / 2 + (bias || 0), f: c => { c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = w * this.S + 1.6; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.strokeStyle = shade(col, 1); c.lineWidth = w * this.S; c.stroke(); c.strokeStyle = shade(col, 1.28); c.lineWidth = Math.max(.8, w * this.S * .38); c.beginPath(); c.moveTo(A[0] - w * .17, A[1] - w * .1); c.lineTo(B[0] - w * .17, B[1] - w * .1); c.stroke(); } }); }
  line(a, b, w, col, bias) { const A = this.P(...a), B = this.P(...b); this.q.push({ d: (A[2] + B[2]) / 2 + (bias || 0), f: c => { c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); } }); }
  ball(p, r, col, bias) { const A = this.P(...p), S = this.S; this.q.push({ d: A[2] + (bias || 0), f: c => { const g = c.createRadialGradient(A[0] - r * S * .35, A[1] - r * S * .4, r * S * .1, A[0], A[1], r * S); g.addColorStop(0, shade(col, 1.4)); g.addColorStop(.55, shade(col, 1)); g.addColorStop(1, shade(col, .68)); c.fillStyle = g; c.beginPath(); c.arc(A[0], A[1], r * S, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); } }); }
  ell(p, rx, ry, col, bias, rot) { const A = this.P(...p); this.q.push({ d: A[2] + (bias || 0), f: c => { c.fillStyle = col; c.beginPath(); c.ellipse(A[0], A[1], rx * this.S, ry * this.S, rot || 0, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); } }); }
  poly(pts, col, bias, nostroke) { const A = pts.map(p => this.P(...p)); let d = 0; A.forEach(a => d += a[2]); d /= A.length; this.q.push({ d: d + (bias || 0), f: c => { c.beginPath(); A.forEach((a, i) => i ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.fillStyle = col; c.fill(); if (!nostroke) { c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); } } }); }
  disc(ctr, axis, r, col, bias, rim) { // eksene dik daire
    const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, ca = Math.cos(a) * r, sa = Math.sin(a) * r; pts.push(axis === 'y' ? [ctr[0] + ca, ctr[1], ctr[2] + sa] : axis === 'x' ? [ctr[0], ctr[1] + ca, ctr[2] + sa] : [ctr[0] + ca, ctr[1] + sa, ctr[2]]); }
    this.poly(pts, col, bias); if (rim) { const A = pts.map(p => this.P(...p)); this.q.push({ d: this.P(...ctr)[2] + (bias || 0) + .01, f: c => { c.strokeStyle = rim; c.lineWidth = 1.4; c.beginPath(); A.forEach((a, i) => i ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.stroke(); } }); }
  }
  flush() { this.q.sort((a, b) => a.d - b.d); for (const p of this.q) p.f(this.c); this.q.length = 0; }
}

/* ---------- insan ve at ---------- */
function legsAnim(act, fr, N) { const ph = act === 'walk' ? fr / N * Math.PI * 2 : 0; return { s: Math.sin(ph), c: Math.cos(ph), walk: act === 'walk' }; }
function human(R, o, act, fr, base) {
  const a = legsAnim(act, fr, 8), z0 = base == null ? 12 : base, bob = a.walk ? Math.abs(a.s) * 1 : 0, seated = base != null;
  const zh = z0 - bob * .6;
  if (!seated) for (const side of [-1, 1]) { const sw = a.s * side, fz = a.walk ? Math.max(0, a.c * side) * 2.5 : 0; R.cap([0, side * 2.2, zh], [sw * 5, side * 2.4, fz + 1.5], 3.6, o.pants || '#5a4630'); R.ball([sw * 5.8, side * 2.4, fz + 1], 2.4, o.boots || '#3a2a1c', 1); }
  else for (const side of [-1, 1]) { R.cap([0, side * 4, zh], [1.5, side * 6.5, zh - 8], 3.4, o.pants || '#5a4630'); R.ball([2, side * 6.8, zh - 9], 2.2, o.boots || '#3a2a1c'); }
  const top = zh + 11;
  R.cap([0, 0, zh], [0, 0, top], 8.4, o.tunic, 0.5);
  if (o.sash) R.cap([0, 0, zh + .8], [0, 0, zh + 2.8], 8.9, o.sash, .6);
  if (o.vest) R.cap([.3, 0, zh + 4], [.3, 0, top - 1], 8.9, o.vest, .55);
  R.ball([0, 0, top + 4.2], 4.1, o.skin || '#e0b48a', .8);
  return { zh, top, a };
}
function arm(R, side, hand, tun, skin) { R.cap([0, side * 5, hand.top - 1.5], hand.p, 3, tun, side > 0 ? 1.5 : -.5); R.ball(hand.p, 1.9, skin || '#e0b48a', side > 0 ? 1.6 : -.4); }
function horse(R, o, act, fr) {
  const a = legsAnim(act, fr, 8), bob = a.walk ? Math.abs(a.s) * 1.6 : 0, hz = 14 + bob, col = o.coat, mane = o.mane || '#2b1d12';
  const legs = [[6.5, -3.4, 0], [6.5, 3.4, Math.PI], [-6.5, -3.4, Math.PI * .5], [-6.5, 3.4, Math.PI * 1.5]];
  for (const [lx, ly, ph] of legs) { const sw = a.walk ? Math.sin(fr / 8 * Math.PI * 2 + ph) : 0, lift = a.walk ? Math.max(0, Math.cos(fr / 8 * Math.PI * 2 + ph)) * 3 : 0; R.cap([lx, ly, hz - 1], [lx + sw * 5, ly, lift], 2.6, col); R.ball([lx + sw * 5, ly, lift], 1.5, '#2a1b10', .2); }
  R.cap([-6.5, 0, hz + 1], [6.5, 0, hz + 1], 10.5, col);
  R.cap([6, 0, hz + 4], [12.5, 0, hz + 12], 5.4, col, .4);
  R.cap([12.5, 0, hz + 12], [17.5, 0, hz + 9], 4.4, col, .5);
  R.ball([18.2, 0, hz + 8.8], 1.4, '#c9a58a', .6);
  R.cap([7.5, 0, hz + 6], [12, 0, hz + 14.2], 1.8, mane, .45); R.cap([-6.5, 0, hz + 2], [-12, 0, hz - 7], 2.6, mane, -.5);
  R.cap([-2.5, 0, hz + 6.2], [2.5, 0, hz + 6.2], 11.2, o.blanket || '#a12a24', .3);
  if (o.trim) R.cap([-2.7, 0, hz + 4.9], [2.7, 0, hz + 4.9], 11.4, o.trim, .35);
  return hz + 6.6;
}

/* ---------- birim çizici tablosu ---------- */
const PAINT = {
  reaya(R, col, act, fr) {
    const h = human(R, { tunic: '#b99a63', pants: '#6b5430', sash: col, vest: '#8a6a3a' }, act, fr), a = h.a;
    // başlık
    R.ball([0, 0, h.top + 7.2], 3.9, '#d9c07a', 1.6); R.disc([0, 0, h.top + 6.4], 'z', 6.2, '#cdb064', 1.4);
    const work = act === 'atk', sw = work ? Math.sin(fr / 6 * Math.PI) : 0;
    arm(R, -1, { top: h.top, p: [a.walk ? a.s * 3 : 1, -5.5, h.top - 8] }, '#b99a63');
    const hp = work ? [3 + sw * 5, 5.4, h.top - 2 + sw * 4] : [a.walk ? -a.s * 3 : 1, 5.5, h.top - 8];
    arm(R, 1, { top: h.top, p: hp }, '#b99a63');
    R.cap(hp, [hp[0] + 4, hp[1] + 1, hp[2] + (work ? -9 : 9)], 1.4, '#6b4a2a', 2); R.poly([[hp[0] + 3, hp[1], hp[2] + (work ? -9.5 : 9.5)], [hp[0] + 8, hp[1] + 1, hp[2] + (work ? -7 : 9)], [hp[0] + 5, hp[1] + 1, hp[2] + (work ? -7 : 11)]], '#9aa0a8', 2.1);
    return 0;
  },
  azap(R, col, act, fr) {
    const h = human(R, { tunic: shade(col, 1), pants: '#e6dcc4', sash: '#f1e9d2', vest: shade(col, .75) }, act, fr), a = h.a;
    R.ball([0, 0, h.top + 6], 4.6, '#f4efe0', 1.7); R.ball([0, 0, h.top + 3.6], 3.8, '#e8e0cc', 1.5);
    const atk = act === 'atk', t = atk ? fr / 6 : 0, thr = atk ? Math.sin(t * Math.PI) * 9 : 0;
    arm(R, 1, { top: h.top, p: [4 + thr, 5.2, h.top - 5] }, shade(col, 1)); R.cap([-8 + thr, 5.2, h.top - 8], [20 + thr, 5.2, h.top - 2], 1.5, '#7b5a34', 2); R.poly([[20 + thr, 4.6, h.top - 2], [27 + thr, 5.2, h.top - 1.2], [20 + thr, 5.8, h.top - 2]], '#c9ced6', 2.2);
    R.disc([2, -6.5, h.top - 6], 'y', 6.3, '#8a5a2a', 2.5, '#d9b25e'); R.ball([2, -7.2, h.top - 6], 1.6, '#d9b25e', 2.6);
    arm(R, -1, { top: h.top, p: [2, -5.5, h.top - 6] }, shade(col, 1));
  },
  okcu(R, col, act, fr) {
    const h = human(R, { tunic: '#4f7a4a', pants: '#4a3a28', sash: col, vest: '#6b5030' }, act, fr), a = h.a;
    R.ball([0, 0, h.top + 6.3], 4.4, col, 1.7); R.ball([0, 0, h.top + 7.8], 1.6, '#f1e9d2', 1.8);
    R.cap([-3, 4, h.top - 1], [-5, 4.4, h.top + 9], 2.6, '#6b4a2a', -1); // sadak
    const atk = act === 'atk', t = atk ? fr / 6 : 0, draw = atk ? Math.min(1, t * 1.6) * (t > .75 ? 0 : 1) : .0;
    const bow = [7, -5.5, h.top - 4]; arm(R, -1, { top: h.top, p: bow }, '#4f7a4a');
    const bt = [bow[0] + 1, bow[1], bow[2] + 11], bb = [bow[0] + 1, bow[1], bow[2] - 11], bm = [bow[0] + 4.5, bow[1], bow[2]];
    R.line(bt, bm, 1.8, '#6b3f1e', 2); R.line(bm, bb, 1.8, '#6b3f1e', 2);
    const nock = [bow[0] - 6 * draw, bow[1] + 2 * draw, bow[2]]; R.line(bt, nock, .8, '#eee', 2); R.line(nock, bb, .8, '#eee', 2);
    arm(R, 1, { top: h.top, p: nock }, '#4f7a4a'); if (!atk || draw > 0) R.line(nock, [bow[0] + 12, bow[1], bow[2]], 1, '#d9c28f', 2);
  },
  yeniceri(R, col, act, fr) {
    const h = human(R, { tunic: '#2f5d8a', pants: '#2f5d8a', sash: '#c0392b', vest: '#e8e2d2', boots: '#7a2a20' }, act, fr), a = h.a;
    R.ball([0, 0, h.top + 4.6], 4.2, '#e0b48a', .8);
    R.poly([[-2.8, -3.6, h.top + 6], [2.8, -3.6, h.top + 6], [3.6, 0, h.top + 18], [-3.6, 0, h.top + 17]], '#f4f1e8', 1.7); R.cap([-3, 0, h.top + 6], [-5, 0, h.top + 1], 2.4, '#f4f1e8', 1.5);
    R.ell([0, 0, h.top + 6.8], 3.4, 1.4, '#c0392b', 1.8);
    const atk = act === 'atk', rec = atk ? Math.sin(fr / 6 * Math.PI) * -2.5 : 0;
    arm(R, 1, { top: h.top, p: [5 + rec, 4.4, h.top - 4] }, '#2f5d8a'); arm(R, -1, { top: h.top, p: [9 + rec, -2.5, h.top - 3.5] }, '#2f5d8a');
    R.cap([-6 + rec, 4.4, h.top - 4.5], [17 + rec, -2.2, h.top - 3], 1.9, '#5a3a1e', 2.2); R.cap([13 + rec, -2, h.top - 3], [24 + rec, -2.5, h.top - 2.6], 1.2, '#2a2a2a', 2.3);
    if (atk && fr >= 1 && fr <= 2) { R.ball([27, -2.6, h.top - 2.4], 3.5, '#ffe28a', 3); R.ball([32, -2.6, h.top - 2.2], 2, '#fff', 3.1); }
  },
  sipahi(R, col, act, fr) {
    const sz = horse(R, { coat: '#7a4a28', blanket: col, trim: '#d9b25e' }, act, fr);
    const h = human(R, { tunic: '#e9e2d0', vest: shade(col, 1.1), pants: '#4a3a28', sash: '#d9b25e' }, 'idle', 0, sz + 1);
    R.ball([0, 0, h.top + 6], 4.5, '#f4efe0', 1.7); R.ball([0, 0, h.top + 3.6], 3.8, '#e8e0cc', 1.5);
    const atk = act === 'atk', t = atk ? fr / 6 : 0, th = atk ? Math.sin(t * Math.PI) * 10 : 0;
    arm(R, 1, { top: h.top, p: [5 + th, 5, h.top - 6] }, '#e9e2d0'); R.cap([-6 + th, 5, h.top - 8], [26 + th, 5, h.top - 2], 1.4, '#6b4a2a', 2); R.poly([[26 + th, 4.5, h.top - 2], [34 + th, 5, h.top - 1], [26 + th, 5.5, h.top - 2]], '#c9ced6', 2.1);
    R.poly([[6 + th, 5, h.top - 5.5], [14 + th, 5, h.top - 6.5], [10 + th, 5, h.top - 10]], col, 2.1);
    R.disc([3, -6, h.top - 7], 'y', 5, '#8a5a2a', 2.2, '#d9b25e'); arm(R, -1, { top: h.top, p: [3, -5.5, h.top - 7] }, '#e9e2d0');
  },
  sovalye(R, col, act, fr) {
    const sz = horse(R, { coat: '#b9b9b0', mane: '#8a8a82', blanket: col, trim: '#f2f2f2' }, act, fr);
    const h = human(R, { tunic: '#9aa3ad', vest: '#7d8590', pants: '#6b727c', sash: col, skin: '#9aa3ad', boots: '#555' }, 'idle', 0, sz + 1);
    R.ball([0, 0, h.top + 4.8], 4.6, '#aab2bb', 1.7); R.cap([0, 0, h.top + 6.8], [0, 0, h.top + 11.5], 1.8, col, 1.8); R.poly([[1.5, -1.6, h.top + 5.2], [4.4, -1.6, h.top + 5.2], [4.4, 1.6, h.top + 5.2], [1.5, 1.6, h.top + 5.2]], '#2a2f35', 1.9);
    const atk = act === 'atk', t = atk ? fr / 6 : 0, th = atk ? Math.sin(t * Math.PI) * 10 : 0;
    arm(R, 1, { top: h.top, p: [5 + th, 5, h.top - 6] }, '#9aa3ad'); R.cap([-8 + th, 5, h.top - 8], [28 + th, 5, h.top - 3], 1.6, '#6b4a2a', 2); R.poly([[28 + th, 4.4, h.top - 3], [36 + th, 5, h.top - 2.2], [28 + th, 5.6, h.top - 3]], '#d6dae0', 2.1);
    R.poly([[2, -5, h.top - 1], [6, -6.5, h.top - 3], [5.5, -7.5, h.top - 12], [1, -6.5, h.top - 14], [-2, -5.5, h.top - 6]], '#e8e8e8', 2.3); R.poly([[3, -6.4, h.top - 4], [5, -6.8, h.top - 5], [4.8, -7, h.top - 11], [3, -6.7, h.top - 11]], col, 2.4, true);
    arm(R, -1, { top: h.top, p: [3, -5.8, h.top - 7] }, '#9aa3ad');
  },
  fatih(R, col, act, fr) {
    const sz = horse(R, { coat: '#f1eee6', mane: '#e8e2d2', blanket: '#a8261f', trim: '#e7b93a' }, act, fr);
    const h = human(R, { tunic: '#b01f1a', vest: '#e7b93a', pants: '#f1e9d2', sash: '#e7b93a' }, 'idle', 0, sz + 1);
    R.ball([0, 0, h.top + 4.6], 4.2, '#dcae84', .8);
    R.ball([0, 0, h.top + 8.4], 6.2, '#f6f2e6', 1.7); R.ball([0, 0, h.top + 5.6], 4.8, '#efe7d2', 1.5); R.cap([0, 0, h.top + 6], [0, 0, h.top + 6.4], 9, '#c0392b', 1.55); R.ball([1.6, 0, h.top + 12], 1.6, '#e7b93a', 1.9);
    const atk = act === 'atk', t = atk ? fr / 6 : 0, sw = atk ? Math.sin(t * Math.PI) : 0;
    const hand = [5 + sw * 8, 5.5, h.top - 5 + sw * 3]; arm(R, 1, { top: h.top, p: hand }, '#b01f1a');
    R.cap(hand, [hand[0] + 9, hand[1], hand[2] + 14 - sw * 6], 1.7, '#e8edf3', 2.1); R.cap(hand, [hand[0] - 2, hand[1], hand[2] - 1], 2.2, '#e7b93a', 2.2);
    arm(R, -1, { top: h.top, p: [4, -5.2, h.top - 7] }, '#b01f1a');
    R.cap([-3, 0, h.top + 1], [-6.5, 0, h.top - 14], 8.5, col, -1.2); // pelerin
  },
  komutan(R, col, act, fr) {
    const sz = horse(R, { coat: '#3a2a22', mane: '#1a1210', blanket: col, trim: '#e7b93a' }, act, fr);
    const h = human(R, { tunic: shade(col, 1), vest: '#aab2bb', pants: '#6b727c', sash: '#e7b93a', skin: '#c9a07a' }, 'idle', 0, sz + 1);
    R.ball([0, 0, h.top + 4.8], 4.6, '#b8c0c8', 1.7); R.cap([0, 0, h.top + 7], [-4, 0, h.top + 15], 2.4, col, 1.8);
    const atk = act === 'atk', sw = atk ? Math.sin(fr / 6 * Math.PI) : 0;
    const hand = [5 + sw * 8, 5.5, h.top - 5]; arm(R, 1, { top: h.top, p: hand }, '#aab2bb'); R.cap(hand, [hand[0] + 11, hand[1], hand[2] + 13 - sw * 7], 1.6, '#e8edf3', 2.1);
    R.disc([3, -6, h.top - 7], 'y', 5.4, col, 2.2, '#e7b93a'); arm(R, -1, { top: h.top, p: [3, -5.6, h.top - 7] }, '#aab2bb');
    R.cap([-3, 0, h.top + 1], [-6.5, 0, h.top - 14], 8.5, shade(col, .8), -1.2);
  },
  top(R, col, act, fr) { cannon(R, col, act, fr, 1); },
  sahi(R, col, act, fr) { cannon(R, col, act, fr, 1.55); },
};
function cannon(R, col, act, fr, k) {
  const rec = act === 'atk' ? -Math.max(0, 1 - fr / 5) * 4 * k : 0;
  const wood = '#7a5230';
  R.cap([-9 * k + rec, -5.5 * k, 5 * k], [11 * k + rec, -5.5 * k, 5 * k], 3.2 * k, wood, -.3); R.cap([-9 * k + rec, 5.5 * k, 5 * k], [11 * k + rec, 5.5 * k, 5 * k], 3.2 * k, wood, .3);
  R.cap([-8 * k, -5.5 * k, 5 * k], [-8 * k, 5.5 * k, 5 * k], 2.4 * k, '#6a4426', 0);
  R.cap([-12 * k + rec * .5, 0, 4 * k], [-4 * k, 0, 6 * k], 2.4 * k, '#5a3a20', -.2);
  const bz = 9 * k + 1; R.cap([-8 * k + rec, 0, bz], [18 * k + rec, 0, bz + 1 * k], 6.4 * k, '#8f6a34', .2); R.cap([16 * k + rec, 0, bz + 1], [21 * k + rec, 0, bz + 1.2], 7.2 * k, '#a67c3c', .25);
  R.cap([-8 * k + rec, 0, bz], [-9.5 * k + rec, 0, bz], 5 * k, '#8a5a28', .1); R.ball([-10.5 * k + rec, 0, bz], 2.2 * k, '#8a5a28', .1);
  R.cap([2 * k + rec, 0, bz + 3 * k], [2 * k + rec, 0, bz + 4.4 * k], 8.4 * k, '#d9a05a', .3);
  const wr = 6.5 * k; for (const side of [-1, 1]) { R.disc([0, side * 7.3 * k, wr], 'x', wr, '#6a4426', side * .8, '#2a1a0c'); R.disc([0, side * 7.8 * k, wr], 'x', wr * .25, '#2a2a2a', side * .9 + .1); for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4 + (fr || 0) * .1; R.line([Math.cos(an) * wr * .9, side * 7.9 * k, wr + Math.sin(an) * wr * .9], [-Math.cos(an) * wr * .9, side * 7.9 * k, wr - Math.sin(an) * wr * .9], 1.1, '#2a1a0c', side * .9 + .2); } }
  R.cap([-12 * k, -3 * k, 3 * k], [-12 * k, 3 * k, 3 * k], 1.8, '#4a2e18');
  if (act === 'atk' && fr <= 2) { R.ball([25 * k, 0, bz + 1.2], 6 * k, '#ffd37a', 3); R.ball([30 * k, 0, bz + 1.2], 3.5 * k, '#fff', 3.1); }
}

/* ---------- sprite önbelleği ---------- */
const SPR = new Map(), DIRS8 = 8;
const UN_N = { walk: 8, atk: 6, idle: 1 };
function unitSprite(look, colIdx, dir, act, fr) {
  const key = look + colIdx + '|' + dir + act + fr; let s = SPR.get(key); if (s) return s;
  const W = 128, H = 112, cv = mkCanvas(W, H), c = cv.getContext('2d'), big = look === 'sahi';
  const R = new Rig(c, W / 2, 86, dir * Math.PI / 4, 1.25);
  const col = G.colors[colIdx];
  // gölge
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(W / 2, 87, (look === 'sipahi' || look === 'sovalye' || look === 'fatih' || look === 'komutan' ? 17 : big ? 19 : look === 'top' ? 14 : 9) * 1.25, (look === 'sahi' ? 9 : 5.5) * 1.25, 0, 0, 7); c.fill();
  (PAINT[look] || PAINT.azap)(R, col, act, fr); R.flush();
  s = cv; SPR.set(key, s); return s;
}
function facingDir(face) { return ((Math.round(face / (Math.PI / 4)) % 8) + 8) % 8; }

/* ======================  AĞAÇ / KAYNAK SPRITE'LARI  ====================== */
const RESSPR = {};
function blob(c, x, y, rx, ry, col) { const g = c.createRadialGradient(x - rx * .35, y - ry * .45, rx * .1, x, y, rx * 1.1); g.addColorStop(0, shade(col, 1.45)); g.addColorStop(.5, shade(col, 1)); g.addColorStop(1, shade(col, .6)); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
function treeSprite(v) {
  const k = 't' + v; if (RESSPR[k]) return RESSPR[k]; const cv = mkCanvas(64, 84), c = cv.getContext('2d'), r = makeRng(v * 77 + 3);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(32, 72, 17, 7, 0, 0, 7); c.fill();
  const kind = v % 3, greens = ['#3f7a2c', '#4a8a30', '#356b2a', '#5a8f34'];
  if (kind === 0) { // meşe
    c.fillStyle = '#4a3220'; c.beginPath(); c.moveTo(28, 72); c.lineTo(30, 44); c.lineTo(35, 44); c.lineTo(38, 72); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(30, 46, 2, 24);
    const g = greens[v % 4]; blob(c, 20, 40, 14, 11, shade(g, .85)); blob(c, 44, 40, 14, 11, shade(g, .85)); blob(c, 32, 30, 20, 17, g); blob(c, 24, 22, 12, 10, shade(g, 1.12)); blob(c, 42, 24, 11, 9, shade(g, 1.05)); blob(c, 33, 14, 9, 7, shade(g, 1.2));
  } else if (kind === 1) { // çam
    c.fillStyle = '#4a3220'; c.fillRect(30, 56, 5, 16); const g = greens[(v + 1) % 4];
    for (let i = 0; i < 4; i++) { const y = 56 - i * 13, w = 24 - i * 4; c.beginPath(); c.moveTo(32.5 - w, y + 4); c.lineTo(32.5, y - 17); c.lineTo(32.5 + w, y + 4); c.closePath(); const gr = c.createLinearGradient(32.5 - w, 0, 32.5 + w, 0); gr.addColorStop(0, shade(g, 1.25)); gr.addColorStop(.5, shade(g, .95)); gr.addColorStop(1, shade(g, .62)); c.fillStyle = gr; c.fill(); c.strokeStyle = 'rgba(10,30,10,.4)'; c.lineWidth = 1; c.stroke(); }
  } else { // servi
    c.fillStyle = '#4a3220'; c.fillRect(30, 62, 5, 10); const g = '#2f5f2a'; c.beginPath(); c.moveTo(32.5, 4); c.bezierCurveTo(50, 22, 48, 56, 32.5, 66); c.bezierCurveTo(17, 56, 15, 22, 32.5, 4); const gr = c.createLinearGradient(16, 0, 50, 0); gr.addColorStop(0, shade(g, 1.35)); gr.addColorStop(.55, shade(g, .95)); gr.addColorStop(1, shade(g, .55)); c.fillStyle = gr; c.fill(); c.strokeStyle = 'rgba(10,30,10,.4)'; c.stroke();
  }
  for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(255,255,230,${.06 + r() * .08})`; c.fillRect(14 + r() * 36, 8 + r() * 44, 2, 2); }
  return RESSPR[k] = cv;
}
function mineSprite(v) {
  const k = 'm' + v; if (RESSPR[k]) return RESSPR[k]; const cv = mkCanvas(64, 56), c = cv.getContext('2d'), r = makeRng(v * 31 + 5);
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(32, 42, 24, 9, 0, 0, 7); c.fill();
  const rock = (x, y, w, h, col) => { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * .7, y - h * .7); c.lineTo(x - w * .1, y - h); c.lineTo(x + w * .6, y - h * .8); c.lineTo(x + w, y); c.closePath(); const g = c.createLinearGradient(x - w, y - h, x + w, y); g.addColorStop(0, shade(col, 1.35)); g.addColorStop(.5, shade(col, 1)); g.addColorStop(1, shade(col, .6)); c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); };
  rock(20, 42, 16, 26, '#8b857a'); rock(42, 44, 18, 32, '#7c766b'); rock(31, 46, 14, 20, '#9a948a');
  for (let i = 0; i < 9; i++) { const x = 14 + r() * 36, y = 24 + r() * 18, s = 2.5 + r() * 3; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s, y); c.lineTo(x, y + s * .8); c.lineTo(x - s, y); c.closePath(); const g = c.createLinearGradient(x - s, y - s, x + s, y + s); g.addColorStop(0, '#fff2a8'); g.addColorStop(.5, '#f2c230'); g.addColorStop(1, '#a8741a'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(80,50,0,.6)'; c.stroke(); }
  return RESSPR[k] = cv;
}
function berrySprite(v) {
  const k = 'b' + v; if (RESSPR[k]) return RESSPR[k]; const cv = mkCanvas(48, 36), c = cv.getContext('2d'), r = makeRng(v * 13 + 1);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(24, 26, 16, 6, 0, 0, 7); c.fill();
  blob(c, 15, 20, 11, 8, '#3f7a2c'); blob(c, 31, 20, 11, 8, '#4a8a30'); blob(c, 23, 14, 12, 9, '#58963a');
  for (let i = 0; i < 12; i++) { const x = 9 + r() * 30, y = 9 + r() * 16; c.fillStyle = '#c0213e'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - 1, y - 1.2, 1, 1); }
  return RESSPR[k] = cv;
}

/* ======================  ARAZİ  ====================== */
function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y, s) => vnoise(x, y, s) * .55 + vnoise(x * 2.1, y * 2.1, s + 1) * .3 + vnoise(x * 4.3, y * 4.3, s + 2) * .15;
function bakeTerrain() {
  const W = G.W, H = G.H, T = LITE ? 16 : 32, cv = mkCanvas(W * T, H * T), c = cv.getContext('2d'), seed = G.m.seed, r = makeRng(seed + 5);
  // 1) kara renk haritası (W×H) -> pürüzsüz büyütme
  const base = mkCanvas(W, H), bc = base.getContext('2d'), id = bc.createImageData(W, H);
  const grass = [[92, 132, 52], [112, 148, 58], [78, 118, 48]], dirtc = [168, 132, 84], sandc = [214, 192, 140];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, t = G.terrain[i]; const n = fbm(x * .12, y * .12, seed), n2 = fbm(x * .5, y * .5, seed + 9);
    let col; if (t === 4) { col = [150, 140, 122].map(v => v * (.9 + n2 * .14)); } else if (t === 2) { col = dirtc.map((v, k) => v * (.88 + n2 * .22)); } else if (t === 3 || t === 1) col = sandc.map(v => v * (.92 + n2 * .1));
    else { const g = n < .45 ? mixv(grass[2], grass[0], n / .45) : mixv(grass[0], grass[1], (n - .45) / .55); col = g.map(v => v * (.9 + n2 * .2)); }
    id.data[i * 4] = col[0]; id.data[i * 4 + 1] = col[1]; id.data[i * 4 + 2] = col[2]; id.data[i * 4 + 3] = 255;
  }
  bc.putImageData(id, 0, 0); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(base, 0, 0, W * T, H * T);
  // 2) doku: çimen kümeleri, taşlar, çiçekler
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = G.terrain[y * W + x]; if (t === 1) continue;
    const n = t === 0 ? 7 : t === 4 ? 12 : 3;
    for (let k = 0; k < n; k++) {
      const px = x * T + r() * T, py = y * T + r() * T;
      if (t === 0) { const dark = r() < .5; c.strokeStyle = dark ? 'rgba(40,80,30,.35)' : 'rgba(190,220,110,.28)'; c.lineWidth = 1; const h = 3 + r() * 4; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 1.5, py - h); c.moveTo(px, py); c.lineTo(px + .5, py - h * 1.1); c.moveTo(px, py); c.lineTo(px + 2, py - h * .8); c.stroke(); }
      else if (t === 2) { c.fillStyle = r() < .5 ? 'rgba(90,60,30,.25)' : 'rgba(230,200,150,.22)'; c.beginPath(); c.ellipse(px, py, 1 + r() * 2, .8 + r(), 0, 0, 7); c.fill(); }
      else if (t === 4) { c.strokeStyle = 'rgba(60,50,40,.28)'; c.lineWidth = 1; c.strokeRect(((px / 8) | 0) * 8, ((py / 6) | 0) * 6, 8, 6); }
      else { c.fillStyle = 'rgba(160,130,80,.18)'; c.fillRect(px, py, 2, 1); }
    }
    if (t === 0 && r() < .09) { const px = x * T + r() * T, py = y * T + r() * T; c.fillStyle = ['#ffffff', '#ffe066', '#c58ae6', '#ff8aa0'][(r() * 4) | 0]; c.beginPath(); c.arc(px, py, 1.5, 0, 7); c.fill(); }
    if (t === 2 && r() < .12) { const px = x * T + r() * T, py = y * T + r() * T; c.fillStyle = '#8f877a'; c.beginPath(); c.ellipse(px, py, 3, 2, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(px - 1, py - 1.5, 2, 1); }
  }
  // 3) su (yumuşak sahil) 8px/kare çözünürlükte
  let hasWater = false; for (let i = 0; i < W * H; i++) if (G.terrain[i] === 1) { hasWater = true; break; }
  if (hasWater) {
    const S = 8, mw = W * S, mh = H * S, mk = mkCanvas(W, H), mkc = mk.getContext('2d'), mi = mkc.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { const w = G.terrain[i] === 1 ? 255 : 0; mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = w; mi.data[i * 4 + 3] = 255; } mkc.putImageData(mi, 0, 0);
    const bl = mkCanvas(mw, mh), blc = bl.getContext('2d'); blc.filter = 'blur(7px)'; blc.imageSmoothingEnabled = true; blc.drawImage(mk, 0, 0, mw, mh);
    // kenarlarda blur dışarı sızmasın: harita kenarındaki su komşuları su sayılsın
    const src = blc.getImageData(0, 0, mw, mh).data, ov = mkCanvas(mw, mh), oc = ov.getContext('2d'), oi = oc.createImageData(mw, mh), od = oi.data;
    for (let py = 0; py < mh; py++) for (let px = 0; px < mw; px++) {
      const i = py * mw + px; let v = src[i * 4] / 255; const nz = (fbm(px * .09, py * .09, seed + 40) - .5) * .22; const th = .5 + nz; const o = i * 4;
      if (v > th) { const dep = Math.min(1, (v - th) / .4); const sh = [70 + (-30) * dep, 160 + (-70) * dep, 170 + (-50) * dep]; const rip = (fbm(px * .22, py * .22, seed + 77) - .5) * 26; od[o] = sh[0] + rip * .4; od[o + 1] = sh[1] + rip * .7; od[o + 2] = sh[2] + rip; od[o + 3] = 255; if (v - th < .045) { const f = 1 - (v - th) / .045; od[o] = od[o] + (255 - od[o]) * f * .85; od[o + 1] = od[o + 1] + (255 - od[o + 1]) * f * .85; od[o + 2] = od[o + 2] + (255 - od[o + 2]) * f * .85; } }
      else if (v > th - .2) { const f = (v - (th - .2)) / .2; od[o] = 205; od[o + 1] = 186; od[o + 2] = 138; od[o + 3] = 255 * Math.min(1, f * 1.4) * .9; if (f > .7) { od[o] = 150; od[o + 1] = 130; od[o + 2] = 95; od[o + 3] = 120 * (f - .7) / .3 + od[o + 3] * .5; } }
    }
    oc.putImageData(oi, 0, 0); c.drawImage(ov, 0, 0, W * T, H * T);
  }
  // 4) hafif ışık: sol üstten sıcak, sağ alttan soğuk
  const g = c.createLinearGradient(0, 0, W * T, H * T); g.addColorStop(0, 'rgba(255,240,200,.07)'); g.addColorStop(1, 'rgba(20,30,60,.10)'); c.fillStyle = g; c.fillRect(0, 0, W * T, H * T);
  return cv;
}
function mixv(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

/* ======================  BİNALAR  ====================== */
const BH = { saray: 100, ev: 34, ambar: 36, tarla: 6, kisla: 52, ahir: 50, ocak: 60, dokum: 62, kule: 80, hisar: 110, sur: 40, kapi: 40, burc: 86, kale: 110, kamp: 56, ayasofya: 90 };
function Bp(c, ox, oy) { // yerel (x,y,z) -> kanvas
  return { c, p: (x, y, z) => [ox + x - y, oy + (x + y) / 2 - (z || 0)] };
}
function pathP(c, pts, fill, stroke) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke !== false) { c.strokeStyle = stroke || OUT; c.lineWidth = 1; c.stroke(); } }
function face(B, a, b, z0, z1, col, tex, o) { // a,b: [x,y]; dikey duvar yüzü
  const { c, p } = B; const P = [p(a[0], a[1], z0), p(b[0], b[1], z0), p(b[0], b[1], z1), p(a[0], a[1], z1)];
  const g = c.createLinearGradient(P[0][0], P[0][1], P[1][0], P[1][1]); g.addColorStop(0, shade(col, 1.06)); g.addColorStop(1, shade(col, .94)); pathP(c, P, g);
  const L = (s, z) => p(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, z);
  c.lineWidth = 1;
  if (tex === 'brick') { const rows = Math.max(1, Math.round((z1 - z0) / 6)), len = Math.hypot(b[0] - a[0], b[1] - a[1]); c.strokeStyle = 'rgba(40,25,10,.22)'; for (let r = 1; r < rows; r++) { const z = z0 + (z1 - z0) * r / rows, A = L(0, z), Bb = L(1, z); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Bb[0], Bb[1]); c.stroke(); } const n = Math.max(1, Math.round(len / 10)); for (let r = 0; r < rows; r++) for (let k = 0; k <= n; k++) { const s = (k + (r % 2) * .5) / n; if (s > 1) continue; const A = L(s, z0 + (z1 - z0) * r / rows), Bb = L(s, z0 + (z1 - z0) * (r + 1) / rows); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Bb[0], Bb[1]); c.stroke(); } c.strokeStyle = 'rgba(255,255,255,.08)'; for (let r = 0; r < rows; r++) { const z = z0 + (z1 - z0) * (r + 1) / rows, A = L(0, z), Bb = L(1, z); c.beginPath(); c.moveTo(A[0], A[1] + 1); c.lineTo(Bb[0], Bb[1] + 1); c.stroke(); } }
  else if (tex === 'plank') { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 5)); c.strokeStyle = 'rgba(30,15,5,.3)'; for (let k = 1; k < n; k++) { const A = L(k / n, z0), Bb = L(k / n, z1); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Bb[0], Bb[1]); c.stroke(); } }
  else if (tex === 'plaster') { c.strokeStyle = 'rgba(120,90,50,.12)'; for (let r = 1; r < 4; r++) { const z = z0 + (z1 - z0) * r / 4, A = L(.05, z), Bb = L(.95, z); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Bb[0], Bb[1]); c.stroke(); } }
  return L;
}
function boxB(B, x0, y0, x1, y1, z0, z1, col, tex, o) {
  o = o || {}; const { c, p } = B;
  face(B, [x1, y0], [x1, y1], z0, z1, shade(col, o.right || .72), tex);   // +x yüzü (sağ)
  face(B, [x0, y1], [x1, y1], z0, z1, shade(col, o.left || .96), tex);    // +y yüzü (sol)
  if (!o.notop) { const P = [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)]; pathP(c, P, shade(o.topCol || col, 1.18)); }
}
function door(B, side, pos, w, h, z, col) { // side 'x' (x sabit) / 'y'
  const { c, p } = B; const [fixed, a, b] = side === 'x' ? [pos[0], pos[1], pos[1] + w] : [pos[1], pos[0], pos[0] + w];
  const P = side === 'x' ? [p(fixed, a, z), p(fixed, b, z), p(fixed, b, z + h), p(fixed, (a + b) / 2, z + h + w * .18), p(fixed, a, z + h)] : [p(a, fixed, z), p(b, fixed, z), p(b, fixed, z + h), p((a + b) / 2, fixed, z + h + w * .18), p(a, fixed, z + h)];
  pathP(c, P, col || '#3a2414', 'rgba(0,0,0,.5)');
}
function windowB(B, side, fixed, a, z, w, h, col) { const { c, p } = B; const P = side === 'x' ? [p(fixed, a, z), p(fixed, a + w, z), p(fixed, a + w, z + h), p(fixed, a, z + h)] : [p(a, fixed, z), p(a + w, fixed, z), p(a + w, fixed, z + h), p(a, fixed, z + h)]; pathP(c, P, col || '#2a1c10', 'rgba(255,230,160,.5)'); }
function hip(B, x0, y0, x1, y1, z, peak, col, rows) {
  const { c, p } = B, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ap = p(cx, cy, z + peak);
  const R = [p(x1, y0, z), p(x1, y1, z), ap], Lf = [p(x0, y1, z), p(x1, y1, z), ap];
  pathP(c, R, shade(col, .74)); pathP(c, Lf, shade(col, 1.02));
  c.strokeStyle = 'rgba(30,10,5,.28)'; rows = rows || 5; for (let k = 1; k < rows; k++) { const t = k / rows; for (const tri of [R, Lf]) { const A = [tri[0][0] + (tri[2][0] - tri[0][0]) * t, tri[0][1] + (tri[2][1] - tri[0][1]) * t], Bb = [tri[1][0] + (tri[2][0] - tri[1][0]) * t, tri[1][1] + (tri[2][1] - tri[1][1]) * t]; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Bb[0], Bb[1]); c.stroke(); } }
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(Lf[0][0], Lf[0][1]); c.lineTo(ap[0], ap[1]); c.lineTo(R[0][0], R[0][1]); c.stroke();
}
function gable(B, x0, y0, x1, y1, z, peak, col, wallCol) { // sırt x ekseninde
  const { c, p } = B, cy = (y0 + y1) / 2;
  pathP(c, [p(x1, y0, z), p(x1, y1, z), p(x1, cy, z + peak)], shade(wallCol, .7));
  const Q = [p(x0, y1 + 3, z - 2), p(x1 + 3, y1 + 3, z - 2), p(x1 + 3, cy, z + peak), p(x0, cy, z + peak)];
  pathP(c, Q, shade(col, 1)); c.strokeStyle = 'rgba(30,10,5,.28)'; for (let k = 1; k < 5; k++) { const t = k / 5, a = [Q[0][0] + (Q[3][0] - Q[0][0]) * t, Q[0][1] + (Q[3][1] - Q[0][1]) * t], b = [Q[1][0] + (Q[2][0] - Q[1][0]) * t, Q[1][1] + (Q[2][1] - Q[1][1]) * t]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  c.strokeStyle = shade(col, 1.3); c.lineWidth = 2; c.beginPath(); c.moveTo(Q[3][0], Q[3][1]); c.lineTo(Q[2][0], Q[2][1]); c.stroke();
}
function dome(B, cx, cy, z, r, h, col, fin) {
  const { c, p } = B, ctr = p(cx, cy, z), rx = r * 1.414, ry = r * .707;
  // alt halka
  c.beginPath(); c.moveTo(ctr[0] - rx, ctr[1]); c.bezierCurveTo(ctr[0] - rx, ctr[1] - h * 1.25, ctr[0] + rx, ctr[1] - h * 1.25, ctr[0] + rx, ctr[1]); c.ellipse(ctr[0], ctr[1], rx, ry, 0, 0, Math.PI, false); c.closePath();
  const g = c.createRadialGradient(ctr[0] - rx * .35, ctr[1] - h * .8, rx * .1, ctr[0], ctr[1] - h * .3, rx * 1.15); g.addColorStop(0, shade(col, 1.5)); g.addColorStop(.45, shade(col, 1.05)); g.addColorStop(1, shade(col, .6)); c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.18)'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(ctr[0] + k * rx * .3, ctr[1] + ry * .85 * (1 - Math.abs(k) * .1)); c.quadraticCurveTo(ctr[0] + k * rx * .22, ctr[1] - h * .7, ctr[0], ctr[1] - h * .95); c.stroke(); }
  if (fin) { const top = [ctr[0], ctr[1] - h * .95]; c.strokeStyle = '#e7b93a'; c.lineWidth = 2; c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(top[0], top[1] - 12); c.stroke(); if (fin === 'crescent') { c.fillStyle = '#e7b93a'; c.beginPath(); c.arc(top[0], top[1] - 14, 4, 0, 7); c.fill(); c.fillStyle = shade(col, 1.1); c.beginPath(); c.arc(top[0] + 1.4, top[1] - 14.6, 3.4, 0, 7); c.fill(); } else { c.fillStyle = '#e7b93a'; c.fillRect(top[0] - 1, top[1] - 17, 2, 8); c.fillRect(top[0] - 3.5, top[1] - 14, 7, 2); } }
}
function cyl(B, cx, cy, z0, z1, r, col, tex) { // dikey silindir
  const { c, p } = B, a = p(cx, cy, z0), b = p(cx, cy, z1), rx = r * 1.414, ry = r * .707;
  const g = c.createLinearGradient(a[0] - rx, 0, a[0] + rx, 0); g.addColorStop(0, shade(col, 1.25)); g.addColorStop(.45, shade(col, 1.0)); g.addColorStop(1, shade(col, .55));
  c.beginPath(); c.moveTo(a[0] - rx, a[1]); c.lineTo(b[0] - rx, b[1]); c.ellipse(b[0], b[1], rx, ry, 0, Math.PI, 0, false); c.lineTo(a[0] + rx, a[1]); c.ellipse(a[0], a[1], rx, ry, 0, 0, Math.PI, false); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  if (tex === 'brick') { c.strokeStyle = 'rgba(40,25,10,.2)'; const rows = Math.round((z1 - z0) / 6); for (let k = 1; k < rows; k++) { const y = a[1] + (b[1] - a[1]) * k / rows; c.beginPath(); c.ellipse(a[0], y, rx, ry, 0, 0, Math.PI, false); c.stroke(); } }
  c.beginPath(); c.ellipse(b[0], b[1], rx, ry, 0, 0, 7); c.fillStyle = shade(col, 1.2); c.fill(); c.strokeStyle = OUT; c.stroke();
  return { rx, ry, top: b };
}
function cone(B, cx, cy, z0, h, r, col) { const { c, p } = B, a = p(cx, cy, z0), rx = r * 1.414, ry = r * .707, ap = [a[0], a[1] - h]; const g = c.createLinearGradient(a[0] - rx, 0, a[0] + rx, 0); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(.5, shade(col, 1)); g.addColorStop(1, shade(col, .55)); c.beginPath(); c.moveTo(a[0] - rx, a[1]); c.lineTo(ap[0], ap[1]); c.lineTo(a[0] + rx, a[1]); c.ellipse(a[0], a[1], rx, ry, 0, 0, Math.PI, false); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); }
function merlons(B, x0, y0, x1, y1, z, col, n) { // üst kenar mazgalları (yalnızca görünen iki kenar)
  const { c, p } = B; n = n || Math.max(2, Math.round(Math.max(x1 - x0, y1 - y0) / 10));
  const mh = 5, ww = (x1 - x0) / (n * 2), wy = (y1 - y0) / (n * 2);
  for (let k = 0; k < n; k++) { const xa = x0 + (x1 - x0) * (k * 2 + .5) / (n * 2); boxB(B, xa, y1 - 3, xa + ww, y1, z, z + mh, col, null, { right: .72, left: .98 }); }
  for (let k = 0; k < n; k++) { const ya = y0 + (y1 - y0) * (k * 2 + .5) / (n * 2); boxB(B, x1 - 3, ya, x1, ya + wy, z, z + mh, col, null, { right: .72, left: .98 }); }
}
function minaret(B, cx, cy, h, col, roof) {
  cyl(B, cx, cy, 0, h, 4.2, col); cyl(B, cx, cy, h * .62, h * .66, 6.8, shade(col, .9)); cone(B, cx, cy, h, 20, 4.8, roof || '#5d6e78');
  const t = B.p(cx, cy, h + 20); B.c.strokeStyle = '#e7b93a'; B.c.lineWidth = 1.6; B.c.beginPath(); B.c.moveTo(t[0], t[1]); B.c.lineTo(t[0], t[1] - 7); B.c.stroke();
}
function tent(B, cx, cy, r, h, cA, cB, door) {
  const { c, p } = B, n = 14, apex = p(cx, cy, h);
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push({ a, q: p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0), d: Math.cos(a) + Math.sin(a) }); }
  const idxs = pts.map((_, i) => i).sort((a, b) => pts[a].d - pts[b].d);
  for (const i of idxs) { const a = pts[i], b = pts[(i + 1) % n]; if (a.d + b.d < -.4) continue; const sh = .65 + .4 * (1 - (a.d + b.d + 2) / 4); pathP(c, [a.q, b.q, apex], shade(i % 2 ? cA : cB, sh), 'rgba(0,0,0,.35)'); }
  if (door) { const fr = p(cx + r * .72, cy + r * .72, 0), l = p(cx + r * .6, cy + r * .84, 0), rr = p(cx + r * .84, cy + r * .6, 0); pathP(c, [l, rr, p(cx + r * .6, cy + r * .6, h * .36)], '#2a1a10'); }
  c.strokeStyle = '#e7b93a'; c.lineWidth = 2; c.beginPath(); c.moveTo(apex[0], apex[1]); c.lineTo(apex[0], apex[1] - 14); c.stroke(); c.fillStyle = '#e7b93a'; c.beginPath(); c.arc(apex[0], apex[1] - 15, 2.6, 0, 7); c.fill();
}
function barrel(B, x, y, z) { const { c, p } = B; cyl(B, x, y, z, z + 7, 3.4, '#8a5a2a'); const a = p(x, y, z + 3.5); c.strokeStyle = '#3a2a18'; c.lineWidth = 1; c.beginPath(); c.ellipse(a[0], a[1], 4.8, 2.4, 0, 0, Math.PI); c.stroke(); }

const BSPR = new Map();
function buildingSprite(type, colIdx, flag) {
  const key = type + colIdx + (flag || ''); let s = BSPR.get(key); if (s) return s;
  const d = BUILDS[type], w = d.w * 32, h = d.h * 32, pad = 24, hgt = BH[type] + 50, cw = w + h + pad * 2, ch = (w + h) / 2 + hgt + pad;
  const cv = mkCanvas(cw, ch), c = cv.getContext('2d'), ox = h + pad, oy = hgt, B = Bp(c, ox, oy), col = G.colors[colIdx];
  c.lineJoin = 'round'; const meta = { ox, oy, flags: [], smoke: [], cw, ch };
  const stone = '#bdb09a', plast = '#e4d7b8', wood = '#8a6238';
  // zemin gölgesi
  { const P = [B.p(-4, -4, 0), B.p(w + 8, -4, 0), B.p(w + 8, h + 8, 0), B.p(-4, h + 8, 0)]; pathP(c, P, 'rgba(0,0,0,.2)', false); }
  const T = type;
  if (T === 'tarla') {
    pathP(c, [B.p(0, 0, 0), B.p(w, 0, 0), B.p(w, h, 0), B.p(0, h, 0)], '#7a5a30', 'rgba(0,0,0,.4)');
    for (let r = 0; r < 6; r++) { const y = 5 + r * (h - 10) / 5; for (let k = 0; k < 11; k++) { const x = 5 + k * (w - 10) / 10, a = B.p(x, y, 0); c.strokeStyle = '#d9b84a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] - 1, a[1] - 7); c.moveTo(a[0], a[1]); c.lineTo(a[0] + 2, a[1] - 6); c.stroke(); c.fillStyle = '#f2d760'; c.beginPath(); c.ellipse(a[0] - 1, a[1] - 8, 1.1, 2.2, 0, 0, 7); c.fill(); } }
  } else if (T === 'ev') {
    boxB(B, 5, 5, w - 5, h - 5, 0, 15, plast, 'plaster'); door(B, 'y', [w / 2 - 6, h - 5], 10, 11, 0); windowB(B, 'x', w - 5, h / 2 - 4, 6, 8, 7); hip(B, 1, 1, w - 1, h - 1, 15, 15, '#b5452f', 5);
    const ch = B.p(w * .7, h * .35, 24); c.fillStyle = '#8a7a66'; c.fillRect(ch[0] - 3, ch[1] - 7, 6, 9);
  } else if (T === 'ambar') {
    boxB(B, 5, 5, w - 5, h - 5, 0, 14, '#a87a46', 'plank'); door(B, 'y', [w / 2 - 7, h - 5], 14, 11, 0, '#4a2c14'); gable(B, 1, 1, w - 1, h - 1, 14, 14, '#c9a85a', '#a87a46');
    barrel(B, w - 4, h + 4, 0); barrel(B, w + 3, h - 6, 0); const sk = B.p(6, h + 4, 0); c.fillStyle = '#d9c39a'; c.beginPath(); c.ellipse(sk[0], sk[1] - 4, 5, 6, 0, 0, 7); c.fill(); c.strokeStyle = OUT; c.stroke();
  } else if (T === 'kisla') {
    boxB(B, 5, 5, w - 5, h - 5, 0, 26, stone, 'brick'); door(B, 'y', [w / 2 - 9, h - 5], 18, 18, 0, '#3a2414'); windowB(B, 'x', w - 5, h * .3, 12, 7, 9); windowB(B, 'x', w - 5, h * .62, 12, 7, 9); windowB(B, 'y', h - 5, w * .2, 12, 7, 9);
    gable(B, 1, 1, w - 1, h - 1, 26, 16, '#6b4636', stone); meta.flags.push({ x: w * .5, y: h * .5, z: 50 });
    for (let i = 0; i < 4; i++) { const a = B.p(w - 2, 14 + i * 8, 0); c.strokeStyle = '#6b4a2a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] + 1, a[1] - 20); c.stroke(); c.fillStyle = '#c9ced6'; c.fillRect(a[0] - 1, a[1] - 24, 3, 5); }
  } else if (T === 'ahir') {
    boxB(B, 5, 5, w - 5, h - 5, 0, 22, wood, 'plank'); pathP(c, [B.p(w - 5, 14, 0), B.p(w - 5, h - 14, 0), B.p(w - 5, h - 14, 16), B.p(w - 5, 14, 16)], '#2a1a10'); pathP(c, [B.p(w - 5, 16, 0), B.p(w - 5, h - 16, 0), B.p(w - 5, h - 16, 5)], '#d9b84a', false);
    gable(B, 1, 1, w - 1, h - 1, 22, 18, '#d0b266', wood); meta.flags.push({ x: w * .5, y: h * .5, z: 50 });
    const hd = B.p(w - 4, h * .42, 12); c.fillStyle = '#7a4a28'; c.beginPath(); c.ellipse(hd[0] + 2, hd[1], 3.5, 5, .3, 0, 7); c.fill();
  } else if (T === 'ocak') {
    boxB(B, 4, 4, w - 4, h - 4, 0, 28, '#c9b28a', 'brick'); door(B, 'y', [w / 2 - 9, h - 4], 18, 18, 0, '#3a1a14'); windowB(B, 'x', w - 4, h * .35, 14, 8, 10);
    hip(B, 0, 0, w, h, 28, 20, '#8a2a22', 6); meta.flags.push({ x: w * .5, y: h * .5, z: 60 });
    const kz = B.p(w + 4, h * .5, 0); c.fillStyle = '#2a2a2a'; c.beginPath(); c.ellipse(kz[0], kz[1] - 6, 8, 5, 0, 0, 7); c.fill(); c.fillStyle = '#5a5a5a'; c.beginPath(); c.ellipse(kz[0], kz[1] - 8, 7, 3.5, 0, 0, 7); c.fill(); c.strokeStyle = '#111'; c.stroke();
  } else if (T === 'dokum') {
    boxB(B, 4, 4, w - 4, h - 4, 0, 28, '#8f8579', 'brick'); door(B, 'y', [w / 2 - 10, h - 4], 20, 18, 0, '#1a1210'); pathP(c, [B.p(w - 4, h * .3, 4), B.p(w - 4, h * .62, 4), B.p(w - 4, h * .62, 18), B.p(w - 4, h * .3, 18)], '#ff8a2a', 'rgba(0,0,0,.5)');
    gable(B, 0, 0, w, h, 28, 16, '#4a3a34', '#8f8579'); cyl(B, w * .3, h * .3, 28, 62, 5, '#6a5f55', 'brick'); meta.smoke.push({ x: w * .3, y: h * .3, z: 64 }); meta.flags.push({ x: w * .7, y: h * .5, z: 52 });
    const cb = B.p(w + 4, h * .8, 0); c.strokeStyle = '#b0793a'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(cb[0] - 8, cb[1] - 8); c.lineTo(cb[0] + 10, cb[1] - 4); c.stroke();
  } else if (T === 'kule' || T === 'burc') {
    const r = w * .38, hh = T === 'kule' ? 56 : 64; cyl(B, w / 2, h / 2, 0, hh, r, '#b3a590', 'brick'); const cc = B.p(w / 2, h / 2, hh); c.fillStyle = '#9a8c77';
    if (T === 'kule') { cone(B, w / 2, h / 2, hh, 28, r + 3, '#7a3a2c'); meta.flags.push({ x: w / 2, y: h / 2, z: hh + 30 }); }
    else { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, mx = w / 2 + Math.cos(a) * r * .86, my = h / 2 + Math.sin(a) * r * .86; if (Math.cos(a) + Math.sin(a) > -.5) boxB(B, mx - 3, my - 3, mx + 3, my + 3, hh, hh + 6, '#b3a590', null); } meta.flags.push({ x: w / 2, y: h / 2, z: hh + 18 }); }
    const sl = B.p(w / 2 + r * .1, h / 2 + r * .98, hh * .55); c.fillStyle = '#1a1208'; c.fillRect(sl[0] - 1.5, sl[1] - 5, 3, 9);
  } else if (T === 'sur') {
    boxB(B, 0, 0, w, h, 0, 34, '#aaa292', 'brick', { right: .66, left: .93 }); merlons(B, 0, 0, w, h, 34, '#aaa292', 3);
  } else if (T === 'kapi') {
    boxB(B, 0, 0, w, h, 0, 36, '#a39b8b', 'brick', { right: .66, left: .93 }); door(B, 'x', [w, 4], 24, 22, 0, '#4a2c14'); door(B, 'y', [4, h], 24, 22, 0, '#4a2c14'); merlons(B, 0, 0, w, h, 36, '#a39b8b', 3);
    const a = B.p(w, 16, 12); c.strokeStyle = '#2a1a10'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1] - 10); c.lineTo(a[0], a[1] + 12); c.stroke();
  } else if (T === 'kale' || T === 'hisar') {
    const base = T === 'hisar' ? '#b9ad98' : '#a89c88', hh = T === 'hisar' ? 52 : 48;
    boxB(B, 12, 12, w - 12, h - 12, 0, hh, base, 'brick'); door(B, 'y', [w / 2 - 12, h - 12], 24, 26, 0, '#3a2414'); merlons(B, 12, 12, w - 12, h - 12, hh, base, 5);
    for (const [tx, ty] of T === 'hisar' ? [[18, 18], [w - 18, 18], [w - 18, h - 18], [18, h - 18]] : [[14, 14], [w - 14, 14], [w - 14, h - 14], [14, h - 14]]) { const r = T === 'hisar' ? 15 : 13, hz = hh + 20; cyl(B, tx, ty, 0, hz, r, base, 'brick'); cone(B, tx, ty, hz, 26, r + 2, T === 'hisar' ? '#5d6e78' : '#7a3a2c'); }
    boxB(B, w * .32, h * .32, w * .68, h * .68, hh, hh + 22, shade(base, 1.05), 'brick'); hip(B, w * .3, h * .3, w * .7, h * .7, hh + 22, 14, '#7a3a2c', 4); meta.flags.push({ x: w / 2, y: h / 2, z: hh + 52 }); meta.flags.push({ x: 14, y: h - 14, z: hh + 52 });
  } else if (T === 'saray') {
    boxB(B, 2, 2, w - 2, h - 2, 0, 5, '#9d917f', 'brick'); boxB(B, 10, 10, w - 10, h - 10, 5, 34, plast, 'plaster');
    for (let k = 0; k < 3; k++) { windowB(B, 'x', w - 10, 20 + k * 20, 16, 8, 12, '#4a3a28'); windowB(B, 'y', h - 10, 20 + k * 20, 16, 8, 12, '#4a3a28'); }
    door(B, 'y', [w / 2 - 8, h - 10], 16, 20, 5, '#3a2414'); boxB(B, 10, 10, w - 10, h - 10, 34, 38, '#b5452f', null, { topCol: '#c9573f' });
    dome(B, w / 2, h / 2, 38, 26, 30, '#3f8f8a', 'crescent'); dome(B, 26, h - 26, 38, 11, 11, '#4a9b95'); dome(B, w - 26, 26, 38, 11, 11, '#4a9b95');
    minaret(B, 14, h - 12, 88, '#f0e8d4', '#4f6670'); minaret(B, w - 12, 14, 88, '#f0e8d4', '#4f6670'); meta.flags.push({ x: w - 18, y: h - 18, z: 46 }); meta.flags.push({ x: 18, y: 18, z: 46 });
  } else if (T === 'kamp') {
    tent(B, w * .5, h * .5, 36, 46, col, '#f1e9d2', true); tent(B, w * .2, h * .78, 16, 22, shade(col, .8), '#e2d8b8'); tent(B, w * .82, h * .22, 16, 22, shade(col, .8), '#e2d8b8'); meta.flags.push({ x: w * .5, y: h * .5, z: 66 });
  } else if (T === 'ayasofya') {
    const ca = '#d8b08a', cw2 = '#e6c9a6'; boxB(B, 8, 8, w - 8, h - 8, 0, 36, ca, 'brick'); door(B, 'y', [w / 2 - 14, h - 8], 28, 26, 0, '#3a2414'); for (let k = 0; k < 4; k++) { windowB(B, 'x', w - 8, 22 + k * 28, 20, 9, 14, '#3a2c20'); windowB(B, 'y', h - 8, 22 + k * 28, 20, 9, 14, '#3a2c20'); }
    boxB(B, 8, 8, w - 8, h - 8, 36, 40, shade(ca, .9), null);
    dome(B, w * .5, h * .5, 40, 46, 42, '#8a8f93', flag === 'cap' ? 'crescent' : 'cross'); dome(B, w * .5 - 52, h * .5 + 52, 38, 22, 20, '#9a9ea0'); dome(B, w * .5 + 52, h * .5 - 52, 38, 22, 20, '#9a9ea0');
    if (flag === 'cap') { for (const [x, y] of [[10, 10], [w - 10, 10], [w - 10, h - 10], [10, h - 10]]) minaret(B, x, y, 98, '#f2ecdc', '#5d6e78'); meta.flags.push({ x: w / 2, y: h / 2, z: 100, big: true }); }
    else { for (const [x, y] of [[w - 10, h - 10], [10, h - 10]]) boxB(B, x - 7, y - 7, x + 7, y + 7, 0, 44, ca, 'brick'); }
  }
  s = { cv, meta }; BSPR.set(key, s); return s;
}
function flagDraw(c, x, y, col, t, big, sym) { // direk + dalgalanan bayrak (ekran koordinatı)
  const h = big ? 30 : 20, w = big ? 26 : 17; c.strokeStyle = '#5a3a1e'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h - 4); c.stroke();
  c.beginPath(); c.moveTo(x, y - h - 3); for (let i = 0; i <= 6; i++) { const f = i / 6; c.lineTo(x + f * w, y - h - 3 + Math.sin(t * 5 + f * 4) * 2.2 * f); } for (let i = 6; i >= 0; i--) { const f = i / 6; c.lineTo(x + f * w, y - h - 3 + (big ? 12 : 9) + Math.sin(t * 5 + f * 4) * 2.2 * f); } c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.stroke();
  if (sym === undefined) sym = '☪'; if (sym) { c.fillStyle = '#fff'; c.font = (big ? 12 : 9) + 'px serif'; c.fillText(sym, x + w * .22, y - h + (big ? 7 : 3.4)); }
}
function iconCanvas(kind, type, colIdx) { // buton portreleri
  const cv = mkCanvas(48, 48), c = cv.getContext('2d'); c.fillStyle = '#2a1c10'; c.fillRect(0, 0, 48, 48);
  if (kind === 'u') { const sp = unitSprite(UNITS[type].look, colIdx, 1, 'idle', 0), big = UNITS[type].cls === 'cav' || UNITS[type].cls === 'hero' || UNITS[type].cls === 'sie'; const s = big ? 76 : 56; c.drawImage(sp, 64 - s / 2, (big ? 92 : 90) - s, s, s, 0, 0, 48, 48); }
  else { const s = buildingSprite(type, colIdx), m = s.meta, sc = Math.min(44 / s.cv.width * 1.0, 46 / s.cv.height); c.drawImage(s.cv, 24 - s.cv.width * sc / 2, 46 - s.cv.height * sc, s.cv.width * sc, s.cv.height * sc); }
  return cv;
}

/* ======================  BLENDER SPRITE'LARI  ======================
   assets/sprites.js (window.SPRITES) + atlas PNG'leri. Atlaslar ilk kullanıldıklarında yüklenir.
   Takım rengi: (yarı çözünürlüklü) maske renge boyanıp 'multiply' ile karenin kendisine uygulanır;
   sonuç kare başına küçük bir tuvalde, boyutu sınırlı bir önbellekte (LRU) tutulur.            */
const LITE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || /[?&]lite/.test(location.search);
const BL = { ok: false, imgs: {}, cache: new Map(), cap: LITE ? 700 : 2500 };
const LS = () => (LITE && window.SPRITES && SPRITES.lite) || 1;                 // telefonda küçük atlaslar
const lsrc = src => LS() < 1 ? src.replace('.png', '_l.png') : src;
const lrect = f => { const s = LS(); return s === 1 ? f : [f[0] * s, f[1] * s, Math.max(1, Math.round(f[2] * s)), Math.max(1, Math.round(f[3] * s))]; };
function blImg(src) {
  let im = BL.imgs[src];
  if (!im) { im = new Image(); im.decoding = 'async'; im.src = 'assets/' + src; BL.imgs[src] = im; }
  return im.complete && im.naturalWidth ? im : null;
}
function loadBlender(cb) {           // yalnızca statik atlas ve portreler önceden yüklenir; birimler gerektikçe
  const S = window.SPRITES; if (!S) { cb(); return; }
  const list = [lsrc(S.statics.img), S.statics.mask]; if (S.portraits) list.push(S.portraits.img, S.portraits.mask);
  let n = list.length, fail = false;
  const done = () => { if (--n === 0) { BL.ok = !fail; cb(); } };
  for (const src of list) { const im = new Image(); im.onload = done; im.onerror = () => { fail = true; done(); }; im.src = 'assets/' + src; BL.imgs[src] = im; }
}
function blCached(key, img, mask, f, col, ms) {   // f: [x,y,w,h]; ms: maske ölçeği
  let c = BL.cache.get(key);
  if (c) { BL.cache.delete(key); BL.cache.set(key, c); return c; }
  const [x, y, w, h] = f; c = mkCanvas(w, h); const cx = c.getContext('2d');
  cx.drawImage(img, x, y, w, h, 0, 0, w, h);
  if (mask && col) {
    const t = blCached.tmp || (blCached.tmp = mkCanvas(256, 256)); if (t.width < w || t.height < h) { t.width = Math.max(t.width, w); t.height = Math.max(t.height, h); }
    const tc = t.getContext('2d'); tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, w, h);
    tc.drawImage(mask, x * ms, y * ms, w * ms, h * ms, 0, 0, w, h); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = col; tc.fillRect(0, 0, w, h);
    cx.globalCompositeOperation = 'multiply'; cx.drawImage(t, 0, 0, w, h, 0, 0, w, h);
    cx.globalCompositeOperation = 'destination-in'; cx.drawImage(img, x, y, w, h, 0, 0, w, h);
    cx.globalCompositeOperation = 'source-over';
  }
  BL.cache.set(key, c);
  if (BL.cache.size > BL.cap) BL.cache.delete(BL.cache.keys().next().value);
  return c;
}
function blFrame(look, dir, act, fr) { const U = SPRITES.units[look]; if (!U) return null; return U.f[dir + '_' + act + '_' + fr] || U.f[dir + '_idle_0']; }
function blUnit(c, look, owner, dir, act, fr, sx, sy, z, alpha) {
  const U = SPRITES.units[look]; if (!U) return false;
  const img = blImg(lsrc(U.img)), mask = blImg(U.mask); if (!img || !mask) return false;
  let k = dir + '_' + act + '_' + fr, f = U.f[k]; if (!f) { k = dir + '_idle_0'; f = U.f[k]; } if (!f) return false;
  const cv = blCached(look + G.colors[owner] + k, img, mask, lrect(f), G.colors[owner], mask.width / img.width);
  if (alpha != null) c.globalAlpha = alpha;
  c.drawImage(cv, sx - f[4] * z, sy - f[5] * z, f[2] * z, f[3] * z);
  c.globalAlpha = 1; return true;
}
function blHas(name) { return BL.ok && !!SPRITES.statics.f[name]; }
function blStatic(c, name, owner, sx, sy, z, alpha, reveal, light) {
  const S = SPRITES.statics, f = S.f[name]; if (!f) return false;
  const img = BL.imgs[lsrc(S.img)], mask = BL.imgs[S.mask];
  const cv = blCached('S' + name + (owner == null ? '' : G.colors[owner]), img, owner == null ? null : mask, lrect(f), owner == null ? null : G.colors[owner], mask.width / img.width);
  const k = z / S.scale, w = f[2], h = f[3], ax = f[4], ay = f[5];
  let sy0 = 0, hh = h; if (reveal != null && reveal < 1) { sy0 = h * (1 - reveal); hh = h - sy0; }
  if (alpha != null) c.globalAlpha = alpha;
  const q = cv.width / w;
  c.drawImage(cv, 0, sy0 * q, cv.width, hh * q, sx - ax * k, sy - ay * k + sy0 * k, w * k, hh * k);
  if (light) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = light; c.drawImage(cv, 0, sy0 * q, cv.width, hh * q, sx - ax * k, sy - ay * k + sy0 * k, w * k, hh * k); c.globalCompositeOperation = 'source-over'; }
  c.globalAlpha = 1; return true;
}
function blPortrait(look, owner) {
  const art = typeof artPortrait === 'function' && artPortrait(look);
  if (art) { // boyalı portre + takım rengi çerçeve
    const cv = mkCanvas(96, 96), c = cv.getContext('2d'); c.drawImage(art, 0, 0, 96, 96);
    c.strokeStyle = G.colors[owner]; c.lineWidth = 5; c.strokeRect(2.5, 2.5, 91, 91); return cv;
  }
  const P = SPRITES.portraits, f = P && P.f[look]; if (!f) return null;
  const img = BL.imgs[P.img], mask = BL.imgs[P.mask]; if (!img || !mask || !img.naturalWidth) return null;
  const pc = blCached('P' + look + G.colors[owner], img, mask, f, G.colors[owner], mask.width / img.width);
  const cv = mkCanvas(96, 96), c = cv.getContext('2d'), gr = c.createRadialGradient(48, 38, 6, 48, 48, 70);
  gr.addColorStop(0, '#6a4a2a'); gr.addColorStop(1, '#140b05'); c.fillStyle = gr; c.fillRect(0, 0, 96, 96);
  c.drawImage(pc, 0, 0, 96, 96); return cv;
}
function blIcon(kind, type, owner) {
  if (kind === 'u') { const p = blPortrait(UNITS[type].look, owner); if (p) return p; }
  const cv = mkCanvas(48, 48), c = cv.getContext('2d'); c.fillStyle = '#2a1c10'; c.fillRect(0, 0, 48, 48);
  if (kind === 'u') { const look = UNITS[type].look, big = UNITS[type].cls === 'cav' || UNITS[type].cls === 'hero' || UNITS[type].cls === 'sie'; if (!blUnit(c, look, owner, 1, 'idle', 0, 24, big ? 50 : 54, big ? .8 : 1.05)) return null; }
  else { const nm = type === 'ayasofya' && G.flags.captured ? 'ayasofya_cap' : type, f = SPRITES.statics.f[nm]; if (!f) return null; const [, , w, h, ax, ay] = f; const k = Math.min(44 / w, 44 / h) * SPRITES.statics.scale; blStatic(c, nm, owner, 24 - (w / 2 - ax) * k / SPRITES.statics.scale, 46 - (h - ay) * k / SPRITES.statics.scale, k); }
  return cv;
}
