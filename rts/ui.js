'use strict';
/* ====== FATİH — Arayüz, çizim, girdi ====== */
const cv = $('c'), ctx = cv.getContext('2d');
const mini = $('mini'), mctx = mini.getContext('2d');
let cam = { x: 0, y: 0, z: 1 }, mouse = { x: 0, y: 0, in: false, down: false, sx: 0, sy: 0, drag: false };
let place = null, amovePending = false, keys = {}, lastClick = { t: 0, id: 0 };
let terrainCv = null, cardSig = '', cardT = 0, running = false, lastT = 0, acc = 0;
const BAR_H = 160;

function resize() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener('resize', resize); resize();
const viewW = () => cv.width / cam.z, viewH = () => cv.height / cam.z;
const s2w = (sx, sy) => ({ x: sx / cam.z + cam.x, y: sy / cam.z + cam.y });
function clampCam() { cam.x = clamp(cam.x, 0, Math.max(0, G.W * TILE - viewW())); cam.y = clamp(cam.y, 0, Math.max(0, G.H * TILE - (cv.height - BAR_H) / cam.z)); }
function centerOn(x, y) { cam.x = x - viewW() / 2; cam.y = y - (cv.height - BAR_H) / cam.z / 2; clampCam(); }

/* ---------- arazi ön-çizimi ---------- */
function buildTerrain() {
  terrainCv = document.createElement('canvas'); terrainCv.width = G.W * TILE; terrainCv.height = G.H * TILE; const c = terrainCv.getContext('2d');
  const r = makeRng(G.m.seed + 7);
  for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) {
    const t = G.terrain[idx(x, y)], v = r();
    let col;
    if (t === 1) col = `hsl(205,${45 + v * 8}%,${30 + v * 6}%)`;
    else if (t === 2) col = `hsl(38,${28 + v * 8}%,${44 + v * 5}%)`;
    else if (t === 3) col = `hsl(45,${40 + v * 10}%,${62 + v * 6}%)`;
    else col = `hsl(${88 + v * 12},${34 + v * 8}%,${34 + v * 5}%)`;
    c.fillStyle = col; c.fillRect(x * TILE, y * TILE, TILE, TILE);
    if (t === 0 && v > .8) { c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(x * TILE + 4, y * TILE + 6, 10, 3); }
  }
  // kıyı
  c.fillStyle = 'rgba(255,255,255,.25)';
  for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) if (G.terrain[idx(x, y)] === 1) {
    if (x > 0 && G.terrain[idx(x - 1, y)] !== 1) c.fillRect(x * TILE, y * TILE, 3, TILE);
    if (x < G.W - 1 && G.terrain[idx(x + 1, y)] !== 1) c.fillRect(x * TILE + TILE - 3, y * TILE, 3, TILE);
    if (y > 0 && G.terrain[idx(x, y - 1)] !== 1) c.fillRect(x * TILE, y * TILE, TILE, 3);
    if (y < G.H - 1 && G.terrain[idx(x, y + 1)] !== 1) c.fillRect(x * TILE, y * TILE + TILE - 3, TILE, 3);
  }
  mini.width = G.W; mini.height = G.H;
  const ar = G.W / G.H, mw = Math.min(176, 136 * ar); mini.style.width = mw + 'px'; mini.style.height = (mw / ar) + 'px';
}

/* ---------- çizim ---------- */
function ell(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); }
function drawUnit(c, u) {
  const col = G.colors[u.owner], r = u.r, x = u.x, y = u.y, look = u.d.look;
  ell(c, x, y + r * .7, r * (look === 'sipahi' || look === 'sovalye' || look === 'hero' ? 1.5 : 1), r * .45, 'rgba(0,0,0,.28)');
  if (u.hit > 0) c.globalAlpha = .6;
  const rider = look === 'sipahi' || look === 'sovalye' || look === 'hero';
  if (rider) { ell(c, x, y + 2, r * 1.35, r * .85, look === 'sovalye' ? '#9aa0a8' : '#6b4a2b'); ell(c, x + Math.cos(u.face) * r, y + 2 + Math.sin(u.face) * r * .5, r * .5, r * .45, look === 'sovalye' ? '#9aa0a8' : '#6b4a2b'); }
  if (look === 'top' || look === 'sahi') {
    const L = look === 'sahi' ? 26 : 18; c.save(); c.translate(x, y); c.rotate(u.face);
    c.fillStyle = '#3a2a1a'; c.fillRect(-r, -r * .8, r * 2, r * 1.6);
    c.fillStyle = '#222'; c.fillRect(0, -(look === 'sahi' ? 6 : 4), L, look === 'sahi' ? 12 : 8); c.fillStyle = '#555'; c.fillRect(L - 3, -(look === 'sahi' ? 7 : 5), 4, look === 'sahi' ? 14 : 10);
    c.restore(); c.fillStyle = col; c.beginPath(); c.arc(x - r * .4, y, 4, 0, 7); c.fill();
  } else {
    const by = rider ? y - r * .5 : y;
    ell(c, x, by, r * .85, r * .85, look === 'sovalye' ? '#7d8590' : col);
    ell(c, x, by - r * .25, r * .5, r * .5, '#e8c9a0');
    c.lineWidth = 2;
    if (look === 'reaya') { c.fillStyle = '#7a5a2a'; c.beginPath(); c.arc(x, by - r * .5, r * .55, Math.PI, 0); c.fill(); }
    else if (look === 'azap') { c.fillStyle = '#f2f2f2'; c.beginPath(); c.arc(x, by - r * .55, r * .5, Math.PI, 0); c.fill(); c.strokeStyle = '#ddd'; c.beginPath(); c.moveTo(x + r, y + r); c.lineTo(x + r, y - r * 1.7); c.stroke(); c.fillStyle = '#8a5a2a'; c.beginPath(); c.arc(x - r * .8, y + 1, r * .45, 0, 7); c.fill(); }
    else if (look === 'okcu') { c.fillStyle = '#2d6a4f'; c.beginPath(); c.arc(x, by - r * .55, r * .5, Math.PI, 0); c.fill(); c.strokeStyle = '#d9c28f'; c.beginPath(); c.arc(x + Math.cos(u.face) * r, y + Math.sin(u.face) * r, r * .9, u.face - 1.1, u.face + 1.1); c.stroke(); }
    else if (look === 'yeniceri') { c.fillStyle = '#fff'; c.fillRect(x - r * .4, by - r * 1.5, r * .8, r * .9); c.fillStyle = '#c0392b'; c.fillRect(x - r * .4, by - r * 1.5, r * .8, 3); c.strokeStyle = '#333'; c.beginPath(); c.moveTo(x - Math.cos(u.face) * r * .3, y); c.lineTo(x + Math.cos(u.face) * r * 1.3, y + Math.sin(u.face) * r * 1.3); c.stroke(); }
    else if (look === 'sipahi') { c.strokeStyle = '#eee'; c.beginPath(); c.moveTo(x + r, y + r * .6); c.lineTo(x + r, y - r * 1.8); c.stroke(); c.fillStyle = col; c.fillRect(x + r, y - r * 1.8, 7, 5); }
    else if (look === 'sovalye') { c.strokeStyle = '#ddd'; c.beginPath(); c.moveTo(x + r, y + r * .6); c.lineTo(x + r, y - r * 1.4); c.stroke(); c.fillStyle = '#ddd'; c.fillRect(x - 3, by - r * .9, 6, 4); }
    else if (look === 'hero') { c.fillStyle = '#f5f5f5'; c.beginPath(); c.arc(x, by - r * .5, r * .65, Math.PI, 0); c.fill(); c.fillStyle = '#d4a017'; c.fillRect(x - r * .5, by - r * .55, r, 3); c.strokeStyle = '#d4a017'; c.lineWidth = 2; c.beginPath(); c.arc(x, y + 2, r * 1.4, 0, 7); c.stroke(); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(x + r * 1.1, y + r * .6); c.lineTo(x + r * 1.1, y - r * 2); c.stroke(); c.fillStyle = col; c.fillRect(x + r * 1.1, y - r * 2, 10, 7); }
  }
  c.globalAlpha = 1;
  if (u.carry && u.carry.amt > 0) { c.fillStyle = ['', '#4a7a2a', '#e0b020', '#c0405a'][u.carry.type]; c.fillRect(x - 3, y - r - 8, 6, 5); }
}
function drawBuilding(c, b) {
  const col = G.colors[b.owner], x0 = b.tx * TILE, y0 = b.ty * TILE, w = b.w * TILE, h = b.h * TILE, t = b.type;
  c.globalAlpha = b.built ? 1 : .55 + b.prog * .4; if (b.hit > 0) c.globalAlpha *= .7;
  const stone = '#c8b995', dark = '#7d6e55';
  if (t === 'tarla') { c.fillStyle = '#9b7a3a'; c.fillRect(x0 + 1, y0 + 1, w - 2, h - 2); c.strokeStyle = '#6b8e23'; c.lineWidth = 3; for (let i = 6; i < w; i += 9) { c.beginPath(); c.moveTo(x0 + i, y0 + 3); c.lineTo(x0 + i, y0 + h - 3); c.stroke(); } }
  else if (t === 'sur') { c.fillStyle = '#9a9488'; c.fillRect(x0, y0, w, h); c.strokeStyle = '#6f6a60'; c.lineWidth = 1; c.strokeRect(x0 + .5, y0 + .5, w - 1, h - 1); c.fillStyle = '#b3ad9f'; c.fillRect(x0 + 2, y0 + 2, w - 4, 6); }
  else if (t === 'kapi') { c.fillStyle = '#9a9488'; c.fillRect(x0, y0, w, h); c.fillStyle = '#5a3a1e'; c.fillRect(x0 + 6, y0 + 4, w - 12, h - 4); c.fillStyle = '#d4a017'; c.fillRect(x0 + w / 2 - 1, y0 + 8, 2, h - 12); }
  else if (t === 'burc' || t === 'kule') { const cx = x0 + w / 2, cy = y0 + h / 2; ell(c, cx, cy, w / 2 - 2, h / 2 - 2, '#a79f8e'); ell(c, cx, cy, w / 2 - 9, h / 2 - 9, '#6f6a60'); c.fillStyle = col; c.fillRect(cx - 2, cy - 14, 10, 6); c.fillStyle = '#ddd'; c.fillRect(cx - 3, cy - 18, 2, 14); }
  else if (t === 'ev') { c.fillStyle = stone; c.fillRect(x0 + 2, y0 + 4, w - 4, h - 6); c.fillStyle = '#a0522d'; c.beginPath(); c.moveTo(x0, y0 + h * .5); c.lineTo(x0 + w / 2, y0); c.lineTo(x0 + w, y0 + h * .5); c.fill(); c.fillStyle = '#5a3a1e'; c.fillRect(x0 + w / 2 - 4, y0 + h - 14, 8, 10); }
  else if (t === 'ambar') { c.fillStyle = '#8a6a3a'; c.fillRect(x0 + 2, y0 + 4, w - 4, h - 6); c.fillStyle = '#5a4020'; c.fillRect(x0 + 2, y0 + 4, w - 4, 8); c.fillStyle = '#d9c28f'; c.fillRect(x0 + w / 2 - 6, y0 + h / 2, 12, 10); }
  else if (t === 'ayasofya') {
    c.fillStyle = '#d8c9a3'; c.fillRect(x0 + 4, y0 + 4, w - 8, h - 8); c.strokeStyle = dark; c.lineWidth = 2; c.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
    ell(c, x0 + w / 2, y0 + h / 2, w * .3, h * .3, '#8c7b5a'); ell(c, x0 + w / 2, y0 + h / 2 - 3, w * .24, h * .24, '#b5a37a');
    for (const [mx, my] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { c.fillStyle = '#efe6cf'; c.fillRect(x0 + mx * (w - 12), y0 + my * (h - 12), 12, 12); c.fillStyle = '#9a8a66'; c.fillRect(x0 + mx * (w - 12) + 4, y0 + my * (h - 12) + 4, 4, 4); }
    if (G.flags.captured) { c.fillStyle = G.colors[0]; c.fillRect(x0 + w / 2, y0 - 26, 26, 16); c.fillStyle = '#ddd'; c.fillRect(x0 + w / 2 - 2, y0 - 28, 2, 36); c.fillStyle = '#fff'; c.font = '12px sans-serif'; c.fillText('☪', x0 + w / 2 + 7, y0 - 14); }
  }
  else {
    c.fillStyle = t === 'kale' || t === 'hisar' ? '#a79f8e' : stone; c.fillRect(x0 + 2, y0 + 2, w - 4, h - 4); c.strokeStyle = dark; c.lineWidth = 2; c.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);
    c.fillStyle = col; c.fillRect(x0 + 6, y0 + 6, w - 12, 8);
    const cx = x0 + w / 2, cy = y0 + h / 2 + 4;
    if (t === 'saray' || t === 'kamp') { ell(c, cx, cy, w * .22, h * .22, t === 'saray' ? '#2a8f8a' : '#c8c0a8'); c.fillStyle = '#f2c94c'; c.font = 'bold 18px serif'; c.textAlign = 'center'; c.fillText(t === 'saray' ? '☪' : '⚑', cx, cy + 6); c.textAlign = 'left'; }
    else if (t === 'kale' || t === 'hisar') { for (const [mx, my] of [[0, 0], [1, 0], [0, 1], [1, 1]]) ell(c, x0 + 10 + mx * (w - 20), y0 + 10 + my * (h - 20), 11, 11, '#8f8778'); ell(c, cx, cy, w * .2, h * .2, '#6f6a60'); }
    else { c.strokeStyle = '#444'; c.lineWidth = 3; c.beginPath(); if (t === 'kisla') { c.moveTo(cx - 14, cy - 10); c.lineTo(cx + 14, cy + 14); c.moveTo(cx + 14, cy - 10); c.lineTo(cx - 14, cy + 14); } else if (t === 'ahir') { c.arc(cx, cy, 11, .3, Math.PI - .3, false); c.stroke(); c.beginPath(); c.moveTo(cx - 10, cy); c.lineTo(cx - 10, cy - 12); c.moveTo(cx + 10, cy); c.lineTo(cx + 10, cy - 12); } else if (t === 'ocak') { c.fillStyle = '#c0392b'; c.fillRect(cx - 8, cy - 16, 16, 10); c.fillStyle = '#fff'; c.fillRect(cx - 8, cy - 16, 16, 4); c.moveTo(cx, cy - 6); c.lineTo(cx, cy + 14); } else if (t === 'dokum') { c.fillStyle = '#222'; c.fillRect(cx - 14, cy - 5, 28, 10); ell(c, cx - 8, cy + 8, 6, 6, '#3a2a1a'); } c.stroke(); }
  }
  c.globalAlpha = 1;
  if (!b.built) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x0, y0 + h + 2, w, 5); c.fillStyle = '#e8b030'; c.fillRect(x0, y0 + h + 2, w * b.prog, 5); c.strokeStyle = 'rgba(80,50,20,.7)'; c.lineWidth = 2; c.strokeRect(x0 + 3, y0 + 3, w - 6, h - 6); }
}
function bar(c, x, y, w, f, col) { c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 5); c.fillStyle = col || (f > .5 ? '#4caf50' : f > .25 ? '#e0b020' : '#d83a3a'); c.fillRect(x - w / 2, y, w * clamp(f, 0, 1), 3); }

function render() {
  const c = ctx, W = cv.width, H = cv.height;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.save(); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
  c.drawImage(terrainCv, 0, 0);
  const x0 = Math.max(0, (cam.x / TILE) | 0), y0 = Math.max(0, (cam.y / TILE) | 0), x1 = Math.min(G.W - 1, ((cam.x + viewW()) / TILE) | 0), y1 = Math.min(G.H - 1, ((cam.y + viewH()) / TILE) | 0);
  // kaynaklar
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = idx(x, y), r = G.res[i]; if (!r) continue; if (!G.exp[i]) continue; const px = x * TILE, py = y * TILE;
    if (r === 1) { ell(c, px + 16, py + 28, 11, 4, 'rgba(0,0,0,.25)'); c.fillStyle = '#4a321c'; c.fillRect(px + 14, py + 16, 4, 12); ell(c, px + 16, py + 12, 13, 12, '#2f6b2f'); ell(c, px + 13, py + 9, 7, 6, '#3f8a3f'); }
    else if (r === 2) { c.fillStyle = '#7d7468'; c.beginPath(); c.moveTo(px + 3, py + 28); c.lineTo(px + 10, py + 7); c.lineTo(px + 24, py + 9); c.lineTo(px + 30, py + 28); c.fill(); c.fillStyle = '#f2c230'; ell(c, px + 13, py + 17, 4, 3, '#f2c230'); ell(c, px + 22, py + 20, 3, 3, '#ffd84d'); ell(c, px + 17, py + 12, 3, 2, '#ffd84d'); }
    else if (r === 3) { ell(c, px + 16, py + 17, 10, 8, '#2f6b2f'); for (const [dx, dy] of [[10, 14], [18, 12], [15, 20], [22, 18]]) ell(c, px + dx, py + dy, 2.5, 2.5, '#c0405a'); }
  }
  // inşaat alanı
  if (G.m.zone && !G.blds.some(b => b.type === 'hisar' && b.owner === 0)) { const z = G.m.zone; c.strokeStyle = 'rgba(255,215,90,.9)'; c.setLineDash([10, 8]); c.lineWidth = 3; c.strokeRect(z.x0 * TILE, z.y0 * TILE, (z.x1 - z.x0 + 1) * TILE, (z.y1 - z.y0 + 1) * TILE); c.setLineDash([]); c.fillStyle = 'rgba(255,215,90,.12)'; c.fillRect(z.x0 * TILE, z.y0 * TILE, (z.x1 - z.x0 + 1) * TILE, (z.y1 - z.y0 + 1) * TILE); c.fillStyle = '#ffe08a'; c.font = 'bold 14px sans-serif'; c.fillText('HİSAR İNŞAAT ALANI', z.x0 * TILE + 8, z.y0 * TILE + 20); }
  // binalar ve birimler (y sıralı)
  const list = [];
  for (const b of G.blds) if (!b.dead) { if (b.owner !== 0 && !expAt(b.x, b.y)) continue; list.push(b); }
  for (const u of G.ents) if (u.kind === 'u' && !u.dead) { if (u.owner !== 0 && !visAt(u.x, u.y)) continue; if (u.x < cam.x - 40 || u.x > cam.x + viewW() + 40 || u.y < cam.y - 40 || u.y > cam.y + viewH() + 40) continue; list.push(u); }
  list.sort((a, b) => (a.kind === 'b' ? a.ty * TILE : a.y) - (b.kind === 'b' ? b.ty * TILE : b.y) - (a.kind === 'b' ? -1000 : 0) * 0);
  const bl = list.filter(e => e.kind === 'b'), ul = list.filter(e => e.kind === 'u');
  for (const b of bl) drawBuilding(c, b);
  for (const u of ul) drawUnit(c, u);
  // seçim ve sağlık çubukları
  for (const e of G.sel) { if (e.dead) continue; c.strokeStyle = e.owner === 0 ? '#5cff7a' : '#ff5c5c'; c.lineWidth = 2; if (e.kind === 'u') { c.beginPath(); c.ellipse(e.x, e.y + e.r * .5, e.r + 4, e.r * .7 + 3, 0, 0, 7); c.stroke(); } else c.strokeRect(e.tx * TILE - 1, e.ty * TILE - 1, e.w * TILE + 2, e.h * TILE + 2); if (e.owner === 0 && e.rally && e.kind === 'b') { c.fillStyle = '#5cff7a'; c.fillRect(e.rally.x - 1, e.rally.y - 14, 2, 14); c.fillRect(e.rally.x, e.rally.y - 14, 9, 6); } }
  for (const e of list) { if (e.hp < e.maxhp || G.sel.includes(e)) { if (e.d.landmark) continue; if (e.kind === 'u') bar(c, e.x, e.y - e.r - 8, 22, e.hp / e.maxhp); else bar(c, e.x, e.ty * TILE - 8, Math.min(e.w * TILE, 70), e.hp / e.maxhp); } if (e.kind === 'b' && e.queue.length && e.owner === 0) bar(c, e.x, e.ty * TILE - 14, 40, e.queue[0].t / UNITS[e.queue[0].type].time, '#4aa3ff'); }
  // mermiler
  for (const p of G.proj) {
    if (p.owner !== 0 && !visAt(p.x, p.y) && !visAt(p.tx, p.ty)) continue;
    if (p.kind === 'ball') { ell(c, p.x, p.y, 5, 5, '#222'); } else if (p.kind === 'shot') { c.fillStyle = '#ffd24d'; c.fillRect(p.x - 2, p.y - 2, 4, 4); } else { c.strokeStyle = '#e8d8a8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - Math.cos(p.ang) * 10, p.y - Math.sin(p.ang) * 10); c.stroke(); }
  }
  for (const f of G.fx) {
    const a = 1 - f.t / f.life;
    if (f.k === 'blood') { c.fillStyle = `rgba(110,20,20,${.5 * a})`; c.beginPath(); c.arc(f.x, f.y, 6, 0, 7); c.fill(); }
    else if (f.k === 'puff') { c.fillStyle = `rgba(90,80,70,${.6 * a})`; c.beginPath(); c.arc(f.x, f.y - f.t * 20, f.r * (1 + f.t), 0, 7); c.fill(); }
    else if (f.k === 'boom') { c.fillStyle = `rgba(255,170,40,${.8 * a})`; c.beginPath(); c.arc(f.x, f.y, f.r * (.4 + f.t * 1.2), 0, 7); c.fill(); c.fillStyle = `rgba(60,50,40,${.5 * a})`; c.beginPath(); c.arc(f.x, f.y - f.t * 25, f.r * .6, 0, 7); c.fill(); }
  }
  // yerleştirme hayaleti
  if (place && mouse.in) {
    const w = s2w(mouse.x, mouse.y), d = BUILDS[place.type]; const tx = Math.floor(w.x / TILE - d.w / 2 + .5), ty = Math.floor(w.y / TILE - d.h / 2 + .5); place.tx = tx; place.ty = ty; place.ok = canPlace(place.type, tx, ty);
    c.fillStyle = place.ok ? 'rgba(80,255,120,.4)' : 'rgba(255,70,70,.45)'; c.fillRect(tx * TILE, ty * TILE, d.w * TILE, d.h * TILE); c.strokeStyle = place.ok ? '#5cff7a' : '#ff5c5c'; c.lineWidth = 2; c.strokeRect(tx * TILE, ty * TILE, d.w * TILE, d.h * TILE);
    if (d.atk) { c.strokeStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc((tx + d.w / 2) * TILE, (ty + d.h / 2) * TILE, d.range, 0, 7); c.stroke(); }
  }
  // sis
  if (!G.m.noFog) for (let y = y0; y <= y1; y++) { for (let x = x0; x <= x1; x++) { const i = idx(x, y); if (G.vis[i]) continue; c.fillStyle = G.exp[i] ? 'rgba(0,0,0,.5)' : '#000'; c.fillRect(x * TILE, y * TILE, TILE + .5, TILE + .5); } }
  c.restore();
  // sürükleme kutusu
  if (mouse.down && mouse.drag && !place) { c.strokeStyle = '#5cff7a'; c.lineWidth = 1; c.strokeRect(mouse.sx, mouse.sy, mouse.x - mouse.sx, mouse.y - mouse.sy); c.fillStyle = 'rgba(92,255,122,.1)'; c.fillRect(mouse.sx, mouse.sy, mouse.x - mouse.sx, mouse.y - mouse.sy); }
  if (amovePending) { c.fillStyle = '#ff7a5c'; c.font = 'bold 14px sans-serif'; c.fillText('Saldırarak ilerle: hedefe tıkla (Esc iptal)', mouse.x + 14, mouse.y - 8); }
  if (place) { c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.fillText(BUILDS[place.type].name + ' — yerleştirmek için tıkla (Esc iptal, Shift: devam)', mouse.x + 14, mouse.y - 8); }
}

/* ---------- mini harita ---------- */
function drawMini() {
  const W = G.W, H = G.H, img = mctx.createImageData(W, H), d = img.data;
  for (let i = 0; i < W * H; i++) {
    let r, g, b; const t = G.terrain[i], res = G.res[i];
    if (t === 1) { r = 40; g = 90; b = 140; } else if (t === 2) { r = 130; g = 110; b = 70; } else { r = 70; g = 110; b = 50; }
    if (res === 1) { r = 30; g = 70; b = 30; } else if (res === 2) { r = 240; g = 200; b = 40; }
    if (!G.m.noFog) { if (!G.exp[i]) { r = g = b = 0; } else if (!G.vis[i]) { r *= .55; g *= .55; b *= .55; } }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  for (const bl of G.blds) { if (bl.owner !== 0 && !expAt(bl.x, bl.y)) continue; const col = bl.owner === 0 ? [90, 170, 255] : bl.d.landmark ? [255, 240, 160] : [255, 70, 70]; for (let y = bl.ty; y < bl.ty + bl.h; y++) for (let x = bl.tx; x < bl.tx + bl.w; x++) { const i = idx(x, y) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; } }
  for (const u of G.ents) { if (u.kind !== 'u' || u.dead) continue; if (u.owner !== 0 && !visAt(u.x, u.y)) continue; const i = idx(clamp((u.x / TILE) | 0, 0, W - 1), clamp((u.y / TILE) | 0, 0, H - 1)) * 4; if (u.owner === 0) { d[i] = 80; d[i + 1] = 255; d[i + 2] = 120; } else { d[i] = 255; d[i + 1] = 40; d[i + 2] = 40; } }
  mctx.putImageData(img, 0, 0);
  mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.strokeRect(cam.x / TILE, cam.y / TILE, viewW() / TILE, (cv.height - BAR_H) / cam.z / TILE);
}

/* ---------- yerleştirme ---------- */
function canPlace(type, tx, ty) {
  const d = BUILDS[type];
  for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) { if (!inb(x, y)) return false; const i = idx(x, y); if (G.blkT[i] || G.occ[i] || !G.exp[i] && !G.m.noFog) return false; }
  if (d.zone) { const z = G.m.zone; if (!z || tx < z.x0 || ty < z.y0 || tx + d.w - 1 > z.x1 || ty + d.h - 1 > z.y1) return false; }
  return true;
}
function tryPlace(shift) {
  const t = place.type, d = BUILDS[t], p = G.players[0];
  if (!place.ok) { msg(d.zone ? 'Hisar yalnızca işaretli alana kurulabilir.' : 'Buraya inşa edilemez.', 'warn'); return; }
  if (!afford(p, d.cost)) { msg('Yetersiz kaynak!', 'warn'); return; }
  const vills = G.sel.filter(e => e.kind === 'u' && e.d.worker && e.owner === 0); if (!vills.length) { place = null; return; }
  pay(p, d.cost); const b = addBuilding(t, 0, place.tx, place.ty, { built: false });
  for (const v of vills) orderBuild(v, b);
  if (!shift || !afford(p, d.cost)) place = null; cardSig = '';
}

/* ---------- komutlar ---------- */
function entAt(wx, wy, ownOnly) {
  let best = null, bd = 1e9;
  for (const u of G.ents) { if (u.kind !== 'u' || u.dead) continue; if (u.owner !== 0 && !visAt(u.x, u.y)) continue; if (ownOnly && u.owner !== 0) continue; const d = Math.hypot(u.x - wx, u.y - wy); if (d <= u.r + 6 && d < bd) { bd = d; best = u; } }
  if (best) return best;
  for (const b of G.blds) { if (b.dead || b.d.landmark && ownOnly) continue; if (ownOnly && b.owner !== 0) continue; if (b.owner !== 0 && !expAt(b.x, b.y)) continue; if (wx >= b.tx * TILE && wx <= (b.tx + b.w) * TILE && wy >= b.ty * TILE && wy <= (b.ty + b.h) * TILE) return b; }
  return null;
}
function selectUnits(list, add) {
  if (add) { for (const e of list) if (!G.sel.includes(e)) G.sel.push(e); } else G.sel = list.slice();
  cardSig = ''; updateCard();
}
function mySel() { return G.sel.filter(e => !e.dead && e.owner === 0); }
function commandAt(wx, wy) {
  const sel = mySel().filter(e => e.kind === 'u'); const bsel = mySel().filter(e => e.kind === 'b' && e.d.trains);
  if (!sel.length) { if (bsel.length) { for (const b of bsel) b.rally = { x: wx, y: wy }; fx(wx, wy); } return; }
  const t = entAt(wx, wy, false); const tx = (wx / TILE) | 0, ty = (wy / TILE) | 0;
  if (t && t.owner !== 0 && !t.d.landmark) { for (const u of sel) if (u.atk) orderAttack(u, t); else orderMove(u, wx, wy); fx(t.x, t.y, '#ff5c5c'); return; }
  if (t && t.owner === 0 && t.kind === 'b') {
    if (!t.built) { for (const u of sel) if (u.d.worker) orderBuild(u, t); else orderMove(u, t.x, t.y + t.h * 16 + 20); fx(t.x, t.y); return; }
    if (t.d.farm) { for (const u of sel) if (u.d.worker) orderFarm(u, t); fx(t.x, t.y); return; }
  }
  if (inb(tx, ty) && G.res[idx(tx, ty)] && G.exp[idx(tx, ty)] && sel.some(u => u.d.worker)) { for (const u of sel) if (u.d.worker) orderGather(u, tx, ty); else orderMove(u, wx, wy); fx(wx, wy, '#ffd24d'); return; }
  moveGroup(sel, wx, wy); fx(wx, wy);
}
function moveGroup(sel, wx, wy) {
  const n = sel.length, cols = Math.ceil(Math.sqrt(n)), sp = 26;
  sel.forEach((u, i) => { const gx = (i % cols) - (cols - 1) / 2, gy = Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2; let x = wx + gx * sp, y = wy + gy * sp; const ti = idx(clamp((x / TILE) | 0, 0, G.W - 1), clamp((y / TILE) | 0, 0, G.H - 1)); if (G.blkT[ti] || G.occ[ti]) { x = wx; y = wy; } if (amovePending) orderAmove(u, x, y); else orderMove(u, x, y); });
}
function fx(x, y, col) { G.fx.push({ k: 'ping', x, y, t: 0, life: .4, col: col || '#5cff7a' }); }
const origRender = render;

/* ---------- girdi ---------- */
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (!G || G.done) return; mouse.x = e.offsetX; mouse.y = e.offsetY;
  if (e.button === 2) { if (place) { place = null; return; } if (amovePending) { amovePending = false; return; } const w = s2w(mouse.x, mouse.y); commandAt(w.x, w.y); return; }
  mouse.down = true; mouse.sx = mouse.x; mouse.sy = mouse.y; mouse.drag = false;
});
cv.addEventListener('mousemove', e => { mouse.x = e.offsetX; mouse.y = e.offsetY; mouse.in = true; if (mouse.down && Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy) > 6) mouse.drag = true; });
cv.addEventListener('mouseleave', () => { mouse.in = false; mouse.down = false; });
addEventListener('mouseup', e => {
  if (!G || e.button !== 0 || !mouse.down) return; mouse.down = false;
  if (G.done) return;
  const shift = e.shiftKey;
  if (place) { if (!mouse.drag) tryPlace(shift); mouse.drag = false; return; }
  if (amovePending && !mouse.drag) { const w = s2w(mouse.x, mouse.y); const sel = mySel().filter(u => u.kind === 'u'); moveGroup(sel, w.x, w.y); amovePending = false; fx(w.x, w.y, '#ff7a5c'); return; }
  if (mouse.drag) {
    const a = s2w(Math.min(mouse.sx, mouse.x), Math.min(mouse.sy, mouse.y)), b = s2w(Math.max(mouse.sx, mouse.x), Math.max(mouse.sy, mouse.y));
    const us = G.ents.filter(u => u.kind === 'u' && !u.dead && u.owner === 0 && u.x >= a.x && u.x <= b.x && u.y >= a.y && u.y <= b.y);
    if (us.length) selectUnits(us, shift);
  } else {
    const w = s2w(mouse.x, mouse.y), t = entAt(w.x, w.y, false);
    if (t) {
      if (t.owner === 0 && t.kind === 'u' && lastClick.id === t.id && performance.now() - lastClick.t < 400) { selectUnits(G.ents.filter(u => u.kind === 'u' && !u.dead && u.owner === 0 && u.type === t.type && u.x > cam.x && u.x < cam.x + viewW() && u.y > cam.y && u.y < cam.y + viewH()), shift); }
      else if (shift && t.owner === 0) selectUnits([t], true); else selectUnits([t]);
      lastClick = { t: performance.now(), id: t.id };
    } else if (!shift) selectUnits([]);
  }
  mouse.drag = false;
});
cv.addEventListener('wheel', e => { e.preventDefault(); const before = s2w(e.offsetX, e.offsetY); cam.z = clamp(cam.z * (e.deltaY < 0 ? 1.1 : .91), .55, 1.6); const after = s2w(e.offsetX, e.offsetY); cam.x += before.x - after.x; cam.y += before.y - after.y; clampCam(); }, { passive: false });
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true; if (!G || !running) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (place) place = null; else if (amovePending) amovePending = false; else togglePause(); return; }
  if (k === 'p') { togglePause(); return; }
  if (k === 'h' && G.hero && !G.hero.dead) { selectUnits([G.hero]); centerOn(G.hero.x, G.hero.y); return; }
  if (k === ' ') { e.preventDefault(); const s = mySel(); if (s.length) centerOn(s[0].x, s[0].y); else if (G.hero) centerOn(G.hero.x, G.hero.y); return; }
  if (k === '.' || k === '>') { G.speed = Math.min(4, G.speed + 1); uiSpeed(); return; }
  if (k === ',' || k === '<') { G.speed = Math.max(1, G.speed - 1); uiSpeed(); return; }
  if (/^[0-9]$/.test(k)) { if (e.ctrlKey) { e.preventDefault(); G.groups[k] = mySel().slice(); msg('Grup ' + k + ' atandı.'); } else if (G.groups[k]) { const g = G.groups[k].filter(x => !x.dead); selectUnits(g); if (g.length && performance.now() - (G.groups['t' + k] || 0) < 350) centerOn(g[0].x, g[0].y); G.groups['t' + k] = performance.now(); } return; }
  const btn = cardBtns.find(b => b.key === k && !b.dis); if (btn && !e.ctrlKey) btn.fn();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
mini.addEventListener('mousedown', e => { if (!G) return; mini._d = true; miniClick(e); });
mini.addEventListener('mousemove', e => { if (mini._d) miniClick(e); });
addEventListener('mouseup', () => { mini._d = false; });
mini.addEventListener('contextmenu', e => { e.preventDefault(); const r = mini.getBoundingClientRect(); const sel = mySel().filter(u => u.kind === 'u'); if (sel.length) { moveGroup(sel, (e.clientX - r.left) / r.width * G.W * TILE, (e.clientY - r.top) / r.height * G.H * TILE); } });
function miniClick(e) { if (e.button === 2) return; const r = mini.getBoundingClientRect(); centerOn((e.clientX - r.left) / r.width * G.W * TILE, (e.clientY - r.top) / r.height * G.H * TILE); }

function scrollCam(dt) {
  const sp = 700 * dt / cam.z; let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1; if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
  if (mouse.in && !mouse.down && !place) { if (mouse.x < 6) dx -= 1; if (mouse.x > cv.width - 6) dx += 1; if (mouse.y < 6) dy -= 1; }
  cam.x += dx * sp; cam.y += dy * sp; clampCam();
}

/* ---------- HUD ---------- */
let cardBtns = [];
function uiMsg() { $('log').innerHTML = G.msgs.map(m => `<div class="m ${m.cls}">${m.text}</div>`).join(''); }
function uiObjectives() {
  const m = G.m; $('objs').innerHTML = `<h4>${m.title}</h4>` + m.objectives.filter(o => !o.hidden || o.ok).map(o => `<div class="${o.ok ? 'ok' : ''}">${o.ok ? '✔' : '◻'} ${o.text}${!o.ok && o.prog ? ' <b>' + o.prog() + '</b>' : ''}</div>`).join('') + (m.timeLimit ? `<div class="tl">⏳ Kalan: ${fmtT(Math.max(0, m.timeLimit - G.t))}</div>` : '');
}
const fmtT = s => ((s / 60) | 0) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function uiSpeed() { $('spd').textContent = G.speed + 'x'; }
function uiBeep() { }
function updateTop() {
  const p = G.players[0]; $('rf').textContent = Math.floor(p.f); $('rw').textContent = Math.floor(p.w); $('rg').textContent = Math.floor(p.g); $('rp').textContent = p.pop + '/' + p.cap; $('rt').textContent = fmtT(G.t);
  $('rp').style.color = p.pop >= p.cap ? '#ff7a5c' : '';
}
function btn(label, key, fn, cost, tip, dis) { cardBtns.push({ label, key, fn, cost, tip, dis }); }
function buildCard() {
  cardBtns = []; const s = mySel(), p = G.players[0];
  const units = s.filter(e => e.kind === 'u'), blds = s.filter(e => e.kind === 'b');
  const av = G.m.avail;
  if (units.some(u => u.d.worker)) {
    const hk = ['q', 'w', 'e', 'r', 'a', 'f', 'z', 'x', 'c']; let i = 0;
    for (const t of av.build) { const d = BUILDS[t]; const dis = !afford(p, d.cost) || (d.req && !hasBuilt(0, d.req)); btn(d.name, hk[i++], () => { if (!afford(p, d.cost)) { msg('Yetersiz kaynak!', 'warn'); return; } if (d.req && !hasBuilt(0, d.req)) { msg(BUILDS[d.req].name + ' gerekli.', 'warn'); return; } place = { type: t }; amovePending = false; }, d.cost, d.desc + (d.req ? ' (' + BUILDS[d.req].name + ' gerekir)' : ''), dis); }
  }
  if (units.some(u => u.atk && !u.d.worker)) {
    btn('Saldır-ilerle', 'v', () => { amovePending = true; place = null; }, null, 'Hedefe giderken karşılaştığın düşmana saldır');
    btn('Dur', 's', () => { units.forEach(orderStop); }, null, 'Tüm emirleri iptal et');
    btn('Mevzi', 'h', () => { units.forEach(u => { orderStop(u); u.hold = true; }); msg('Mevzi alındı: birlikler yerinde durup menzildekilere saldırır.'); }, null, 'Yerinde dur, kovalamadan ateş et');
  } else if (units.length) btn('Dur', 's', () => { units.forEach(orderStop); });
  if (blds.length === 1 && blds[0].built && blds[0].d.trains) {
    const b = blds[0]; const hk = ['q', 'w', 'e', 'r']; let i = 0;
    for (const t of b.d.trains) { if (!av.train.includes(t)) continue; const d = UNITS[t]; const dis = !afford(p, d.cost) || p.pop + d.pop > p.cap; btn(d.name, hk[i++], () => { queueTrain(b, t); cardSig = ''; }, d.cost, d.desc + ' (' + d.pop + ' nüfus, ' + d.time + ' sn)', dis); }
  }
}
function updateCard() {
  const s = mySel(); const sig = G.sel.map(e => e.id).join(',') + '|' + (place ? 1 : 0) + '|' + G.players[0].f + G.players[0].w + G.players[0].g + '|' + G.players[0].pop + '|' + G.blds.filter(b => b.owner === 0 && b.built).length;
  if (sig !== cardSig) {
    cardSig = sig; buildCard(); const el = $('card'); el.innerHTML = '';
    cardBtns.forEach(b => { const d = document.createElement('button'); d.className = 'cb' + (b.dis ? ' dis' : ''); d.innerHTML = `<span class="k">${(b.key || '').toUpperCase()}</span>${b.label}${b.cost ? `<small>${costShort(b.cost)}</small>` : ''}`; d.title = (b.tip || '') + (b.cost ? '\n' + sfmt(b.cost) : ''); d.onclick = () => b.fn(); el.appendChild(d); });
  }
  // bilgi paneli
  const info = $('info'); const one = G.sel.length === 1 ? G.sel[0] : null;
  if (!G.sel.length) info.innerHTML = '<div class="hint">Birim seç: tıkla veya kutu çiz.<br>Sağ tık: hareket / saldırı / kaynak topla.<br><b>H</b>: Sultan\'a git — <b>Boşluk</b>: seçime git</div>';
  else if (one) {
    const d = one.d; let h = `<h3>${one.name}</h3><div class="hp"><i style="width:${Math.max(0, one.hp / one.maxhp * 100)}%"></i></div><div>Can: ${Math.ceil(one.hp)} / ${one.maxhp}</div>`;
    if (one.kind === 'u') { h += `<div>Saldırı: ${d.atk}${d.bonus ? ' (+' + Object.entries(d.bonus).map(([k, v]) => v + ' ' + { cav: 'atlı', arc: 'okçu' }[k]).join(',') + ')' : ''} · Zırh: ${d.armor}</div><div>Menzil: ${d.range ? Math.round(d.range / TILE) + ' kare' : 'yakın'} · Hız: ${d.speed}</div>`; if (one.carry && one.carry.amt) h += `<div>Taşıyor: ${one.carry.amt}</div>`; if (one.aura) h += '<div class="g">Komutan etkisi: +%20 saldırı</div>'; h += `<div class="d">${one.desc || d.desc || ""}</div>`; }
    else { if (!one.built) h += `<div>İnşaat: %${Math.floor(one.prog * 100)}</div>`; else if (one.queue.length) h += '<div>Üretim: ' + one.queue.map((q, i) => `<span class="q" data-i="${i}" title="İptal et">${UNITS[q.type].name}${i === 0 ? ' %' + Math.floor(q.t / UNITS[q.type].time * 100) : ''}</span>`).join(' ') + '</div>'; if (one.owner === 0 && one.d.trains) h += '<div class="d">Sağ tık: toplanma noktası belirle</div>'; if (one.d.desc) h += `<div class="d">${one.d.desc}</div>`; }
    info.innerHTML = h;
    info.querySelectorAll('.q').forEach(q => q.onclick = () => { const i = +q.dataset.i, it = one.queue[i]; if (!it) return; one.queue.splice(i, 1); const c = UNITS[it.type].cost; G.players[0].f += c.f || 0; G.players[0].w += c.w || 0; G.players[0].g += c.g || 0; });
  } else {
    const cnt = {}; G.sel.forEach(e => cnt[e.name] = (cnt[e.name] || 0) + 1);
    info.innerHTML = `<h3>${G.sel.length} birim</h3>` + Object.entries(cnt).map(([k, v]) => `<div>${v} × ${k}</div>`).join('');
  }
}
const costShort = c => Object.entries(c).map(([k, v]) => ({ f: '🌾', w: '🪵', g: '🪙' }[k]) + v).join(' ');

/* ---------- döngü ---------- */
function frame(ts) {
  if (!running) return;
  const dt = Math.min(.05, (ts - lastT) / 1000); lastT = ts;
  if (G && !G.paused) { acc += dt * G.speed; let n = 0; while (acc >= 1 / 30 && n < 8) { step(1 / 30); acc -= 1 / 30; n++; } if (n >= 8) acc = 0; }
  if (G) {
    scrollCam(dt); render();
    for (const f of G.fx) if (f.k === 'ping') { const a = 1 - f.t / f.life; ctx.save(); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y); ctx.strokeStyle = f.col; ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - a) * 14, 0, 7); ctx.stroke(); ctx.restore(); }
    if (G.dirtyMini) { drawMini(); G.dirtyMini = false; } else { /* kamera çerçevesi için sık güncelle */ }
    cardT -= dt; if (cardT <= 0) { cardT = .25; updateCard(); updateTop(); uiObjectives(); uiMsg(); drawMini(); }
  }
  requestAnimationFrame(frame);
}
function togglePause() { if (G.done) return; G.paused = !G.paused; $('pause').style.display = G.paused ? 'flex' : 'none'; }
