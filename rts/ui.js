'use strict';
/* ====== FATİH — İzometrik çizim, girdi ve arayüz ====== */
const cv = $('c'), ctx = cv.getContext('2d');
const mini = $('mini'), mctx = mini.getContext('2d');
let cam = { x: 0, y: 0, z: 1 }, mouse = { x: 0, y: 0, in: false, down: false, sx: 0, sy: 0, drag: false };
let place = null, amovePending = false, keys = {}, lastClick = { t: 0, id: 0 };
let terrainCv = null, fogSmall = null, fogBig = null, isoFog = null, chunks = new Map(), mmTile = null, cardSig = '', cardT = 0, running = false, lastT = 0, acc = 0;
const UZ = .74;              // birim çizim ölçeği (binalara oranlı)
let BAR_H = 184; const MF = 4 / 32;

function resize() { cv.width = innerWidth; cv.height = innerHeight; ctx.imageSmoothingEnabled = true; const b = $('bar'); if (b && b.offsetHeight) BAR_H = b.offsetHeight; }
addEventListener('resize', resize); resize();
const viewW = () => cv.width / cam.z, viewH = () => (cv.height - BAR_H) / cam.z;
const w2s = (x, y, z) => [((x - y) - cam.x) * cam.z, ((x + y) / 2 - (z || 0) - cam.y) * cam.z];
const s2w = (sx, sy) => { const ix = sx / cam.z + cam.x, iy = sy / cam.z + cam.y; return { x: iy + ix / 2, y: iy - ix / 2 }; };
function clampCam() {
  const minX = -G.H * TILE - 60, maxX = G.W * TILE + 60, maxY = (G.W + G.H) * TILE / 2 + 60;
  cam.x = clamp(cam.x, minX, Math.max(minX, maxX - viewW())); cam.y = clamp(cam.y, -120, Math.max(-120, maxY - viewH()));
}
function centerOn(x, y) { cam.x = (x - y) - viewW() / 2; cam.y = (x + y) / 2 - viewH() / 2; clampCam(); }

/* ---------- görev başında hazırlık ---------- */
function buildTerrain() {
  SPR.clear(); BSPR.clear(); ICONS.clear(); BL.cache.clear();
  terrainCv = bakeTerrain();
  fogSmall = mkCanvas(G.W, G.H); fogBig = mkCanvas(G.W * 4, G.H * 4); isoFog = mkCanvas((G.W + G.H) * 4, (G.W + G.H) * 2); chunks = new Map();
  mmTile = mkCanvas(G.W, G.H);
  mini.width = (G.W + G.H) * 4; mini.height = (G.W + G.H) * 2; mini.style.width = '176px'; mini.style.height = '88px';
  G.fogDirty = true;
}
function updateFog() {
  if (G.m.noFog) return; const W = G.W, H = G.H, fc = fogSmall.getContext('2d'), id = fc.createImageData(W, H), d = id.data;
  for (let i = 0; i < W * H; i++) { d[i * 4] = 8; d[i * 4 + 1] = 6; d[i * 4 + 2] = 4; d[i * 4 + 3] = G.vis[i] ? 0 : G.exp[i] ? 125 : 255; }
  fc.putImageData(id, 0, 0); const bc = fogBig.getContext('2d'); bc.clearRect(0, 0, fogBig.width, fogBig.height); if (!LITE) bc.filter = 'blur(3px)'; bc.imageSmoothingEnabled = true; bc.drawImage(fogSmall, 0, 0, fogBig.width, fogBig.height); bc.filter = 'none';
  const ic = isoFog.getContext('2d'); ic.setTransform(1, 0, 0, 1, 0, 0); ic.clearRect(0, 0, isoFog.width, isoFog.height); ic.fillStyle = '#080604'; ic.fillRect(0, 0, isoFog.width, isoFog.height); ic.globalCompositeOperation = 'destination-out';
  // önce harita elmasını tamamen aç, sonra sis dokusunu tekrar çiz
  ic.setTransform(1 / 8, 1 / 16, -1 / 8, 1 / 16, G.H * TILE / 8, 0); ic.fillRect(0, 0, G.W * TILE, G.H * TILE); ic.globalCompositeOperation = 'source-over'; ic.imageSmoothingEnabled = true; ic.drawImage(fogBig, 0, 0, G.W * TILE, G.H * TILE); ic.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- çizim ---------- */
function visBounds() {
  const pts = [s2w(0, 0), s2w(cv.width, 0), s2w(0, cv.height), s2w(cv.width, cv.height)];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { x0: Math.max(0, Math.min(...xs) - 64), x1: Math.min(G.W * TILE, Math.max(...xs) + 96), y0: Math.max(0, Math.min(...ys) - 64), y1: Math.min(G.H * TILE, Math.max(...ys) + 96) };
}
const CH = 512;
function chunk(i, j) {
  const k = i + ',' + j; let ch = chunks.get(k); if (ch) { chunks.delete(k); chunks.set(k, ch); return ch; }
  ch = mkCanvas(CH, CH); const c = ch.getContext('2d'), ox = -G.H * TILE + i * CH, oy = j * CH;
  c.setTransform(1, .5, -1, .5, -ox, -oy); c.imageSmoothingEnabled = true; c.drawImage(terrainCv, 0, 0, G.W * TILE, G.H * TILE); chunks.set(k, ch);
  if (chunks.size > (LITE ? 24 : 90)) chunks.delete(chunks.keys().next().value);
  return ch;
}
function drawTerrain(c) {
  const z = cam.z, minX = -G.H * TILE, maxX = G.W * TILE, maxY = (G.W + G.H) * TILE / 2;
  const i0 = Math.max(0, Math.floor((cam.x - minX) / CH)), i1 = Math.floor((Math.min(maxX, cam.x + cv.width / z) - minX) / CH), j0 = Math.max(0, Math.floor(cam.y / CH)), j1 = Math.floor(Math.min(maxY, cam.y + cv.height / z) / CH);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = Math.floor((minX + i * CH - cam.x) * z), dy = Math.floor((j * CH - cam.y) * z), s = Math.ceil(CH * z) + 1; c.drawImage(chunk(i, j), dx, dy, s, s); }
}
function drawFog(c) {
  if (G.m.noFog || !isoFog) return; const z = cam.z; c.imageSmoothingEnabled = true;
  c.drawImage(isoFog, (-G.H * TILE - cam.x) * z, (-cam.y) * z, isoFog.width * 8 * z, isoFog.height * 8 * z);
}
function unitAct(u) {
  if (u.atkT > 0 && u.atkD) return ['atk', Math.min(5, Math.floor((1 - u.atkT / u.atkD) * 6))];
  if (u.workT > G.t) return u.d.worker ? ['atk', Math.floor(G.t * 7 + u.id) % 6] : ['idle', 0];
  if (u.moving) return ['walk', Math.floor(u.ph || 0) % 8];
  return ['idle', 0];
}
function drawSpr(c, spr, sx, sy, ax, ay, alpha) { const z = cam.z; if (alpha != null) c.globalAlpha = alpha; c.drawImage(spr, sx - ax * z, sy - ay * z, spr.width * z, spr.height * z); c.globalAlpha = 1; }
function drawUnit(c, u) {
  const [sx, sy] = w2s(u.x, u.y), [act, fr] = unitAct(u);
  if (u.d.hero && u.owner === 0) { c.strokeStyle = 'rgba(231,185,58,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy, 17 * cam.z, 8.5 * cam.z, 0, 0, 7); c.stroke(); }
  if (u.owner !== 0 && ally(u.owner)) { c.fillStyle = 'rgba(255,215,90,.25)'; c.beginPath(); c.ellipse(sx, sy, 9 * cam.z, 4.5 * cam.z, 0, 0, 7); c.fill(); }
  if (BL.ok && blUnit(c, u.d.look, u.owner, facingDir(u.face || 0), act, fr, sx, sy, cam.z * UZ)) { if (u.hit > 0) { c.globalCompositeOperation = 'lighter'; blUnit(c, u.d.look, u.owner, facingDir(u.face || 0), act, fr, sx, sy, cam.z * UZ, .3); c.globalCompositeOperation = 'source-over'; } }
  else { const spr = unitSprite(u.d.look, u.owner, facingDir(u.face || 0), act, fr);
  drawSpr(c, spr, sx, sy, 64, 86); if (u.hit > 0) { c.globalCompositeOperation = 'lighter'; drawSpr(c, spr, sx, sy, 64, 86, .35); c.globalCompositeOperation = 'source-over'; } }
  if (u.carry && u.carry.amt > 0 && u.d.worker) { c.fillStyle = ['', '#8a5a2a', '#f2c230', '#c0405a'][u.carry.type]; c.beginPath(); c.arc(sx - 7 * cam.z, sy - 18 * cam.z, 3.4 * cam.z, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); }
}
const unitTop = u => UZ * (u.d.cls === 'ship' ? (u.d.look === 'balikci' ? 46 : u.d.look === 'bastarda' ? 110 : 95) : u.d.cls === 'cav' || u.d.cls === 'hero' ? 62 : u.d.look === 'sahi' ? 52 : u.d.cls === 'sie' ? 38 : 50);
function bScreen(b) { const s = buildingSprite(b.type, b.owner, b.type === 'ayasofya' && G.flags.captured ? 'cap' : ''); const [ox, oy] = w2s(b.tx * TILE, b.ty * TILE); return { s, ox, oy, dx: ox - s.meta.ox * cam.z, dy: oy - s.meta.oy * cam.z }; }
const bName = b => b.type === 'ayasofya' && G.flags.captured ? 'ayasofya_cap' : b.type;
function drawBuildingBL(c, b) {
  const z = cam.z, [sx, sy] = w2s(b.x, b.y), nm = bName(b);
  if (!b.built) {
    const P = [[0, 0], [b.w, 0], [b.w, b.h], [0, b.h]].map(([x, y]) => w2s((b.tx + x) * TILE, (b.ty + y) * TILE));
    c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = 'rgba(120,90,50,.55)'; c.fill(); c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 1.5; c.stroke();
    blStatic(c, nm, b.owner, sx, sy, z, .95, .1 + b.prog * .9);
    c.strokeStyle = '#7a5530'; c.lineWidth = 2 * z; const top = (BH[b.type] || 30) * Math.min(1, b.prog + .25);
    for (const [x, y] of [[0, 0], [b.w, 0], [b.w, b.h], [0, b.h]]) { const a = w2s((b.tx + x) * TILE, (b.ty + y) * TILE), t = w2s((b.tx + x) * TILE, (b.ty + y) * TILE, top); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(t[0], t[1]); c.stroke(); }
    for (let k = 1; k <= 3; k++) { const zz = top * k / 3.2; const a = w2s((b.tx) * TILE, (b.ty + b.h) * TILE, zz), bb = w2s((b.tx + b.w) * TILE, (b.ty + b.h) * TILE, zz), cc = w2s((b.tx + b.w) * TILE, b.ty * TILE, zz); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(bb[0], bb[1]); c.lineTo(cc[0], cc[1]); c.stroke(); }
    return;
  }
  blStatic(c, nm, b.owner, sx, sy, z, null, null, b.hit > 0 ? .25 : 0);
  if (b.type === 'dokum') { const [bx, by] = w2s(b.x - 24, b.y - 24, 100); for (let i = 0; i < 6; i++) { const ph = (G.t * .3 + i / 6) % 1; c.fillStyle = `rgba(80,76,72,${.5 * (1 - ph)})`; c.beginPath(); c.arc(bx + Math.sin(ph * 6 + i) * 6 * z + ph * 20 * z, by - ph * 70 * z, (6 + ph * 16) * z, 0, 7); c.fill(); } }
  drawFire(c, b);
}
function drawFire(c, b) {
  const z = cam.z, hpf = b.hp / b.maxhp;
  if (hpf < .6 && !b.d.landmark) { const n = hpf < .3 ? 5 : 2, hb = BH[b.type] || 30; for (let i = 0; i < n; i++) { const rx = hash2(b.id, i, 1), ry = hash2(b.id, i, 2), wx = (b.tx + .2 + rx * (b.w - .4)) * TILE, wy = (b.ty + .2 + ry * (b.h - .4)) * TILE, [fx, fy] = w2s(wx, wy, hb * (.4 + hash2(b.id, i, 3) * .4)); const fl = Math.sin(G.t * 13 + i * 3) * .2 + 1; const g = c.createRadialGradient(fx, fy, 1, fx, fy - 6 * z, 12 * z * fl); g.addColorStop(0, 'rgba(255,240,150,.95)'); g.addColorStop(.4, 'rgba(255,130,30,.8)'); g.addColorStop(1, 'rgba(200,40,0,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(fx, fy - 6 * z, 7 * z * fl, 13 * z * fl, 0, 0, 7); c.fill(); for (let k = 0; k < 3; k++) { const ph = (G.t * .5 + k / 3 + rx) % 1; c.fillStyle = `rgba(40,35,30,${.5 * (1 - ph)})`; c.beginPath(); c.arc(fx + ph * 10 * z, fy - (14 + ph * 46) * z, (5 + ph * 10) * z, 0, 7); c.fill(); } } }
}
function drawBuilding(c, b) {
  if (blHas(bName(b))) return drawBuildingBL(c, b);
  const { s, ox, oy, dx, dy } = bScreen(b), z = cam.z, m = s.meta, W = s.cv.width, H = s.cv.height;
  if (!b.built) {
    // temel ve iskele
    const P = [[0, 0], [b.w, 0], [b.w, b.h], [0, b.h]].map(([x, y]) => w2s((b.tx + x) * TILE, (b.ty + y) * TILE));
    c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = 'rgba(120,90,50,.55)'; c.fill(); c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 1.5; c.stroke();
    const p = .12 + b.prog * .88, cut = H * (1 - p) * .9 + 0; c.globalAlpha = .9; c.drawImage(s.cv, 0, cut, W, H - cut, dx, dy + cut * z, W * z, (H - cut) * z); c.globalAlpha = 1;
    c.strokeStyle = '#7a5530'; c.lineWidth = 2 * z; const top = (BH[b.type] || 30) * Math.min(1, b.prog + .2);
    for (const [x, y] of [[0, 0], [b.w, 0], [b.w, b.h], [0, b.h]]) { const a = w2s((b.tx + x) * TILE, (b.ty + y) * TILE), t = w2s((b.tx + x) * TILE, (b.ty + y) * TILE, top); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(t[0], t[1]); c.stroke(); }
    for (let k = 1; k <= 3; k++) { const zz = top * k / 3.2; const a = w2s((b.tx) * TILE, (b.ty + b.h) * TILE, zz), bb = w2s((b.tx + b.w) * TILE, (b.ty + b.h) * TILE, zz), cc = w2s((b.tx + b.w) * TILE, b.ty * TILE, zz); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(bb[0], bb[1]); c.lineTo(cc[0], cc[1]); c.stroke(); }
    return;
  }
  c.drawImage(s.cv, dx, dy, W * z, H * z);
  if (b.hit > 0) { c.globalAlpha = .18; c.globalCompositeOperation = 'lighter'; c.drawImage(s.cv, dx, dy, W * z, H * z); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  // bayraklar, duman, yangın
  for (const f of m.flags) { const [fx, fy] = [dx + (m.ox + f.x - f.y) * z, dy + (m.oy + (f.x + f.y) / 2 - f.z) * z]; c.save(); c.translate(fx, fy); c.scale(z, z); flagDraw(c, 0, 0, G.colors[b.owner], G.t + b.id, f.big, b.owner === 0 ? '☪' : (G.m.sym || '')); c.restore(); }
  for (const sm of m.smoke) { const bx = dx + (m.ox + sm.x - sm.y) * z, by = dy + (m.oy + (sm.x + sm.y) / 2 - sm.z) * z; for (let i = 0; i < 5; i++) { const ph = (G.t * .35 + i / 5) % 1; c.fillStyle = `rgba(90,85,80,${.45 * (1 - ph)})`; c.beginPath(); c.arc(bx + Math.sin(ph * 6 + i) * 6 * z + ph * 14 * z, by - ph * 50 * z, (5 + ph * 12) * z, 0, 7); c.fill(); } }
  const hpf = b.hp / b.maxhp;
  if (hpf < .6 && !b.d.landmark) { const n = hpf < .3 ? 5 : 2, hb = BH[b.type] || 30; for (let i = 0; i < n; i++) { const rx = hash2(b.id, i, 1), ry = hash2(b.id, i, 2), wx = (b.tx + .2 + rx * (b.w - .4)) * TILE, wy = (b.ty + .2 + ry * (b.h - .4)) * TILE, [fx, fy] = w2s(wx, wy, hb * (.4 + hash2(b.id, i, 3) * .4)); const fl = Math.sin(G.t * 13 + i * 3) * .2 + 1; const g = c.createRadialGradient(fx, fy, 1, fx, fy - 6 * z, 12 * z * fl); g.addColorStop(0, 'rgba(255,240,150,.95)'); g.addColorStop(.4, 'rgba(255,130,30,.8)'); g.addColorStop(1, 'rgba(200,40,0,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(fx, fy - 6 * z, 7 * z * fl, 13 * z * fl, 0, 0, 7); c.fill(); for (let k = 0; k < 3; k++) { const ph = (G.t * .5 + k / 3 + rx) % 1; c.fillStyle = `rgba(40,35,30,${.5 * (1 - ph)})`; c.beginPath(); c.arc(fx + ph * 10 * z, fy - (14 + ph * 46) * z, (5 + ph * 10) * z, 0, 7); c.fill(); } } }
}
function drawFish(c, sx, sy, z, h) {   // balık sürüsü: dönen gölgeler, halkalar, ara sıra sıçrama
  const t = G.t * (.8 + h * .4) + h * 20;
  c.fillStyle = 'rgba(20,48,66,.5)';
  for (let k = 0; k < 4; k++) { const a = t + k * 1.7, x = sx + Math.cos(a) * 9 * z, y = sy + Math.sin(a) * 4.5 * z; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, 0, 5 * z, 1.8 * z, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-5 * z, 0); c.lineTo(-8 * z, -2 * z); c.lineTo(-8 * z, 2 * z); c.fill(); c.restore(); }
  const ph = (t * .4) % 1; c.strokeStyle = `rgba(220,240,255,${.5 * (1 - ph)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(sx, sy, (4 + ph * 14) * z, (2 + ph * 7) * z, 0, 0, 7); c.stroke();
  const j = (t * .23 + h) % 3; if (j < .35) { const q = j / .35, x = sx + (h - .5) * 16 * z, y = sy - Math.sin(q * Math.PI) * 10 * z; c.fillStyle = 'rgba(200,215,225,.95)'; c.save(); c.translate(x, y); c.rotate(-1 + q * 2); c.beginPath(); c.ellipse(0, 0, 4 * z, 1.6 * z, 0, 0, 7); c.fill(); c.restore(); }
}
function drawRes(c, tx, ty, r) {
  const [sx, sy] = w2s(tx * TILE + 16, ty * TILE + 16), z = cam.z, v = (hash2(tx, ty, 9) * 6) | 0;
  if (r === 4) { drawFish(c, sx, sy, z, hash2(tx, ty, 2)); return; }
  if (BL.ok) {
    const nm = r === 1 ? 'tree' + v : r === 2 ? 'mine' + (v % 3) : 'berry' + (v % 3);
    if (r === 1) { const sway = Math.sin(G.t * 1.3 + tx * .7 + ty * .3) * .02; c.save(); c.translate(sx, sy); c.transform(1, 0, sway, 1, 0, 0); blStatic(c, nm, null, 0, 0, z); c.restore(); }
    else blStatic(c, nm, null, sx, sy, z);
    if (r === 2) { const ph = (G.t * .7 + hash2(tx, ty, 4) * 5) % 3; if (ph < .35) { const a = Math.sin(ph / .35 * Math.PI), gx = sx + (hash2(tx, ty, 5) - .5) * 30 * z, gy = sy - (8 + hash2(tx, ty, 6) * 18) * z; c.strokeStyle = `rgba(255,250,200,${a})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx - 5 * a, gy); c.lineTo(gx + 5 * a, gy); c.moveTo(gx, gy - 5 * a); c.lineTo(gx, gy + 5 * a); c.stroke(); } }
    return;
  }
  if (r === 1) { const spr = treeSprite(v), sway = Math.sin(G.t * 1.3 + tx * .7 + ty * .3) * .025; c.save(); c.translate(sx, sy + 4 * z); c.transform(1, 0, sway, 1, 0, 0); c.drawImage(spr, -32 * z, -72 * z, 64 * z, 84 * z); c.restore(); }
  else if (r === 2) { drawSpr(c, mineSprite(v % 3), sx, sy, 32, 40); const ph = (G.t * .7 + hash2(tx, ty, 4) * 5) % 3; if (ph < .35) { const a = Math.sin(ph / .35 * Math.PI), gx = sx + (hash2(tx, ty, 5) - .5) * 30 * z, gy = sy - (8 + hash2(tx, ty, 6) * 18) * z; c.strokeStyle = `rgba(255,250,200,${a})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx - 5 * a, gy); c.lineTo(gx + 5 * a, gy); c.moveTo(gx, gy - 5 * a); c.lineTo(gx, gy + 5 * a); c.stroke(); } }
  else if (r === 3) drawSpr(c, berrySprite(v % 3), sx, sy, 24, 24);
}
function drawProj(c, p) {
  const t = clamp(1 - Math.hypot(p.tx - p.x, p.ty - p.y) / (p.d0 || 1), 0, 1), arcH = p.kind === 'ball' ? Math.min(60, p.d0 * .12) : p.kind === 'shot' ? 4 : Math.min(48, p.d0 * .16);
  const zz = 14 + arcH * 4 * t * (1 - t), [sx, sy] = w2s(p.x, p.y, zz), [gx, gy] = w2s(p.x, p.y), z = cam.z;
  if (p.kind === 'ball') { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(gx, gy, 4 * z, 2 * z, 0, 0, 7); c.fill(); for (let k = 1; k <= 4; k++) { c.fillStyle = `rgba(200,200,200,${.25 - k * .05})`; c.beginPath(); c.arc(sx - Math.cos(p.ang) * k * 6 * z, sy - Math.sin(p.ang) * k * 3 * z, (3 + k) * z, 0, 7); c.fill(); } const g = c.createRadialGradient(sx - 1.5, sy - 1.5, .5, sx, sy, 4.5 * z); g.addColorStop(0, '#888'); g.addColorStop(1, '#111'); c.fillStyle = g; c.beginPath(); c.arc(sx, sy, 4.5 * z, 0, 7); c.fill(); }
  else if (p.kind === 'shot') { c.strokeStyle = 'rgba(255,230,140,.9)'; c.lineWidth = 2 * z; const [ex, ey] = w2s(p.x - Math.cos(p.ang) * 14, p.y - Math.sin(p.ang) * 14, zz); c.beginPath(); c.moveTo(ex, ey); c.lineTo(sx, sy); c.stroke(); }
  else { const n = w2s(p.x + Math.cos(p.ang) * 6, p.y + Math.sin(p.ang) * 6, 14 + arcH * 4 * (t + .02) * (1 - t - .02)), dx = n[0] - sx, dy = n[1] - sy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; c.strokeStyle = '#3a2a18'; c.lineWidth = 1.6 * z; c.beginPath(); c.moveTo(sx - ux * 9 * z, sy - uy * 9 * z); c.lineTo(sx + ux * 3 * z, sy + uy * 3 * z); c.stroke(); c.fillStyle = '#ddd'; c.fillRect(sx - ux * 9 * z - 1, sy - uy * 9 * z - 1, 2.5, 2.5); }
}
function drawFx(c, f) {
  const a = 1 - f.t / f.life, z = cam.z;
  if (f.k === 'corpse' && BL.ok && SPRITES.units[f.look]) { if (!ally(f.owner) && !visAt(f.x, f.y)) return; const [sx, sy] = w2s(f.x, f.y); blUnit(c, f.look, f.owner, facingDir(f.face), 'dead', 0, sx, sy, z * UZ, Math.min(1, a * 3)); }
  else if (f.k === 'corpse') { if (!ally(f.owner) && !visAt(f.x, f.y)) return; const [sx, sy] = w2s(f.x, f.y); const spr = unitSprite(f.look, f.owner, facingDir(f.face), 'idle', 0); c.save(); c.globalAlpha = Math.min(1, a * 3) * .85; c.translate(sx, sy); c.scale(z, z * .45); c.rotate(1.35); c.drawImage(spr, -64, -86); c.restore(); c.fillStyle = `rgba(90,15,10,${.35 * a})`; c.beginPath(); c.ellipse(sx + 4 * z, sy + 2 * z, 10 * z, 4 * z, 0, 0, 7); c.fill(); }
  else if (f.k === 'rubble') { for (let i = 0; i < 6 * f.w * f.h; i++) { const wx = (f.tx + hash2(f.id, i, 1) * f.w) * TILE, wy = (f.ty + hash2(f.id, i, 2) * f.h) * TILE, [sx, sy] = w2s(wx, wy), r = (3 + hash2(f.id, i, 3) * 6) * z; c.fillStyle = `rgba(${110 + hash2(f.id, i, 4) * 50 | 0},${100 + hash2(f.id, i, 4) * 40 | 0},85,${Math.min(1, a * 4)})`; c.beginPath(); c.moveTo(sx - r, sy); c.lineTo(sx - r * .3, sy - r * .8); c.lineTo(sx + r, sy - r * .3); c.lineTo(sx + r * .6, sy + r * .4); c.closePath(); c.fill(); } }
  else if (f.k === 'puff') { const [sx, sy] = w2s(f.x, f.y, 10 + f.t * 40); c.fillStyle = `rgba(110,100,90,${.6 * a})`; c.beginPath(); c.arc(sx, sy, f.r * (1 + f.t) * z, 0, 7); c.fill(); }
  else if (f.k === 'boom') { const [sx, sy] = w2s(f.x, f.y); const R = f.r * (.4 + f.t * 2) * z; const g = c.createRadialGradient(sx, sy - 8 * z, 1, sx, sy - 8 * z, R); g.addColorStop(0, `rgba(255,245,180,${a})`); g.addColorStop(.35, `rgba(255,140,30,${.85 * a})`); g.addColorStop(1, 'rgba(120,40,0,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(sx, sy - 6 * z, R, R * .75, 0, 0, 7); c.fill(); c.strokeStyle = `rgba(255,255,255,${.4 * a})`; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy, R * 1.3, R * .65, 0, 0, 7); c.stroke(); for (let k = 0; k < 4; k++) { c.fillStyle = `rgba(70,60,55,${.5 * a})`; c.beginPath(); c.arc(sx + (k - 1.5) * 9 * z, sy - (16 + f.t * 60 + k * 4) * z, (8 + f.t * 16) * z, 0, 7); c.fill(); } }
  else if (f.k === 'heal') { const [sx, sy] = w2s(f.x, f.y, 20 + f.t * 40); c.fillStyle = `rgba(140,255,150,${a})`; c.font = `bold ${14 * z}px sans-serif`; c.textAlign = 'center'; c.fillText('+', sx, sy); c.fillText('+', sx - 9 * z, sy + 8 * z); c.textAlign = 'left'; }
  else if (f.k === 'ping') { const [sx, sy] = w2s(f.x, f.y); c.strokeStyle = f.col; c.globalAlpha = a; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy, (8 + (1 - a) * 16) * cam.z, (4 + (1 - a) * 8) * cam.z, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
}
function bar(c, x, y, w, f, col) { c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 5); c.fillStyle = col || (f > .5 ? '#3fbf4f' : f > .25 ? '#e0b020' : '#d83a3a'); c.fillRect(x - w / 2, y, w * clamp(f, 0, 1), 3); }
function diamond(c, tx, ty, w, h, stroke, fill, lw) { const P = [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => w2s((tx + x) * TILE, (ty + y) * TILE)); c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); } }

function render() {
  const c = ctx, W = cv.width, H = cv.height, z = cam.z;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0b0805'; c.fillRect(0, 0, W, H);
  const vb = visBounds(); drawTerrain(c);
  const tx0 = (vb.x0 / TILE) | 0, tx1 = Math.min(G.W - 1, (vb.x1 / TILE) | 0), ty0 = (vb.y0 / TILE) | 0, ty1 = Math.min(G.H - 1, (vb.y1 / TILE) | 0);
  const onScr = (sx, sy, m) => sx > -m && sx < W + m && sy > -m && sy < H + m * 1.6;
  // su parıltısı
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { const i = idx(tx, ty); if (G.terrain[i] !== 1 || !G.exp[i] && !G.m.noFog) continue; const h = hash2(tx, ty, 3); if (h > .45) continue; const ph = (G.t * .5 + h * 10) % 1; if (ph > .5) continue; const [sx, sy] = w2s(tx * TILE + h * 30, ty * TILE + hash2(tx, ty, 8) * 30); if (!onScr(sx, sy, 20)) continue; const a = Math.sin(ph * 2 * Math.PI) * .45; c.strokeStyle = `rgba(230,245,255,${a})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(sx - 7 * z, sy); c.quadraticCurveTo(sx, sy - 2.5 * z, sx + 7 * z, sy); c.stroke(); }
  // zemin katmanı: tarla ve harabeler, cesetler
  for (const b of G.blds) if (!b.dead && b.d.farm && (ally(b.owner) || expAt(b.x, b.y))) drawBuilding(c, b);
  for (const f of G.fx) if (f.k === 'rubble' || f.k === 'corpse') drawFx(c, f);
  // seçim halkaları (birimlerin altında)
  for (const e of G.sel) { if (e.dead) continue; const col = e.owner === 0 ? '#7dff8a' : ally(e.owner) ? '#ffd75a' : '#ff6a5a'; if (e.kind === 'u') { const [sx, sy] = w2s(e.x, e.y), pr = 1 + Math.sin(G.t * 6) * .06; c.strokeStyle = col; c.lineWidth = 2; if (!LITE) { c.shadowColor = col; c.shadowBlur = 8; } c.beginPath(); c.ellipse(sx, sy, (e.r * UZ + 5) * z * pr, (e.r * UZ + 5) * z * .5 * pr, 0, 0, 7); c.stroke(); c.shadowBlur = 0; } else diamond(c, e.tx, e.ty, e.w, e.h, col, 'rgba(120,255,140,.08)', 2); }
  // derinliğe göre sırala
  const L = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { const i = idx(tx, ty), r = G.res[i]; if (!r || (!G.exp[i] && !G.m.noFog)) continue; L.push({ k: (tx + ty + 1) * TILE, t: 0, tx, ty, r }); }
  for (const b of G.blds) { if (b.dead || b.d.farm) continue; if (!ally(b.owner) && !expAt(b.x, b.y)) continue; L.push({ k: b.x + b.y + (b.w + b.h) * 6, t: 1, e: b }); }
  if (BL.ok) for (const dc of G.decor) { if (dc.tx < tx0 || dc.tx > tx1 || dc.ty < ty0 || dc.ty > ty1) continue; if (!G.m.noFog && !G.exp[idx(dc.tx, dc.ty)]) continue; if (G.occ[idx(dc.tx, dc.ty)]) continue; L.push({ k: (dc.tx + dc.ty) * TILE, t: 3, e: null, dc }); }
  for (const u of G.ents) { if (u.kind !== 'u' || u.dead) continue; if (!ally(u.owner) && !visAt(u.x, u.y)) continue; const [sx, sy] = w2s(u.x, u.y); if (!onScr(sx, sy, 80)) continue; L.push({ k: u.x + u.y, t: 2, e: u }); }
  L.sort((a, b) => a.k - b.k);
  for (const it of L) { if (it.t === 0) drawRes(c, it.tx, it.ty, it.r); else if (it.t === 1) drawBuilding(c, it.e); else if (it.t === 3) { const [dx, dy] = w2s(it.dc.tx * TILE + 16 + it.dc.ox, it.dc.ty * TILE + 16 + it.dc.oy); blStatic(c, 'decor' + it.dc.v, null, dx, dy, z); } else drawUnit(c, it.e); }
  // mermiler ve efektler
  for (const p of G.proj) { if (!ally(p.owner) && !visAt(p.x, p.y)) continue; drawProj(c, p); }
  for (const f of G.fx) if (f.k !== 'rubble' && f.k !== 'corpse') drawFx(c, f);
  // bulut gölgeleri
  for (let k = 0; k < 4; k++) {
    const wx = ((G.t * 9 + k * 977) % (G.W * TILE + 1200)) - 600 + hash2(k, 1, 7) * 300, wy = (hash2(k, 2, 7) * G.H * TILE + G.t * 4) % (G.H * TILE);
    const [sx, sy] = w2s(wx, wy), R0 = (260 + hash2(k, 3, 7) * 200) * z;
    if (sx < -R0 * 1.6 || sx > W + R0 * 1.6 || sy < -R0 || sy > H + R0) continue;
    const g = c.createRadialGradient(sx, sy, R0 * .1, sx, sy, R0); g.addColorStop(0, 'rgba(20,30,40,.16)'); g.addColorStop(1, 'rgba(20,30,40,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(sx, sy, R0 * 1.5, R0 * .75, 0, 0, 7); c.fill();
  }
  if (G.m.night && !G.flags.dawn) { c.fillStyle = 'rgba(8,16,48,.42)'; c.fillRect(0, 0, W, H); }   // gece
  drawFog(c);
  // sağlık çubukları
  for (const it of L) { const e = it.e; if (!e || e.d.landmark) continue; const sel = G.sel.includes(e); if (e.hp >= e.maxhp && !sel && !(e.kind === 'b' && !e.built)) continue; if (e.kind === 'u') { const [sx, sy] = w2s(e.x, e.y, unitTop(e)); bar(c, sx, sy, 24 * z, e.hp / e.maxhp); } else { const [sx, sy] = w2s(e.x, e.y, (BH[e.type] || 30) + 14); bar(c, sx, sy, Math.min(e.w * 30, 80) * z, e.hp / e.maxhp); if (!e.built) bar(c, sx, sy + 6, Math.min(e.w * 30, 80) * z, e.prog, '#e8b030'); } }
  c.font = `600 ${Math.round(12 * Math.max(.8, z))}px Cinzel, Georgia, serif`; c.textAlign = 'center';
  for (const it of L) { const e = it.e; if (!e || e.kind !== 'u' || !(e.d.hero || e.name !== e.d.name)) continue; const [sx, sy] = w2s(e.x, e.y, unitTop(e) + 12); const tw = c.measureText(e.name).width + 10; c.fillStyle = 'rgba(15,8,3,.72)'; c.fillRect(sx - tw / 2, sy - 12, tw, 16); c.fillStyle = e.owner === 0 ? '#f3d68a' : '#ffb0a0'; c.fillText(e.name, sx, sy); }
  c.textAlign = 'left';
  for (const b of G.blds) if (b.owner === 0 && b.queue.length && !b.dead) { const [sx, sy] = w2s(b.x, b.y, (BH[b.type] || 30) + 22); bar(c, sx, sy, 44 * z, b.queue[0].t / qTime(b.queue[0]), '#4aa3ff'); }
  for (const e of G.sel) if (e.kind === 'b' && e.owner === 0 && e.rally && !e.dead) { const [sx, sy] = w2s(e.rally.x, e.rally.y); c.save(); c.translate(sx, sy); flagDraw(c, 0, 0, '#7dff8a', G.t, false, ''); c.restore(); }
  // inşaat alanı
  if (G.zone && !G.blds.some(b => b.type === 'hisar' && b.owner === 0)) { const zn = G.zone; c.setLineDash([10, 8]); diamond(c, zn.x0, zn.y0, zn.x1 - zn.x0 + 1, zn.y1 - zn.y0 + 1, 'rgba(255,215,90,.95)', 'rgba(255,215,90,.12)', 3); c.setLineDash([]); const [sx, sy] = w2s((zn.x0 + zn.x1) / 2 * TILE, (zn.y0 + zn.y1) / 2 * TILE); c.font = `bold ${14 * z}px Cinzel, Georgia, serif`; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('HİSAR İNŞAAT ALANI', sx + 1, sy + 1); c.fillStyle = '#ffe08a'; c.fillText('HİSAR İNŞAAT ALANI', sx, sy); c.textAlign = 'left'; }
  // yerleştirme hayaleti
  if (place && mouse.in) {
    const w = s2w(mouse.x, mouse.y), d = BUILDS[place.type], tx = Math.floor(w.x / TILE - d.w / 2 + .5), ty = Math.floor(w.y / TILE - d.h / 2 + .5); place.tx = tx; place.ty = ty; place.ok = canPlace(place.type, tx, ty);
    diamond(c, tx, ty, d.w, d.h, place.ok ? '#7dff8a' : '#ff5c5c', place.ok ? 'rgba(80,255,120,.25)' : 'rgba(255,70,70,.3)', 2);
    if (blHas(place.type)) { const [gx, gy] = w2s((tx + d.w / 2) * TILE, (ty + d.h / 2) * TILE); blStatic(c, place.type, 0, gx, gy, z, .6); } else { const s = buildingSprite(place.type, 0), [ox, oy] = w2s(tx * TILE, ty * TILE); c.globalAlpha = .6; c.drawImage(s.cv, ox - s.meta.ox * z, oy - s.meta.oy * z, s.cv.width * z, s.cv.height * z); c.globalAlpha = 1; }
    if (d.atk) { const [sx, sy] = w2s((tx + d.w / 2) * TILE, (ty + d.h / 2) * TILE); c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(sx, sy, d.range * 1.414 * z, d.range * .707 * z, 0, 0, 7); c.stroke(); }
  }
  if (mouse.down && mouse.drag && !place) { c.strokeStyle = '#7dff8a'; c.lineWidth = 1; c.strokeRect(mouse.sx, mouse.sy, mouse.x - mouse.sx, mouse.y - mouse.sy); c.fillStyle = 'rgba(125,255,138,.1)'; c.fillRect(mouse.sx, mouse.sy, mouse.x - mouse.sx, mouse.y - mouse.sy); }
  c.font = 'bold 14px Georgia, serif';
  if (amovePending) { c.fillStyle = '#000'; c.fillText('Saldırarak ilerle: hedefe tıkla (Esc iptal)', mouse.x + 15, mouse.y - 7); c.fillStyle = '#ff9a7c'; c.fillText('Saldırarak ilerle: hedefe tıkla (Esc iptal)', mouse.x + 14, mouse.y - 8); }
  if (place) { const t = BUILDS[place.type].name + ' — tıkla: yerleştir · Esc: iptal · Shift: devam'; c.fillStyle = '#000'; c.fillText(t, mouse.x + 15, mouse.y - 7); c.fillStyle = '#fff'; c.fillText(t, mouse.x + 14, mouse.y - 8); }
}

/* ---------- mini harita (elmas) ---------- */
function drawMini() {
  const W = G.W, H = G.H, tc = mmTile.getContext('2d'), img = tc.createImageData(W, H), d = img.data;
  for (let i = 0; i < W * H; i++) {
    let r, g, b; const t = G.terrain[i], res = G.res[i];
    if (t === 1) { r = 44; g = 96; b = 140; } else if (t === 2) { r = 150; g = 120; b = 80; } else if (t === 3) { r = 200; g = 180; b = 130; } else if (t === 4) { r = 140; g = 130; b = 115; } else { r = 82; g = 122; b = 50; }
    if (res === 1) { r = 34; g = 74; b = 30; } else if (res === 2) { r = 240; g = 200; b = 40; } else if (res === 3) { r = 170; g = 60; b = 80; } else if (res === 4) { r = 120; g = 190; b = 220; }
    if (!G.m.noFog) { if (!G.exp[i]) { r = g = b = 0; } else if (!G.vis[i]) { r *= .55; g *= .55; b *= .55; } }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  tc.putImageData(img, 0, 0);
  const m = mctx; m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, mini.width, mini.height); m.imageSmoothingEnabled = false;
  m.setTransform(4, 2, -4, 2, H * 4, 0); m.drawImage(mmTile, 0, 0);
  for (const bl of G.blds) { if (!ally(bl.owner) && !expAt(bl.x, bl.y)) continue; m.fillStyle = bl.owner === 0 ? '#5aaaff' : bl.d.landmark ? '#fff0a0' : G.colors[bl.owner]; m.fillRect(bl.tx, bl.ty, bl.w, bl.h); }
  for (const u of G.ents) { if (u.kind !== 'u' || u.dead) continue; if (!ally(u.owner) && !visAt(u.x, u.y)) continue; m.fillStyle = u.owner === 0 ? '#7dff8a' : G.colors[u.owner]; m.fillRect(u.x / TILE - .7, u.y / TILE - .7, 1.5, 1.5); }
  m.setTransform(1, 0, 0, 1, 0, 0); m.strokeStyle = '#fff'; m.lineWidth = 3; m.strokeRect((cam.x + H * TILE) * MF, cam.y * MF, viewW() * MF, viewH() * MF);
}

/* ---------- yerleştirme ---------- */
function canPlace(type, tx, ty) {
  const d = BUILDS[type];
  for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) { if (!inb(x, y)) return false; const i = idx(x, y); if (G.blkT[i] || G.occ[i] || !G.exp[i] && !G.m.noFog) return false; }
  if (d.zone) { const z = G.zone; if (!z || tx < z.x0 || ty < z.y0 || tx + d.w - 1 > z.x1 || ty + d.h - 1 > z.y1) return false; }
  if (d.dock) { let w = 0; for (let x = tx - 1; x <= tx + d.w; x++) for (let y = ty - 1; y <= ty + d.h; y++) if (inb(x, y) && G.terrain[idx(x, y)] === 1) w++; if (w < 2) return false; }
  return true;
}
function tryPlace(shift) {
  const t = place.type, d = BUILDS[t], p = G.players[0];
  if (!place.ok) { msg(d.zone ? 'Hisar yalnızca işaretli alana kurulabilir.' : d.dock ? 'Tersane kıyıya, suya bitişik kurulmalı.' : 'Buraya inşa edilemez.', 'warn'); return; }
  if (!afford(p, d.cost)) { msg('Yetersiz kaynak!', 'warn'); return; }
  const vills = G.sel.filter(e => e.kind === 'u' && e.d.worker && e.owner === 0); if (!vills.length) { place = null; return; }
  pay(p, d.cost); const b = addBuilding(t, 0, place.tx, place.ty, { built: false });
  for (const v of vills) orderBuild(v, b);
  if (!shift || !afford(p, d.cost)) place = null; cardSig = '';
}

/* ---------- ekrandan seçme ---------- */
function hull(pts) { pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); }
function inPoly(x, y, P) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) ins = !ins; } return ins; }
function entAtScreen(sx, sy, ownOnly) {
  let best = null, bd = -1e9; const z = cam.z;
  for (const u of G.ents) { if (u.kind !== 'u' || u.dead) continue; if (!ally(u.owner) && !visAt(u.x, u.y)) continue; if (ownOnly && u.owner !== 0) continue; const [fx, fy] = w2s(u.x, u.y), hw = (u.d.cls === 'cav' || u.d.cls === 'hero' || u.d.cls === 'sie' ? 16 : 10) * z; if (Math.abs(sx - fx) <= hw && sy >= fy - unitTop(u) * z && sy <= fy + 6 * z) { const k = u.x + u.y; if (k > bd) { bd = k; best = u; } } }
  if (best) return best;
  let bb = null; bd = -1e9;
  for (const b of G.blds) { if (b.dead) continue; if (ownOnly && b.owner !== 0) continue; if (!ally(b.owner) && !expAt(b.x, b.y)) continue; const h = Math.min(BH[b.type] || 30, 70), pts = []; for (const [x, y] of [[0, 0], [b.w, 0], [b.w, b.h], [0, b.h]]) { pts.push(w2s((b.tx + x) * TILE, (b.ty + y) * TILE)); pts.push(w2s((b.tx + x) * TILE, (b.ty + y) * TILE, h)); } if (inPoly(sx, sy, hull(pts))) { const k = b.x + b.y; if (k > bd) { bd = k; bb = b; } } }
  return bb;
}
function resAtScreen(sx, sy) {
  const g = s2w(sx, sy), z = cam.z; let best = null, bd = -1e9;
  const cx = (g.x / TILE) | 0, cy = (g.y / TILE) | 0;
  for (let k = -1; k <= 3; k++) for (let o = -1; o <= 1; o++) { const tx = cx + k + o, ty = cy + k - o; if (!inb(tx, ty)) continue; const i = idx(tx, ty), r = G.res[i]; if (!r || (!G.exp[i] && !G.m.noFog)) continue; const [bx, by] = w2s(tx * TILE + 16, ty * TILE + 16), top = r === 1 ? 62 : r === 2 ? 34 : 18, hw = r === 1 ? 18 : r === 4 ? 26 : 22; if (Math.abs(sx - bx) <= hw * z && sy >= by - top * z && sy <= by + 10 * z) { if (tx + ty > bd) { bd = tx + ty; best = [tx, ty]; } } }
  return best;
}
function selectUnits(list, add) { if (add) { for (const e of list) if (!G.sel.includes(e)) G.sel.push(e); } else G.sel = list.slice(); cardSig = ''; updateCard(); }
function mySel() { return G.sel.filter(e => !e.dead && e.owner === 0); }
function commandAt(sx, sy) {
  const g = s2w(sx, sy), sel = mySel().filter(e => e.kind === 'u'), bsel = mySel().filter(e => e.kind === 'b' && e.d.trains);
  if (!sel.length) { if (bsel.length) { const rs = resAtScreen(sx, sy); const pt = rs ? { x: rs[0] * TILE + 16, y: rs[1] * TILE + 16 } : g; for (const b of bsel) b.rally = pt; fxPing(pt.x, pt.y); } return; }
  const t = entAtScreen(sx, sy, false);
  if (t && isEnemy(0, t.owner) && !t.d.landmark) { for (const u of sel) if (u.atk) orderAttack(u, t); else orderMove(u, t.x, t.y); fxPing(t.x, t.y, '#ff5c5c'); return; }
  if (t && t.owner === 0 && t.kind === 'b') {
    if (!t.built) { for (const u of sel) if (u.d.worker) orderBuild(u, t); else orderMove(u, t.x, t.y + t.h * 16 + 20); fxPing(t.x, t.y); return; }
    if (t.d.farm && sel.some(u => u.d.worker)) { for (const u of sel) if (u.d.worker) orderFarm(u, t); fxPing(t.x, t.y); return; }
  }
  const rs = resAtScreen(sx, sy);
  const fish = rs && G.res[idx(rs[0], rs[1])] === 4, gat = u => fish ? u.d.fisher : u.d.worker;
  if (rs && sel.some(gat)) { for (const u of sel) if (gat(u)) orderGather(u, rs[0], rs[1]); else orderMove(u, rs[0] * TILE + 16, rs[1] * TILE + 16); fxPing(rs[0] * TILE + 16, rs[1] * TILE + 16, '#ffd24d'); return; }
  moveGroup(sel, g.x, g.y); fxPing(g.x, g.y);
}
function moveGroup(sel, wx, wy) {
  const n = sel.length, cols = Math.ceil(Math.sqrt(n)), sp = 26;
  sel.forEach((u, i) => { const gx = (i % cols) - (cols - 1) / 2, gy = Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2; let x = wx + gx * sp, y = wy + gy * sp; const ti = idx(clamp((x / TILE) | 0, 0, G.W - 1), clamp((y / TILE) | 0, 0, G.H - 1)); if (G.blkT[ti] || G.occ[ti]) { x = wx; y = wy; } if (amovePending) orderAmove(u, x, y); else orderMove(u, x, y); });
}
function fxPing(x, y, col) { G.fx.push({ k: 'ping', x, y, t: 0, life: .45, col: col || '#7dff8a' }); }

/* ---------- girdi ---------- */
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (!G || G.done) return; mouse.x = e.offsetX; mouse.y = e.offsetY;
  if (e.button === 2) { if (place) { place = null; return; } if (amovePending) { amovePending = false; return; } commandAt(mouse.x, mouse.y); return; }
  mouse.down = true; mouse.sx = mouse.x; mouse.sy = mouse.y; mouse.drag = false;
});
cv.addEventListener('mousemove', e => { mouse.x = e.offsetX; mouse.y = e.offsetY; mouse.in = true; if (mouse.down && Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy) > 6) mouse.drag = true; });
cv.addEventListener('mouseleave', () => { mouse.in = false; mouse.down = false; });
addEventListener('mouseup', e => {
  if (!G || e.button !== 0 || !mouse.down) return; mouse.down = false;
  if (G.done) return; leftUp(e.shiftKey, false);
});
function leftUp(shift, touch) {
  if (place) {
    if (!mouse.drag) {
      if (touch && (!place.armed || Math.hypot(mouse.x - place.armed.x, mouse.y - place.armed.y) > 40)) { place.armed = { x: mouse.x, y: mouse.y }; msg('Yerleştirmek için aynı yere tekrar dokun.'); }
      else tryPlace(shift);
    }
    mouse.drag = false; return;
  }
  if (amovePending && !mouse.drag) { const w = s2w(mouse.x, mouse.y); moveGroup(mySel().filter(u => u.kind === 'u'), w.x, w.y); amovePending = false; fxPing(w.x, w.y, '#ff7a5c'); return; }
  if (mouse.drag) {
    const x0 = Math.min(mouse.sx, mouse.x), x1 = Math.max(mouse.sx, mouse.x), y0 = Math.min(mouse.sy, mouse.y), y1 = Math.max(mouse.sy, mouse.y);
    const us = G.ents.filter(u => { if (u.kind !== 'u' || u.dead || u.owner !== 0) return false; const [sx, sy] = w2s(u.x, u.y, 14); return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1; });
    if (us.length) selectUnits(us, shift);
  } else {
    const t = entAtScreen(mouse.x, mouse.y, false);
    if (touch) {   // dokunmatik: birim seçiliyken boş yere, düşmana veya kaynağa dokunmak emir verir
      const hasUnits = mySel().some(e => e.kind === 'u'), own = t && t.owner === 0;
      const site = own && t.kind === 'b' && (!t.built || t.d.farm) && mySel().some(e => e.d && e.d.worker);
      if (hasUnits && (!own || site)) { commandAt(mouse.x, mouse.y); mouse.drag = false; return; }
    }
    if (t) {
      if (t.owner === 0 && t.kind === 'u' && lastClick.id === t.id && performance.now() - lastClick.t < 400) selectUnits(G.ents.filter(u => { if (u.kind !== 'u' || u.dead || u.owner !== 0 || u.type !== t.type) return false; const [sx, sy] = w2s(u.x, u.y); return sx > 0 && sx < cv.width && sy > 0 && sy < cv.height - BAR_H; }), shift);
      else if (shift && t.owner === 0) selectUnits([t], true); else selectUnits([t]);
      lastClick = { t: performance.now(), id: t.id };
    } else if (!shift) selectUnits([]);
  }
  mouse.drag = false;
}
/* ---------- dokunmatik ---------- */
let tch = null;
const tpts = e => { const r = cv.getBoundingClientRect(); return [...e.touches].map(t => ({ x: t.clientX - r.left, y: t.clientY - r.top })); };
cv.addEventListener('touchstart', e => {
  e.preventDefault(); if (!G || G.done) return; const T = tpts(e);
  if (tch && tch.lp) clearTimeout(tch.lp);
  if (T.length === 1) {
    tch = { mode: 'one', sx: T[0].x, sy: T[0].y, moved: false };
    Object.assign(mouse, { x: T[0].x, y: T[0].y, in: true, down: true, sx: T[0].x, sy: T[0].y, drag: false });
    tch.lp = setTimeout(() => {   // basılı tut = sağ tık
      if (!tch || tch.mode !== 'one' || tch.moved) return; tch.mode = 'done'; mouse.down = false;
      if (place) place = null; else if (amovePending) amovePending = false; else commandAt(tch.sx, tch.sy);
      if (navigator.vibrate) try { navigator.vibrate(25); } catch (er) { }
    }, 450);
  } else if (T.length >= 2) {
    mouse.down = false; mouse.drag = false;
    const mx = (T[0].x + T[1].x) / 2, my = (T[0].y + T[1].y) / 2, w = s2w(mx, my);
    tch = { mode: 'two', d: Math.hypot(T[0].x - T[1].x, T[0].y - T[1].y) || 1, z: cam.z, wx: w.x, wy: w.y };
  }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault(); if (!G || !tch) return; const T = tpts(e);
  if (tch.mode === 'one' && T.length === 1) {
    mouse.x = T[0].x; mouse.y = T[0].y;
    if (Math.hypot(mouse.x - tch.sx, mouse.y - tch.sy) > 14) { tch.moved = true; if (!place) mouse.drag = true; }
  } else if (tch.mode === 'two' && T.length >= 2) {
    const mx = (T[0].x + T[1].x) / 2, my = (T[0].y + T[1].y) / 2, d = Math.hypot(T[0].x - T[1].x, T[0].y - T[1].y) || 1;
    cam.z = clamp(tch.z * d / tch.d, .6, 1.6);
    cam.x = (tch.wx - tch.wy) - mx / cam.z; cam.y = (tch.wx + tch.wy) / 2 - my / cam.z; clampCam();
  }
}, { passive: false });
cv.addEventListener('touchend', e => {
  e.preventDefault(); if (!G || !tch) return;
  if (tch.lp) clearTimeout(tch.lp);
  if (tch.mode === 'one' && e.touches.length === 0) { mouse.down = false; if (!G.done) leftUp(false, true); mouse.in = !!place; tch = null; }
  else if (tch.mode !== 'one' && e.touches.length === 0) { tch = null; mouse.down = false; mouse.drag = false; }
}, { passive: false });
cv.addEventListener('wheel', e => { e.preventDefault(); const before = s2w(e.offsetX, e.offsetY); cam.z = clamp(cam.z * (e.deltaY < 0 ? 1.1 : .91), .6, 1.6); const ix = before.x - before.y, iy = (before.x + before.y) / 2; cam.x = ix - e.offsetX / cam.z; cam.y = iy - e.offsetY / cam.z; clampCam(); }, { passive: false });
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true; if (!G || !running) return;
  const k = e.key.toLowerCase();
  if (k.startsWith('arrow')) e.preventDefault();
  if ($('tree').style.display === 'flex') { if (k === 'escape' || k === 'i') closeTree(); return; }
  if (k === 'i') { openTree(); return; }
  if (k === 'f5') { e.preventDefault(); saveGame('1'); return; }
  if (k === 'escape') { if (place) place = null; else if (amovePending) amovePending = false; else togglePause(); return; }
  if (k === 'p') { togglePause(); return; }
  if (k === 'home') { goHome(); return; }
  if (k === 'delete') { const s = mySel().filter(e => !e.d.landmark); if (s.length) { for (const e of s) kill(e); msg(s.length + ' seçili öğe yok edildi.'); G.sel = []; cardSig = ''; } return; }
  if (k === 'b' && !cardBtns.some(x => x.key === 'b' && !x.dis)) { findIdle(true); return; }
  if (k === 'n') { findIdle(false); return; }
  if (k === 'h' && G.hero && !G.hero.dead) { selectUnits([G.hero]); centerOn(G.hero.x, G.hero.y); return; }
  if (k === ' ') { e.preventDefault(); const s = mySel(); if (s.length) centerOn(s[0].x, s[0].y); else if (G.hero) centerOn(G.hero.x, G.hero.y); return; }
  if (k === '.' || k === '>') { G.speed = Math.min(4, G.speed + 1); uiSpeed(); return; }
  if (k === ',' || k === '<') { G.speed = Math.max(1, G.speed - 1); uiSpeed(); return; }
  if (/^[0-9]$/.test(k)) { if (e.ctrlKey) { e.preventDefault(); G.groups[k] = mySel().slice(); msg('Grup ' + k + ' atandı.'); } else if (G.groups[k]) { const g = G.groups[k].filter(x => !x.dead); selectUnits(g); if (g.length && performance.now() - (G.groups['t' + k] || 0) < 350) centerOn(g[0].x, g[0].y); G.groups['t' + k] = performance.now(); } return; }
  const btn = cardBtns.find(b => b.key === k && !b.dis); if (btn && !e.ctrlKey) btn.fn();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function miniPos(e) { const r = mini.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * mini.width, my = (e.clientY - r.top) / r.height * mini.height, ix = mx / MF - G.H * TILE, iy = my / MF; return { x: iy + ix / 2, y: iy - ix / 2 }; }
mini.addEventListener('mousedown', e => { if (!G || e.button !== 0) return; mini._d = true; const p = miniPos(e); centerOn(p.x, p.y); });
mini.addEventListener('mousemove', e => { if (mini._d) { const p = miniPos(e); centerOn(p.x, p.y); } });
addEventListener('mouseup', () => { mini._d = false; });
mini.addEventListener('touchstart', e => { e.preventDefault(); if (!G) return; const t = e.touches[0]; const p = miniPos(t); if (e.touches.length > 1 || (tch && tch.mini)) return; centerOn(p.x, p.y); }, { passive: false });
mini.addEventListener('touchmove', e => { e.preventDefault(); if (!G) return; const p = miniPos(e.touches[0]); centerOn(p.x, p.y); }, { passive: false });
mini.addEventListener('contextmenu', e => { e.preventDefault(); const sel = mySel().filter(u => u.kind === 'u'); if (sel.length) { const p = miniPos(e); moveGroup(sel, p.x, p.y); } });

function findIdle(workers) {
  const list = G.ents.filter(u => u.kind === 'u' && u.owner === 0 && !u.dead && u.order.t === 'idle' && (workers ? u.d.worker : (!u.d.worker && !u.d.hero && u.d.atk && !u.hold)));
  if (!list.length) { msg(workers ? 'Boşta reaya yok.' : 'Boşta asker yok.'); return; }
  G.idleIdx = ((G.idleIdx || 0) + 1) % list.length; const u = list[G.idleIdx];
  if (workers) selectUnits([u]); else selectUnits(list); centerOn(u.x, u.y);
}
function goHome() { const b = G.blds.find(x => x.owner === 0 && x.type === 'saray') || G.blds.find(x => x.owner === 0) || G.hero; if (b) centerOn(b.x, b.y); }
let navDir = { x: 0, y: 0 };
function scrollCam(dt) {
  const sp = 1000 * dt / cam.z; let dx = 0, dy = 0;
  if (keys['arrowleft']) dx -= 1; if (keys['arrowright']) dx += 1; if (keys['arrowup']) dy -= 1; if (keys['arrowdown']) dy += 1;
  if (mouse.in && !mouse.down && !place) { if (mouse.x < 6) dx -= 1; if (mouse.x > cv.width - 6) dx += 1; if (mouse.y < 6) dy -= 1; if (mouse.y > cv.height - 4) dy += 1; }
  dx += navDir.x; dy += navDir.y; cam.x += dx * sp; cam.y += dy * sp * .7; clampCam();
}

/* ---------- HUD ---------- */
let cardBtns = [];
const ICONS = new Map();
function icon(kind, type, owner) { owner = owner || 0; const k = kind + type + owner + (type === 'ayasofya' && G.flags.captured ? 'c' : ''); if (!ICONS.has(k)) ICONS.set(k, kind === 't' ? techIcon(type) : (BL.ok && blIcon(kind, type, owner)) || iconCanvas(kind, type, owner)); return ICONS.get(k); }
const TGLYPH = { cografya: '🧭', tip: '⚕', topcu: '💣', zirh: '⛓', lamel: '🛡', balta: '🪓', kazma: '⛏', saban: '🌾', kagni: '🛞', kilic: '🗡', kilic2: '⚔', atzirhi: '🐎', temren: '➶', kemankes: '🏹', talim: '🥁', turkmen: '🐴', fitil: '🔥', mimari: '📐', hendese: '📏', ag: '🎣', kalafat: '⚓', pusula: '🧭' };
const techAvail = id => !G.m.avail.noTech || !G.m.avail.noTech.includes(id);
function techIcon(id) { const cv = mkCanvas(48, 48), c = cv.getContext('2d'); const g = c.createRadialGradient(24, 20, 4, 24, 24, 30); g.addColorStop(0, '#5a3c22'); g.addColorStop(1, '#1a0f07'); c.fillStyle = g; c.fillRect(0, 0, 48, 48); c.strokeStyle = '#d9b25e'; c.lineWidth = 2; c.strokeRect(3, 3, 42, 42); c.font = '24px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f3d68a'; c.fillText(TGLYPH[id] || '✦', 24, 25); return cv; }
const icH = (kind, type, owner) => `<canvas class="ic" width="48" height="48" data-ic="${kind}|${type}|${owner || 0}"></canvas>`;
function fillIcons(root) { root.querySelectorAll('canvas[data-ic]').forEach(cv => { const [k, t, o] = cv.dataset.ic.split('|'); const im = icon(k, t, +o || 0); cv.getContext('2d').drawImage(im, 0, 0, im.width, im.height, 0, 0, cv.width, cv.height); }); }
function uiMsg() { $('log').innerHTML = G.msgs.map(m => `<div class="m ${m.cls}">${m.text}</div>`).join(''); }
function uiObjectives() {
  const m = G.m; $('objs').innerHTML = `<h4>${m.title}</h4>` + m.objectives.filter(o => !o.hidden || o.ok).map(o => `<div class="${o.ok ? 'ok' : ''}">${o.ok ? '✔' : '◇'} ${o.text}${!o.ok && o.prog ? ' <b>' + o.prog() + '</b>' : ''}</div>`).join('') + (m.timeLimit ? `<div class="tl">⏳ Kalan: ${fmtT(Math.max(0, m.timeLimit - G.t))}</div>` : '');
}
const fmtT = s => ((s / 60) | 0) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function uiSpeed() { $('spd').textContent = G.speed + 'x'; }
function updateTop() {
  const p = G.players[0]; $('rf').textContent = Math.floor(p.f); $('rw').textContent = Math.floor(p.w); $('rg').textContent = Math.floor(p.g); $('rp').textContent = p.pop + '/' + p.cap; $('rt').textContent = fmtT(G.t);
  $('rp').style.color = p.pop >= p.cap ? '#ff7a5c' : '';
  $('iw').textContent = G.idleW || 0; $('iwb').classList.toggle('alert', !!G.idleW); $('im').textContent = G.idleM || 0;
}
function btn(label, key, fn, cost, tip, dis, img) { cardBtns.push({ label, key, fn, cost, tip, dis, img }); }
const GLYPH = { amove: '⚔', stop: '■', hold: '⛨', clear: '✕', del: '☠', buyw: '🪵+', buyf: '🌾+', sellw: '🪵→🪙', sellf: '🌾→🪙' };
function buildCard() {
  cardBtns = []; const s = mySel(), p = G.players[0];
  const units = s.filter(e => e.kind === 'u'), blds = s.filter(e => e.kind === 'b'), av = G.m.avail;
  if (units.some(u => u.d.worker)) {
    const hk = ['q', 'w', 'e', 'r', 't', 'a', 'f', 'z', 'x', 'c']; let i = 0;
    for (const t of av.build) { const d = BUILDS[t]; const dis = !afford(p, d.cost) || (d.req && !hasBuilt(0, d.req)); btn(d.name, hk[i++], () => { if (!afford(p, d.cost)) { msg('Yetersiz kaynak!', 'warn'); return; } if (d.req && !hasBuilt(0, d.req)) { msg(BUILDS[d.req].name + ' gerekli.', 'warn'); return; } place = { type: t }; amovePending = false; }, d.cost, d.desc + (d.req ? ' (' + BUILDS[d.req].name + ' gerekir)' : ''), dis, 'b|' + t); }
  }
  if (units.some(u => u.atk && !u.d.worker)) {
    btn('Saldır-ilerle', 'v', () => { amovePending = true; place = null; }, null, 'Hedefe giderken karşılaştığın düşmana saldır', false, 'amove');
    btn('Dur', 's', () => { units.forEach(orderStop); }, null, 'Tüm emirleri iptal et', false, 'stop');
    btn('Mevzi', 'g', () => { units.forEach(u => { orderStop(u); u.hold = true; }); msg('Mevzi alındı: birlikler yerinde durup menzildekilere saldırır.'); }, null, 'Yerinde dur, kovalamadan saldır', false, 'hold');
  } else if (units.length) btn('Dur', 's', () => { units.forEach(orderStop); }, null, 'Emirleri iptal et', false, 'stop');
  if (s.length) { btn('Bırak', '', () => selectUnits([]), null, 'Seçimi bırak', false, 'clear'); btn('Yok et', '', () => { const x = mySel().filter(e => !e.d.landmark); if (!x.length) return; if (!G.delArm || G.t - G.delArm > 3) { G.delArm = G.t; msg('Yok etmek için tekrar bas (Delete).', 'warn'); return; } for (const e of x) kill(e); G.sel = []; cardSig = ''; }, null, 'Seçili kendi birim/binanı yok et (iki kez bas)', false, 'del'); }
  if (blds.length === 1 && blds[0].built && blds[0].d.market) {
    const M = G.market, pr = k => Math.round(M[k]);
    btn('Odun al', 'q', () => { trade(0, 'w', true); cardSig = ''; }, { g: pr('w') }, '100 odun satın al (' + pr('w') + ' altın)', p.g < pr('w'), 'buyw');
    btn('Yiyecek al', 'w', () => { trade(0, 'f', true); cardSig = ''; }, { g: pr('f') }, '100 yiyecek satın al (' + pr('f') + ' altın)', p.g < pr('f'), 'buyf');
    btn('Odun sat', 'e', () => { trade(0, 'w', false); cardSig = ''; }, { w: 100 }, '100 odun sat → ' + Math.round(pr('w') * .75) + ' altın', p.w < 100, 'sellw');
    btn('Yiyecek sat', 'r', () => { trade(0, 'f', false); cardSig = ''; }, { f: 100 }, '100 yiyecek sat → ' + Math.round(pr('f') * .75) + ' altın', p.f < 100, 'sellf');
  }
  if (blds.length === 1 && blds[0].built && (blds[0].d.trains || blds[0].d.techs)) {
    const b = blds[0], hk = ['q', 'w', 'e', 'r', 't', 'a', 'f', 'z', 'x', 'c', 'y', 'u']; let i = 0;
    for (const t of b.d.trains || []) { if (!av.train.includes(t)) continue; const d = UNITS[t]; const dis = !afford(p, d.cost) || p.pop + d.pop > p.cap; btn(d.name, hk[i++], () => { queueTrain(b, t); cardSig = ''; }, d.cost, d.desc + (d.str ? '\n▲ Güçlü: ' + d.str + '\n▼ Zayıf: ' + d.weak : '') + '\n(' + d.pop + ' nüfus, ' + d.time + ' sn)', dis, 'u|' + t); }
    if (b.owner === 0) for (const id of b.d.techs || []) { const T = TECHS[id]; if (hasTech(0, id) || !techAvail(id)) continue; const busy = G.blds.some(x => x.owner === 0 && x.queue.some(q => q.type === 'T:' + id)), rq = !techReqOk(0, id); btn(T.name, hk[i++], () => { queueTech(b, id); cardSig = ''; }, T.cost, T.desc + (rq ? '\n(Önce: ' + TECHS[T.req].name + ')' : '') + ' (' + T.time + ' sn)', busy || rq || !afford(p, T.cost), 't|' + id); }
  }
}
function updateCard() {
  const sig = G.sel.map(e => e.id).join(',') + '|' + (place ? 1 : 0) + '|' + Math.floor(G.players[0].f) + Math.floor(G.players[0].w) + Math.floor(G.players[0].g) + '|' + Math.round(G.market.w) + Math.round(G.market.f) + '|' + G.players[0].pop + '|' + G.blds.filter(b => b.owner === 0 && b.built).length;
  if (sig !== cardSig) {
    cardSig = sig; buildCard(); const el = $('card'); el.innerHTML = '';
    cardBtns.forEach(b => { const d = document.createElement('button'); d.className = 'cb' + (b.dis ? ' dis' : ''); const im = b.img && b.img.includes('|') ? icH(...b.img.split('|')) : `<span class="gl">${GLYPH[b.img] || '◆'}</span>`; d.innerHTML = `${im}<span class="k">${(b.key || '').toUpperCase()}</span><span class="lb">${b.label}</span>${b.cost ? `<small>${costShort(b.cost)}</small>` : ''}`; d.title = (b.tip || '') + (b.cost ? '\n' + sfmt(b.cost) : ''); d.onclick = () => b.fn(); el.appendChild(d); }); fillIcons(el);
  }
  const info = $('info'), one = G.sel.length === 1 ? G.sel[0] : null;
  if (!G.sel.length) info.innerHTML = '<div class="hint">Birim seç: tıkla veya kutu çiz.<br>Sağ tık: hareket · saldırı · kaynak topla.<br><b>H</b>: Sultan\'a git — <b>Boşluk</b>: seçime git — <b>Tekerlek</b>: yakınlaş</div>';
  else if (one) {
    const d = one.d;
    let h = `<div class="por"><canvas class="ic" width="96" height="96" data-ic="${one.kind === 'u' ? 'u' : 'b'}|${one.type}|${one.owner}"></canvas></div><div class="tx"><h3>${one.name}</h3><div class="hp"><i style="width:${Math.max(0, one.hp / one.maxhp * 100)}%"></i></div><div>Can: ${Math.ceil(one.hp)} / ${one.maxhp}</div>`;
    if (one.kind === 'u') { h += `<div title="Saldırı · yakın dövüş zırhı / ok zırhı · menzil">⚔ ${Math.round(one.atk * 10) / 10}${d.bonus ? ' <small>(' + Object.entries(d.bonus).map(([k, v]) => '+' + v + ' ' + CLSN[k]).join(', ') + ')</small>' : ''} · 🛡 ${one.ma}/${one.pa} · ➶ ${d.range ? Math.round(rangeOf(one) / TILE) + ' kare' : 'yakın'}</div>`; if (d.str) h += `<div class="cnt"><span class="g">▲ ${d.str}</span> · <span class="w">▼ ${d.weak}</span></div>`; if (one.carry && one.carry.amt) h += `<div>Taşıyor: ${one.carry.amt}</div>`; if (one.aura) h += '<div class="g">Komutan etkisi: +%20 saldırı</div>'; h += `<div class="d">${one.desc || d.desc || ''}</div>`; }
    else { if (!one.built) h += `<div>İnşaat: %${Math.floor(one.prog * 100)}</div>`; else if (one.queue.length) h += '<div>Üretim: ' + one.queue.map((q, i) => `<span class="q" data-i="${i}" title="${qName(q)} — iptal et">${q.type.startsWith('T:') ? icH('t', q.type.slice(2)) : icH('u', q.type)}${i === 0 ? '%' + Math.floor(q.t / qTime(q) * 100) : ''}</span>`).join(' ') + '</div>'; if (one.owner === 0 && one.d.trains) h += '<div class="d">Sağ tık: toplanma noktası</div>'; if (one.d.techs) h += '<div class="d">İlimler: ' + one.d.techs.map(t => (hasTech(0, t) ? '✔ ' : '') + TECHS[t].name).join(' · ') + '</div>'; if (one.d.desc) h += `<div class="d">${one.d.desc}</div>`; }
    info.innerHTML = h + '</div>'; fillIcons(info);
    info.querySelectorAll('.q').forEach(q => q.onclick = () => { const i = +q.dataset.i, it = one.queue[i]; if (!it) return; one.queue.splice(i, 1); const c = qCost(it); G.players[0].f += c.f || 0; G.players[0].w += c.w || 0; G.players[0].g += c.g || 0; });
  } else {
    const cnt = {}; G.sel.forEach(e => { const k = e.type; cnt[k] = cnt[k] || { n: 0, e }; cnt[k].n++; });
    info.innerHTML = `<div class="tx"><h3>${G.sel.length} birim</h3><div class="grid">` + Object.values(cnt).map(({ n, e }) => `<span class="gi" title="${e.name}">${icH(e.kind, e.type)}<b>${n}</b></span>`).join('') + '</div></div>'; fillIcons(info);
  }
}
const costShort = c => Object.entries(c).map(([k, v]) => `<i class="r${k}"></i>${v}`).join(' ');

/* ---------- döngü ---------- */
function frame(ts) {
  if (!running) return;
  const dt = Math.min(.05, (ts - lastT) / 1000); lastT = ts;
  if (G && !G.paused) { acc += dt * G.speed; let n = 0; while (acc >= 1 / 30 && n < 8) { step(1 / 30); acc -= 1 / 30; n++; } if (n >= 8) acc = 0; }
  if (G) {
    if (!G.paused) for (const f of G.fx) if (f.k === 'ping') f.t += 0; // ping'ler adımda ilerler
    if (G.fogDirty) { updateFog(); G.fogDirty = false; }
    scrollCam(dt); render();
    cardT -= dt; if (cardT <= 0) { cardT = .25; updateCard(); updateTop(); uiObjectives(); uiMsg(); drawMini(); }
  }
  requestAnimationFrame(frame);
}
function togglePause() { if (G.done) return; G.paused = !G.paused; $('pause').style.display = G.paused ? 'flex' : 'none'; }

/* ---------- ekran okları (basılı tut = kaydır) ---------- */
document.querySelectorAll('.nav[data-d]').forEach(el => {
  const [x, y] = el.dataset.d.split(',').map(Number);
  const on = e => { e.preventDefault(); navDir = { x, y }; }, off = () => { navDir = { x: 0, y: 0 }; };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
});
