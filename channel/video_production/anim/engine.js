// ===== Engine: easing, helpers, drawing primitives =====
const W = 1920, H = 1080;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const NAVY = '#0B1B3A', ORANGE = '#FF6B1A', CREAM = '#F5F1E8', RED = '#E5322D', STEEL = '#6F86B3';

const E = {
  lin: t => t,
  outC: t => 1 - Math.pow(1 - t, 3),
  outQ: t => 1 - Math.pow(1 - t, 5),
  inC: t => t * t * t,
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outB: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outE: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
};
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
function rngf(seed) {
  let s = seed >>> 0;
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ----- timing data -----
const S = DATA.sentences;
const T0 = i => S[i].t0;
const CW = (i, w) => { const f = S[i].words.find(x => x[0] === w); return f ? f[1] : S[i].t0; };

// ----- assets -----
const IMG = {};
function loadImg(name, src) { return new Promise(res => { const im = new Image(); im.onload = () => { IMG[name] = im; res(); }; im.onerror = () => res(); im.src = src; }); }

// ----- text -----
function txt(s, x, y, o = {}) {
  const { size = 64, color = '#fff', align = 'left', font = 'Bebas Neue', weight = '400', sp = 0, alpha = 1, glow = 0, glowColor = null, rot = 0, scale = 1, base = 'alphabetic', style = '' } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${style} ${weight} ${size}px "${font}"`;
  ctx.textAlign = align; ctx.textBaseline = base;
  ctx.letterSpacing = sp + 'px';
  ctx.translate(x, y); if (rot) ctx.rotate(rot); if (scale !== 1) ctx.scale(scale, scale);
  if (glow) { ctx.shadowColor = glowColor || color; ctx.shadowBlur = glow; }
  ctx.fillStyle = color; ctx.fillText(s, 0, 0);
  ctx.restore();
}
function typed(s, p) { return s.slice(0, Math.floor(s.length * cl(p))); }
function measure(s, size, sp = 0, font = 'Bebas Neue') { ctx.save(); ctx.font = `${size}px "${font}"`; ctx.letterSpacing = sp + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ----- shapes -----
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function glowStroke(drawPath, color, width, glow = 18) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = glow; drawPath(); ctx.stroke(); ctx.restore();
}
function person(x, y, s, col, a = 1) { // silhouette, (x,y)=feet position center
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y - s * 1.46, s * .26, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s * .5, y); ctx.quadraticCurveTo(x - s * .55, y - s * 1.2, x - s * .2, y - s * 1.25);
  ctx.lineTo(x + s * .2, y - s * 1.25); ctx.quadraticCurveTo(x + s * .55, y - s * 1.2, x + s * .5, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function storeIcon(x, y, s, col = CREAM, sign = 'VIDEO', a = 1, signCol = ORANGE) { // x,y top-left, s scale (width=s)
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * .02); ctx.fillStyle = 'rgba(255,255,255,.12)';
  rr(0, s * .22, s, s * .62, 4); ctx.fill(); ctx.stroke();
  // awning
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? col : signCol; ctx.beginPath(); ctx.moveTo(i * s / 8, s * .12); ctx.lineTo((i + 1) * s / 8, s * .12); ctx.lineTo((i + 1) * s / 8, s * .25); ctx.lineTo(i * s / 8, s * .25); ctx.fill(); }
  ctx.fillStyle = signCol; rr(s * .2, 0, s * .6, s * .12, 4); ctx.fill();
  txt(sign, s * .5, s * .097, { size: s * .1, color: NAVY, align: 'center', sp: 2 });
  ctx.fillStyle = 'rgba(255,200,120,.35)'; rr(s * .1, s * .36, s * .5, s * .36, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(s * .68, s * .36, s * .2, s * .48, 3); ctx.fill();
  ctx.restore();
}
function envelope(x, y, w, rot = 0, a = 1, col = '#E0412F') {
  const h = w * .66; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(255,90,40,.6)'; ctx.shadowBlur = 20;
  ctx.fillStyle = col; rr(-w / 2, -h / 2, w, h, 5); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, h * .08); ctx.lineTo(w / 2, -h / 2); ctx.stroke();
  ctx.restore();
}
function coin(x, y, r, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#FFE08A'); g.addColorStop(1, '#D98E1F');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(255,170,40,.6)'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#9a5d10'; ctx.lineWidth = r * .08; ctx.beginPath(); ctx.arc(x, y, r * .78, 0, 7); ctx.stroke();
  txt('$', x, y + r * .33, { size: r * 1.05, color: '#7A4A0A', align: 'center', font: 'Liberation Sans', weight: '700' });
  ctx.restore();
}
function disc(x, y, r, ang = 0, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
  const g = ctx.createConicGradient(0, 0, 0);
  g.addColorStop(0, '#cfd8ee'); g.addColorStop(.2, '#7d8fb8'); g.addColorStop(.4, '#e9eef9'); g.addColorStop(.6, '#7488b5'); g.addColorStop(.8, '#dfe6f6'); g.addColorStop(1, '#cfd8ee');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(120,160,255,.5)'; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(0, 0, r * .18, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, 7); ctx.stroke();
  ctx.restore();
}
function playIcon(x, y, r, col = '#fff', a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 30;
  rr(x - r * 1.4, y - r, r * 2.8, r * 2, r * .5); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(x - r * .4, y - r * .55); ctx.lineTo(x + r * .6, y); ctx.lineTo(x - r * .4, y + r * .55); ctx.closePath(); ctx.fill(); ctx.restore();
}
function star(x, y, r, a = 1, col = ORANGE) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 30; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rad = i % 2 ? r * .45 : r, an = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(x + Math.cos(an) * rad, y + Math.sin(an) * rad); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function cross(x, y, s, col = RED, p = 1, w = 12) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 20;
  const p1 = cl(p * 2), p2 = cl(p * 2 - 1);
  ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(lerp(x - s, x + s, p1), lerp(y - s, y + s, p1)); ctx.stroke();
  if (p2 > 0) { ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(lerp(x + s, x - s, p2), lerp(y - s, y + s, p2)); ctx.stroke(); }
  ctx.restore();
}
function clockFace(x, y, r, tt, col = CREAM) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.shadowColor = col; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 4;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * .84, -Math.cos(a) * r * .84); ctx.lineTo(Math.sin(a) * r * .94, -Math.cos(a) * r * .94); ctx.stroke(); }
  ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = ORANGE; const am = tt * 2 * Math.PI, ah = am / 12;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(am) * r * .8, -Math.cos(am) * r * .8); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ah) * r * .5, -Math.cos(ah) * r * .5); ctx.stroke();
  ctx.restore();
}
// stamp with slam + shake. p: seconds since slam (>=0). returns shake offset
function stamp(label, x, y, p, col = RED, size = 190, rot = -0.12) {
  if (p < 0) return;
  const k = E.outB(cl(p / 0.28)); const sc = lerp(2.4, 1, cl(p / 0.18));
  const a = cl(p / 0.08);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha *= a;
  ctx.font = `400 ${size}px "Bebas Neue"`; ctx.letterSpacing = '6px';
  const w = ctx.measureText(label).width, h = size * .86, pad = 36;
  ctx.shadowColor = col; ctx.shadowBlur = 26; ctx.strokeStyle = col; ctx.lineWidth = 14;
  rr(-w / 2 - pad, -h / 2 - pad * .55, w + pad * 2, h + pad * 1.1, 14); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, size * .04);
  ctx.restore();
}
function shakeAt(p, amp = 14) { if (p < 0 || p > 0.5) return [0, 0]; const d = Math.pow(1 - p / 0.5, 2) * amp; return [Math.sin(p * 90) * d, Math.cos(p * 70) * d * .6]; }
function flash(p, col = '255,60,40') { if (p < 0 || p > 0.35) return; ctx.save(); ctx.fillStyle = `rgba(${col},${.32 * (1 - p / 0.35)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// framed picture with slow push-in
function framed(img, x, y, w, h, p, t, o = {}) {
  if (!img) return; const { frame = ORANGE, push = .08, a = 1, rot = 0 } = o;
  ctx.save(); ctx.globalAlpha *= a * E.outC(p);
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 40; ctx.fillStyle = '#000'; rr(-8, -8, w + 16, h + 16, 8); ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); rr(0, 0, w, h, 4); ctx.clip();
  const sc = Math.max(w / img.width, h / img.height) * (1 + push * cl(t));
  const iw = img.width * sc, ih = img.height * sc; ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(11,27,58,0)'); g.addColorStop(1, 'rgba(11,27,58,.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.strokeStyle = frame; ctx.lineWidth = 5; rr(-8, -8, w + 16, h + 16, 8); ctx.stroke();
  ctx.restore();
}

// ===== Map of the continental US (stylised) =====
const US = [[-124.7,48.4],[-123,48.3],[-122.8,49],[-95.2,49],[-94.6,48.7],[-93,48.6],[-89.6,48],[-84.8,46.9],[-84.5,46.4],[-83.6,46.1],[-82.5,45.3],[-82.4,43],[-83,42],[-82.5,41.7],[-79,42.8],[-79,43.3],[-76.5,43.6],[-75,45],[-71.5,45],[-70.8,45.4],[-70,46.7],[-69.2,47.4],[-67.8,47],[-67.8,45.7],[-67,44.8],[-70.2,43.6],[-70.7,42.7],[-70.5,41.8],[-73.9,40.6],[-74,39.7],[-75.5,38.5],[-75.9,37],[-76,36.9],[-75.6,35.3],[-77,34.6],[-78.8,33.8],[-80.9,32],[-81.4,30.7],[-80.5,28.5],[-80.1,26.8],[-80.4,25.2],[-81.2,25.2],[-82,26.5],[-82.8,28],[-83.7,29.9],[-85.4,29.7],[-87.5,30.3],[-89.5,30.2],[-89.4,29],[-91,29.2],[-93.8,29.7],[-94.7,29.3],[-97.2,27.8],[-97.4,26],[-99,26.4],[-100.3,28.2],[-101.4,29.8],[-103,29],[-104.5,29.7],[-106.5,31.8],[-108.2,31.8],[-108.2,31.3],[-111,31.3],[-114.8,32.5],[-117.1,32.5],[-118.5,34],[-120.6,34.5],[-121.9,36.6],[-122.5,37.8],[-123.7,39.3],[-124.4,40.4],[-124.2,43],[-124.1,46.2]];
const MAP = { x: 410, y: 270, w: 1100, h: 610 };
const KX = Math.cos(38 * Math.PI / 180);
const LON0 = -125.2, LON1 = -66.5, LAT0 = 49.6, LAT1 = 24.2;
function mp(lon, lat) { return [MAP.x + (lon - LON0) / (LON1 - LON0) * MAP.w, MAP.y + (LAT0 - lat) / (LAT0 - LAT1) * MAP.h]; }
const CITY = { dallas: [-96.8, 32.8], bend: [-121.3, 44.06], losgatos: [-121.98, 37.23], ny: [-74, 40.7], chi: [-87.6, 41.9], mia: [-80.2, 25.8], sea: [-122.3, 47.6], den: [-105, 39.7], atl: [-84.4, 33.7], bos: [-71, 42.4], la: [-118.2, 34], hou: [-95.4, 29.8], phx: [-112, 33.4], min: [-93.3, 45], stl: [-90.2, 38.6] };
let MAPDOTS = null;
function usPath(dx = 0, dy = 0, sc = 1) { const p = new Path2D(); US.forEach(([lo, la], i) => { const [x, y] = mp(lo, la); i ? p.lineTo(dx + x, dy + y) : p.moveTo(dx + x, dy + y); }); p.closePath(); return p; }
function buildMapDots() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);   // identity: dots must match the outline exactly
  const path = usPath(); const dots = []; const r = rngf(7);
  for (let y = MAP.y; y < MAP.y + MAP.h; y += 15) for (let x = MAP.x; x < MAP.x + MAP.w; x += 15) {
    const px = x + ((y - MAP.y) / 15 % 2 ? 7 : 0);
    if (ctx.isPointInPath(path, px, y)) dots.push([px, y, r()]);
  }
  ctx.restore(); MAPDOTS = dots;
}
// optional real photo of a person (licensed, supplied by the user); returns true if drawn
function portrait(key, x, y, w, h, p, t = 0, credit = true) {
  const im = IMG[key]; if (!im) return false;
  framed(im, x, y, w, h, p, t, { push: .04 });
  const cr = (window.PEOPLE_CREDITS || {})[key]; if (cr && credit) txt(cr, x + w / 2, y + h + 38, { size: 20, color: STEEL, align: 'center', sp: 1, font: 'Liberation Sans', alpha: p });
  return true;
}
function drawMap(alpha = 1, t = 0, tint = 'rgba(111,134,179,') {
  if (!MAPDOTS) buildMapDots();
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = tint + '.07)'; ctx.fill(usPath());
  for (const [x, y, rv] of MAPDOTS) { const tw = .35 + .25 * Math.sin(t * 1.6 + rv * 20); ctx.fillStyle = tint + tw + ')'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
  glowStroke(() => ctx.stroke(usPath()), 'rgba(255,107,26,.55)', 2.5, 12);
  ctx.restore();
}
function pin(x, y, p, label, col = ORANGE, size = 54) {
  if (p <= 0) return; const k = E.outB(cl(p)); const bounce = (1 - k) * -90;
  ctx.save(); ctx.translate(x, y + bounce);
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 28;
  ctx.beginPath(); ctx.arc(0, -38, 20, Math.PI, 0); ctx.quadraticCurveTo(20, -14, 0, 0); ctx.quadraticCurveTo(-20, -14, -20, -38); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(0, -38, 8, 0, 7); ctx.fill(); ctx.restore();
  // pulse rings
  for (let i = 0; i < 3; i++) { const q = ((p * 1.2 + i / 3) % 1); ctx.save(); ctx.globalAlpha *= (1 - q) * .8 * k; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 10 + q * 70, 4 + q * 28, 0, 0, 7); ctx.stroke(); ctx.restore(); }
  if (label) txt(label, x, y + 52, { size, color: CREAM, align: 'center', sp: 2, alpha: cl((p - .2) * 3) });
}

// ===== Chapter tag =====
function tag(label, t, a) {
  const p = E.outC(seg(t, a + .1, a + .7)); if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= p; ctx.fillStyle = ORANGE; ctx.fillRect(96, 78, 8 + 6 * p, 44);
  txt(label, 126 - 30 * (1 - p), 112, { size: 38, color: CREAM, sp: 5 });
  ctx.restore();
}

// ===== Global look: bg, particles, vignette, grain =====
let bgC, vigC, grainC = [], spr;
function initLook() {
  bgC = document.createElement('canvas'); bgC.width = W; bgC.height = H; const b = bgC.getContext('2d');
  const g = b.createRadialGradient(W * .5, H * .45, 80, W * .5, H * .5, W * .75); g.addColorStop(0, '#142C5B'); g.addColorStop(.55, '#0B1B3A'); g.addColorStop(1, '#040A18');
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  b.strokeStyle = 'rgba(111,134,179,.05)'; b.lineWidth = 1; for (let x = 0; x < W; x += 80) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, H); b.stroke(); } for (let y = 0; y < H; y += 80) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
  vigC = document.createElement('canvas'); vigC.width = W; vigC.height = H; const v = vigC.getContext('2d');
  const vg = v.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.62)'); v.fillStyle = vg; v.fillRect(0, 0, W, H);
  const r = rngf(99);
  for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const x = c.getContext('2d'); const id = x.createImageData(480, 270); for (let i = 0; i < id.data.length; i += 4) { const n = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); grainC.push(c); }
  spr = document.createElement('canvas'); spr.width = spr.height = 64; const s = spr.getContext('2d'); const sg = s.createRadialGradient(32, 32, 0, 32, 32, 32); sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); s.fillStyle = sg; s.fillRect(0, 0, 64, 64);
}
const PART = (() => { const r = rngf(3); return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: 8 + r() * 26, s: 6 + r() * 26, a: .05 + r() * .18, o: r() < .35 })); })();
function drawBG(t) {
  ctx.drawImage(bgC, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of PART) { const y = ((p.y - t * p.v) % H + H) % H, x = p.x + Math.sin(t * .3 + p.y) * 18; ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(t + p.x)); ctx.drawImage(spr, x - p.s, y - p.s, p.s * 2, p.s * 2); }
  ctx.restore();
  // slow light sweep
  ctx.save(); const sx = ((t * 70) % (W + 900)) - 450; const lg = ctx.createLinearGradient(sx - 200, 0, sx + 200, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,200,150,.035)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function drawOverlay(t, frame) {
  ctx.drawImage(vigC, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .11;
  const g = grainC[frame % 4]; const ox = (frame * 37) % 40, oy = (frame * 53) % 30; ctx.drawImage(g, -ox, -oy, W + 80, H + 60); ctx.restore();
  // progress line + bug
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, H - 6, W, 6); ctx.fillStyle = ORANGE; ctx.fillRect(0, H - 6, W * t / DATA.T, 6);
  if (IMG.logo && t > 22) { ctx.save(); ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(W - 90, 90, 44, 0, 7); ctx.clip(); ctx.drawImage(IMG.logo, W - 126, 54, 72, 72); ctx.restore(); }
}
