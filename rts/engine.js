'use strict';
/* ====== FATİH — Oyun Motoru ====== */
const TILE = 32;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const RESN = { f: 'Yiyecek', w: 'Odun', g: 'Altın' };

const UNITS = {
  reaya: { name: 'Reaya', look: 'reaya', cls: 'civ', hp: 35, atk: 3, range: 0, speed: 62, rate: 1.6, armor: 0, cost: { f: 50 }, pop: 1, time: 12, vision: 6, r: 9, worker: true, bm: .2, desc: 'İşçi. Kaynak toplar, bina inşa eder.' },
  azap: { name: 'Azap', look: 'azap', cls: 'inf', hp: 60, atk: 7, range: 0, speed: 60, rate: 1.2, armor: 1, cost: { f: 50, w: 25 }, pop: 1, time: 14, vision: 6, r: 9, bonus: { cav: 8 }, bm: .35, desc: 'Hafif piyade. Atlılara karşı güçlü.' },
  okcu: { name: 'Okçu', look: 'okcu', cls: 'arc', hp: 38, atk: 7, range: 160, speed: 62, rate: 1.4, armor: 0, cost: { w: 45, g: 25 }, pop: 1, time: 16, vision: 7, r: 9, proj: 'arrow', bm: .08, desc: 'Menzilli. Atlılara karşı zayıf.' },
  sipahi: { name: 'Sipahi', look: 'sipahi', cls: 'cav', hp: 100, atk: 10, range: 0, speed: 112, rate: 1.2, armor: 2, cost: { f: 70, g: 40 }, pop: 2, time: 20, vision: 7, r: 11, bonus: { arc: 6 }, bm: .3, desc: 'Süvari. Okçulara karşı güçlü.' },
  yeniceri: { name: 'Yeniçeri', look: 'yeniceri', cls: 'inf', hp: 65, atk: 14, range: 192, speed: 58, rate: 2.0, armor: 2, cost: { f: 60, g: 70 }, pop: 1, time: 22, vision: 7, r: 9, proj: 'shot', bm: .25, desc: 'Kapıkulu tüfekli piyadesi. Güçlü menzilli saldırı.' },
  sovalye: { name: 'Şövalye', look: 'sovalye', cls: 'cav', hp: 130, atk: 13, range: 0, speed: 92, rate: 1.3, armor: 3, cost: { f: 90, g: 60 }, pop: 2, time: 24, vision: 6, r: 11, bonus: { arc: 5 }, bm: .3, desc: 'Ağır zırhlı süvari.' },
  top: { name: 'Balyemez Topu', look: 'top', cls: 'sie', hp: 120, atk: 85, range: 256, speed: 32, rate: 5, armor: 1, cost: { w: 150, g: 120 }, pop: 3, time: 40, vision: 6, r: 12, proj: 'ball', splash: 44, bm: 3, desc: 'Kuşatma topu. Surlara ve binalara ağır hasar verir.' },
  sahi: { name: 'Şahi Topu', look: 'sahi', cls: 'sie', hp: 160, atk: 230, range: 352, speed: 24, rate: 9, armor: 1, cost: { w: 350, g: 350 }, pop: 5, time: 70, vision: 6, r: 15, proj: 'ball', splash: 60, bm: 3.5, desc: 'Orban\'ın döktüğü dev top. Sur yıkıcı.' },
  fatih: { name: 'Fatih Sultan Mehmed', look: 'hero', cls: 'hero', hp: 700, atk: 22, range: 0, speed: 98, rate: 1.0, armor: 3, cost: {}, pop: 0, vision: 8, r: 12, bm: .5, hero: true, bonus: { arc: 6 }, desc: 'Komutan. Çevresindeki askerlere +%20 saldırı gücü verir. Ölürse görev kaybedilir.' },
  komutan: { name: 'Komutan', look: 'hero', cls: 'hero', hp: 380, atk: 18, range: 0, speed: 94, rate: 1.1, armor: 3, cost: {}, pop: 0, vision: 8, r: 12, bm: .5, hero: true, desc: 'Düşman komutanı.' },
};

const BUILDS = {
  saray: { name: 'Saray', w: 3, h: 3, hp: 1800, cost: {}, time: 0, pop: 10, drop: true, trains: ['reaya'], atk: 9, range: 224, rate: 2, vision: 9, desc: 'Ana bina. Reaya yetiştirir, kaynak teslim noktası.' },
  ev: { name: 'Ev', w: 2, h: 2, hp: 350, cost: { w: 40 }, time: 14, pop: 5, vision: 4, desc: 'Nüfus sınırını +5 artırır.' },
  ambar: { name: 'Ambar', w: 2, h: 2, hp: 450, cost: { w: 60 }, time: 16, drop: true, vision: 4, desc: 'Kaynak teslim noktası.' },
  tarla: { name: 'Tarla', w: 2, h: 2, hp: 250, cost: { w: 60 }, time: 12, farm: true, vision: 3, desc: 'Sınırsız yiyecek kaynağı.' },
  kisla: { name: 'Kışla', w: 3, h: 3, hp: 1000, cost: { w: 150 }, time: 30, trains: ['azap', 'okcu'], vision: 5, desc: 'Azap ve okçu yetiştirir.' },
  ahir: { name: 'Ahır', w: 3, h: 3, hp: 1000, cost: { w: 150, g: 30 }, time: 30, trains: ['sipahi'], vision: 5, desc: 'Sipahi yetiştirir.' },
  ocak: { name: 'Yeniçeri Ocağı', w: 3, h: 3, hp: 1200, cost: { w: 200, g: 100 }, time: 40, trains: ['yeniceri'], req: 'kisla', vision: 5, desc: 'Yeniçeri yetiştirir. (Kışla gerekir)' },
  dokum: { name: 'Dökümhane', w: 3, h: 3, hp: 1200, cost: { w: 250, g: 150 }, time: 45, trains: ['top', 'sahi'], req: 'kisla', vision: 5, desc: 'Kuşatma topları döker. (Kışla gerekir)' },
  kule: { name: 'Gözcü Kulesi', w: 2, h: 2, hp: 800, cost: { w: 100, g: 40 }, time: 25, atk: 11, range: 224, rate: 1.6, vision: 8, tower: true, desc: 'Yakındaki düşmanlara ok atar.' },
  hisar: { name: 'Rumeli Hisarı', w: 4, h: 4, hp: 3500, cost: { w: 450, g: 250 }, time: 90, atk: 18, range: 288, rate: 1.4, vision: 10, tower: true, zone: true, desc: 'Boğaz\'ı kontrol eden hisar. Yalnızca işaretli alana kurulur.' },
  sur: { name: 'Sur', w: 1, h: 1, hp: 1800, wall: true, vision: 1 },
  kapi: { name: 'Kapı', w: 1, h: 1, hp: 1100, wall: true, gate: true, vision: 1 },
  burc: { name: 'Burç', w: 2, h: 2, hp: 1600, atk: 11, range: 230, rate: 1.7, vision: 7, tower: true },
  kale: { name: 'Kale', w: 4, h: 4, hp: 4500, atk: 16, range: 256, rate: 1.5, pop: 20, trains: ['azap', 'okcu', 'sovalye'], vision: 9, tower: true },
  kamp: { name: 'Ordugâh', w: 3, h: 3, hp: 1300, pop: 20, trains: ['azap', 'okcu', 'sipahi', 'sovalye'], vision: 7, drop: true },
  ayasofya: { name: 'Ayasofya', w: 5, h: 5, hp: 99999, landmark: true, vision: 4 },
};

const sfmt = c => Object.entries(c).map(([k, v]) => v + ' ' + RESN[k]).join(', ') || 'Ücretsiz';

/* ---------- durum ---------- */
let G = null;
const PF = {};

function newGame(m) {
  const W = m.W, H = m.H, n = W * H;
  G = {
    m, W, H, t: 0, nid: 0, ents: [], byId: new Map(), blds: [],
    terrain: new Uint8Array(n), res: new Uint8Array(n), amt: new Uint16Array(n),
    blkT: new Uint8Array(n), occ: new Int32Array(n), vis: new Uint8Array(n), exp: new Uint8Array(n),
    players: [{ f: 0, w: 0, g: 0, pop: 0, cap: 0 }, { f: 0, w: 0, g: 0, pop: 0, cap: 999 }],
    colors: m.colors, proj: [], fx: [], navVer: 0, sel: [], groups: {}, speed: 1, paused: false,
    msgs: [], done: false, flags: {}, evDone: {}, trDone: {}, ai: null, ctick: 0, vtick: 0, otick: 0, atick: 0,
    cells: null, cw: Math.ceil(W * TILE / 64), ch: Math.ceil(H * TILE / 64), alert: null, hero: null,
    stats: { kills: 0, lost: 0 }, dirtyMini: true, capture: 0,
  };
  G.cells = Array.from({ length: G.cw * G.ch }, () => []);
  pfInit();
  Object.assign(G.players[0], m.start || {});
  return G;
}
function msg(text, cls) { G.msgs.push({ text, cls: cls || '', t: 0 }); if (G.msgs.length > 6) G.msgs.shift(); if (typeof uiMsg === 'function') uiMsg(); }

/* ---------- harita ---------- */
const idx = (x, y) => y * G.W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < G.W && y < G.H;
function refreshBlk(i) { const t = G.terrain[i], r = G.res[i]; G.blkT[i] = (t === 1 || r === 1 || r === 2) ? 1 : 0; }
function setWater(x0, y0, x1, y1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) { const i = idx(x, y); G.terrain[i] = 1; G.res[i] = 0; refreshBlk(i); } }
function setTerrain(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) { G.terrain[idx(x, y)] = t; refreshBlk(idx(x, y)); } }
function putRes(x, y, type, amt) { if (!inb(x, y)) return; const i = idx(x, y); if (G.terrain[i] === 1 || G.occ[i]) return; G.res[i] = type; G.amt[i] = amt; refreshBlk(i); }
function forest(cx, cy, r, dens) {
  dens = dens || .7;
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const d = Math.hypot(x - cx, y - cy); if (d <= r && G.rng() < dens * (1 - d / (r * 1.4))) putRes(x, y, 1, 120);
  }
}
function mine(cx, cy, n, amt) { n = n || 4; amt = amt || 700; const o = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1]]; for (let k = 0; k < n; k++) putRes(cx + o[k][0], cy + o[k][1], 2, amt); }
function berries(cx, cy, n) { n = n || 5; for (let k = 0; k < n; k++) putRes(cx + Math.round((G.rng() - .5) * 3), cy + Math.round((G.rng() - .5) * 3), 3, 150); }
function clearArea(cx, cy, r) { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= r) { const i = idx(x, y); if (G.res[i] === 1) { G.res[i] = 0; refreshBlk(i); } } }
function wallLine(owner, x0, y0, x1, y1, type, label) {
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); let x = x0, y = y0;
  for (let k = 0; k < 400; k++) { if (!G.occ[idx(x, y)]) addBuilding(type || 'sur', owner, x, y, { label }); if (x === x1 && y === y1) break; x += dx; y += dy; }
}
function makeRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function renderBase() { // arazi renklendirmesi için gürültü
  for (let i = 0; i < G.W * G.H; i++) if (G.terrain[i] === 0 && G.rng() < .06) G.terrain[i] = 2;
}

/* ---------- varlıklar ---------- */
function addUnit(type, owner, x, y, o) {
  const d = UNITS[type];
  const u = { id: ++G.nid, kind: 'u', type, d, owner, x, y, hp: d.hp, maxhp: d.hp, r: d.r, atk: d.atk, rate: d.rate, order: { t: 'idle' }, path: null, pi: 0, cd: Math.random(), dead: false, face: 0, carry: null, hold: !!(d.hero && owner === 0), fails: 0, stuck: 0, scan: Math.random() * .5, rp: 0, hit: 0, name: d.name };
  Object.assign(u, o || {});
  if (u.guard && !u.home) u.home = { x, y };
  G.ents.push(u); G.byId.set(u.id, u);
  if (d.hero && owner === 0 && !G.hero) G.hero = u;
  return u;
}
const U = (type, owner, tx, ty, o) => addUnit(type, owner, tx * TILE + TILE / 2, ty * TILE + TILE / 2, o);
function addBuilding(type, owner, tx, ty, o) {
  o = o || {}; const d = BUILDS[type];
  const b = { id: ++G.nid, kind: 'b', type, d, owner, tx, ty, w: d.w, h: d.h, x: (tx + d.w / 2) * TILE, y: (ty + d.h / 2) * TILE, r: Math.max(d.w, d.h) * TILE / 2, hp: d.hp, maxhp: d.hp, built: o.built !== false, prog: o.built === false ? 0 : 1, queue: [], cd: 1, rally: null, dead: false, name: o.label || d.name, hit: 0, bw: 0 };
  if (o.hp) { b.hp = b.maxhp = o.hp; }
  if (!b.built) b.hp = Math.max(10, d.hp * .1);
  for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) if (inb(x, y)) { G.occ[idx(x, y)] = b.id; if (G.res[idx(x, y)] === 3) { G.res[idx(x, y)] = 0; } }
  G.ents.push(b); G.byId.set(b.id, b); G.blds.push(b); G.navVer++; G.dirtyMini = true;
  return b;
}
const B = (type, owner, tx, ty, o) => addBuilding(type, owner, tx, ty, o);

function kill(e, src) {
  if (e.dead) return; e.dead = true; G.byId.delete(e.id); G.dirty = true;
  if (e.kind === 'b') {
    for (let y = e.ty; y < e.ty + e.h; y++) for (let x = e.tx; x < e.tx + e.w; x++) if (inb(x, y) && G.occ[idx(x, y)] === e.id) G.occ[idx(x, y)] = 0;
    G.navVer++; G.blds = G.blds.filter(b => b !== e); G.dirtyMini = true;
    for (let k = 0; k < 14; k++) G.fx.push({ k: 'puff', x: e.x + (Math.random() - .5) * e.w * TILE, y: e.y + (Math.random() - .5) * e.h * TILE, t: 0, life: .8 + Math.random() * .6, r: 8 + Math.random() * 14 });
  } else {
    G.fx.push({ k: 'blood', x: e.x, y: e.y, t: 0, life: 6 });
    if (e.owner === 0) G.stats.lost++; else G.stats.kills++;
  }
  if (e.owner === 0 && e.kind === 'b' && e.d.drop) { /* kaynak teslim noktası kaybı */ }
}
function applyDmg(t, dmg, src) {
  if (t.dead || t.d.landmark) return;
  t.hp -= dmg; t.hit = .15;
  if (t.hp <= 0) { kill(t, src); return; }
  if (t.owner === 1 && src && src.owner === 0) G.alert = { x: src.x, y: src.y, t: G.t };
  if (t.kind === 'u' && src && src.owner !== t.owner && src.kind === 'u' && t.d.atk && !t.d.worker && !t.hold && (t.order.t === 'idle')) { t.order = { t: 'attack', tid: src.id, auto: true }; t.rp = 0; }
}

/* ---------- uzaysal tablo ---------- */
function rebuildHash() {
  for (const c of G.cells) c.length = 0;
  for (const e of G.ents) if (e.kind === 'u' && !e.dead) { const cx = clamp((e.x / 64) | 0, 0, G.cw - 1), cy = clamp((e.y / 64) | 0, 0, G.ch - 1); G.cells[cy * G.cw + cx].push(e); }
}
function unitsNear(x, y, r, fn) {
  const x0 = clamp(((x - r) / 64) | 0, 0, G.cw - 1), x1 = clamp(((x + r) / 64) | 0, 0, G.cw - 1), y0 = clamp(((y - r) / 64) | 0, 0, G.ch - 1), y1 = clamp(((y + r) / 64) | 0, 0, G.ch - 1);
  const r2 = r * r;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const c = G.cells[cy * G.cw + cx]; for (let i = 0; i < c.length; i++) { const e = c[i]; if (e.dead) continue; const dx = e.x - x, dy = e.y - y; if (dx * dx + dy * dy <= r2) fn(e); } }
}
function rectDist(x, y, b) {
  const dx = Math.max(b.tx * TILE - x, 0, x - (b.tx + b.w) * TILE), dy = Math.max(b.ty * TILE - y, 0, y - (b.ty + b.h) * TILE);
  return Math.hypot(dx, dy);
}

/* ---------- yol bulma (A*) ---------- */
function pfInit() { const n = G.W * G.H; PF.g = new Float32Array(n); PF.par = new Int32Array(n); PF.mark = new Uint32Array(n); PF.closed = new Uint32Array(n); PF.cur = 0; PF.hi = []; PF.hf = []; }
function hpush(i, f) { const I = PF.hi, F = PF.hf; let n = I.length; I.push(i); F.push(f); while (n > 0) { const p = (n - 1) >> 1; if (F[p] <= F[n]) break; [I[p], I[n]] = [I[n], I[p]]; [F[p], F[n]] = [F[n], F[p]]; n = p; } }
function hpop() { const I = PF.hi, F = PF.hf; const top = I[0]; const li = I.pop(), lf = F.pop(); if (I.length) { I[0] = li; F[0] = lf; let n = 0; const L = I.length; for (; ;) { let l = 2 * n + 1, r = l + 1, s = n; if (l < L && F[l] < F[s]) s = l; if (r < L && F[r] < F[s]) s = r; if (s === n) break;[I[s], I[n]] = [I[n], I[s]];[F[s], F[n]] = [F[n], F[s]]; n = s; } } return top; }
function tcost(i, owner, soft) {
  if (G.blkT[i]) return -1;
  const bid = G.occ[i]; if (!bid) return 1;
  const b = G.byId.get(bid); if (!b) return 1;
  if (b.d.gate && b.owner === owner) return 1;
  if (b.owner === owner || !soft || b.d.landmark) return -1;
  return 25;
}
function los(x0, y0, x1, y1, owner) {
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx - dy;
  for (; ;) {
    if (tcost(idx(x0, y0), owner, false) < 0) return false;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * e;
    if (e2 > -dy) { e -= dy; x0 += sx; }
    if (e2 < dx) { e += dx; y0 += sy; }
  }
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function findPath(sx, sy, gx, gy, owner, soft) {
  const W = G.W, H = G.H; if (sx === gx && sy === gy) return [];
  const hh = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return dx + dy - .586 * Math.min(dx, dy); };
  PF.cur++; const cur = PF.cur; PF.hi.length = 0; PF.hf.length = 0;
  const s = sy * W + sx, gi = gy * W + gx; PF.g[s] = 0; PF.mark[s] = cur; hpush(s, hh(sx, sy));
  let best = s, bestH = hh(sx, sy), it = 0;
  while (PF.hi.length && it++ < 9000) {
    const c = hpop(); if (PF.closed[c] === cur) continue; PF.closed[c] = cur;
    if (c === gi) { best = c; break; }
    const cx = c % W, cy = (c / W) | 0, hc = hh(cx, cy); if (hc < bestH) { bestH = hc; best = c; }
    for (let d = 0; d < 8; d++) {
      const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx; if (PF.closed[ni] === cur) continue;
      const cost = tcost(ni, owner, soft); if (cost < 0) continue;
      if (d >= 4 && (tcost(cy * W + nx, owner, soft) < 0 || tcost(ny * W + cx, owner, soft) < 0)) continue;
      const ng = PF.g[c] + (d >= 4 ? 1.414 : 1) * cost;
      if (PF.mark[ni] !== cur || ng < PF.g[ni]) { PF.mark[ni] = cur; PF.g[ni] = ng; PF.par[ni] = c; hpush(ni, ng + hh(nx, ny)); }
    }
  }
  if (best === s) return [];
  const out = []; let c = best; while (c !== s) { out.push([c % W, (c / W) | 0]); c = PF.par[c]; } out.push([sx, sy]); out.reverse();
  // yumuşatma
  const res = []; let i = 0; const last = out.length - 1;
  while (i < last) { let j = Math.min(last, i + 24); while (j > i + 1 && !los(out[i][0], out[i][1], out[j][0], out[j][1], owner)) j--; res.push(out[j]); i = j; }
  return res;
}
function setPath(u, x, y, soft) {
  const gx = clamp((x / TILE) | 0, 0, G.W - 1), gy = clamp((y / TILE) | 0, 0, G.H - 1);
  const p = findPath(clamp((u.x / TILE) | 0, 0, G.W - 1), clamp((u.y / TILE) | 0, 0, G.H - 1), gx, gy, u.owner, soft);
  u.soft = soft; u.goal = { x, y }; u.chk = -1; u.pi = 0; u.stuck = 0;
  if (!p.length) { u.path = null; return false; }
  u.path = p.map(t => [t[0] * TILE + TILE / 2, t[1] * TILE + TILE / 2]);
  const lt = p[p.length - 1]; if (lt[0] === gx && lt[1] === gy && !G.blkT[idx(gx, gy)] && !G.occ[idx(gx, gy)]) u.path[u.path.length - 1] = [x, y];
  return true;
}
function stepMove(u, dt) {
  const p = u.path; if (!p || u.pi >= p.length) return true;
  const w = p[u.pi];
  if (u.chk !== u.pi) {
    u.chk = u.pi; const wx = (w[0] / TILE) | 0, wy = (w[1] / TILE) | 0, i = idx(wx, wy);
    const c = tcost(i, u.owner, u.soft);
    if (c < 0) { if (++u.fails > 4) { u.fails = 0; u.path = null; return true; } if (!setPath(u, u.goal.x, u.goal.y, u.soft)) return true; return false; }
    if (c > 1) { const b = G.byId.get(G.occ[i]); if (b && b.id !== u.tgt) { u.breaker = b; return false; } }
  }
  const dx = w[0] - u.x, dy = w[1] - u.y, d = Math.hypot(dx, dy), sp = u.d.speed * dt * (u.aura ? 1 : 1);
  if (d <= sp) { u.x = w[0]; u.y = w[1]; u.pi++; u.stuck = 0; return u.pi >= p.length; }
  const nx = u.x + dx / d * sp, ny = u.y + dy / d * sp;
  const ti = idx(clamp((nx / TILE) | 0, 0, G.W - 1), clamp((ny / TILE) | 0, 0, G.H - 1));
  if (tcost(ti, u.owner, false) < 0 && !(G.occ[ti] && u.soft)) { u.stuck += dt; if (u.stuck > .8) { u.stuck = 0; if (!setPath(u, u.goal.x, u.goal.y, u.soft)) return true; } return false; }
  u.x = nx; u.y = ny; u.face = Math.atan2(dy, dx); u.stuck = 0; return false;
}

/* ---------- emirler ---------- */
function orderStop(u) { u.order = { t: 'idle' }; u.path = null; u.breaker = null; u.hold = false; }
function orderMove(u, x, y) { u.order = { t: 'move', x, y }; u.fails = 0; u.breaker = null; u.tgt = 0; setPath(u, x, y, false); }
function orderAttack(u, t) { u.order = { t: 'attack', tid: t.id }; u.rp = 0; u.breaker = null; u.fails = 0; }
function orderAmove(u, x, y) { u.order = { t: 'amove', x, y, tid: 0 }; u.fails = 0; u.breaker = null; u.tgt = 0; setPath(u, x, y, true); }
function orderGather(u, tx, ty) { u.order = { t: 'gather', tx, ty, res: G.res[idx(tx, ty)], ph: 'go', acc: 0, fails: 0 }; u.fails = 0; setupGatherPath(u); }
function orderFarm(u, b) { u.order = { t: 'gather', farm: b.id, res: 3, ph: 'go', acc: 0 }; u.fails = 0; u.tgt = 0; setPath(u, b.x, b.y + b.h * TILE / 2 + 8, false); }
function orderBuild(u, b) { u.order = { t: 'build', bid: b.id }; u.fails = 0; u.tgt = 0; setPath(u, b.x, b.y + b.h * TILE / 2 + 8, false); }
function setupGatherPath(u) {
  const o = u.order; const px = o.tx * TILE + TILE / 2, py = o.ty * TILE + TILE / 2; u.tgt = 0;
  if (G.res[idx(o.tx, o.ty)] === 3) setPath(u, px, py, false); else setPath(u, px, py, false);
}
function inRange(u, t) {
  const reach = u.d.range > 0 ? u.d.range : 10;
  if (t.kind === 'b') return rectDist(u.x, u.y, t) <= reach + u.r;
  return Math.hypot(t.x - u.x, t.y - u.y) <= reach + u.r + t.r;
}
function doAttack(u, t) {
  const d = u.d; let dmg = u.atk * (u.aura ? 1.2 : 1);
  if (t.kind === 'u') { if (d.bonus && d.bonus[t.d.cls]) dmg += d.bonus[t.d.cls]; dmg = Math.max(1, dmg - t.d.armor); }
  else dmg = Math.max(1, dmg * (d.bm == null ? .3 : d.bm));
  if (d.proj) G.proj.push({ x: u.x, y: u.y, tid: t.id, tx: t.x, ty: t.y, dmg, owner: u.owner, kind: d.proj, sp: d.proj === 'ball' ? 380 : 520, splash: d.splash || 0, src: u.id, srcAtk: u.atk });
  else { applyDmg(t, dmg, u); }
}
function attackStep(u, t, dt, brk) {
  if (u.guard && u.home && Math.hypot(u.x - u.home.x, u.y - u.home.y) > 7 * TILE && !brk) { u.order = { t: 'move', x: u.home.x, y: u.home.y }; setPath(u, u.home.x, u.home.y, false); return; }
  if (inRange(u, t)) {
    u.face = Math.atan2(t.y - u.y, t.x - u.x); u.path = null;
    if (u.cd <= 0) { doAttack(u, t); u.cd = u.rate; }
    return;
  }
  if (u.hold) { u.order = { t: 'idle' }; return; }
  u.rp -= dt; u.tgt = t.id;
  if (!u.path || u.rp <= 0) { setPath(u, t.x, t.y, true); u.rp = .6; u.tgt = t.id; }
  if (stepMove(u, dt) && !inRange(u, t)) { u.path = null; }
}
function acquire(u, radius, bld) {
  let best = null, bs = 1e9; const o = u.owner;
  unitsNear(u.x, u.y, radius, e => { if (e.owner === o) return; const d = Math.hypot(e.x - u.x, e.y - u.y); const sc = d + (e.d.worker ? 60 : 0); if (sc < bs) { bs = sc; best = e; } });
  for (const b of G.blds) {
    if (b.owner === o || b.dead || b.d.landmark) continue;
    if (!bld && !b.d.atk) continue; if (b.d.wall) continue;
    const d = rectDist(u.x, u.y, b); if (d > radius) continue;
    const sc = d + (b.d.atk ? 30 : 160); if (sc < bs) { bs = sc; best = b; }
  }
  return best;
}
function idleThink(u, dt) {
  if (u.d.worker || !u.atk) return;
  u.scan -= dt;
  if (u.scan <= 0) {
    u.scan = .5 + Math.random() * .2;
    const rad = u.hold ? (u.d.range || 10) + u.r : u.d.vision * TILE;
    const t = acquire(u, rad, u.owner === 1);
    if (t) { u.order = { t: 'attack', tid: t.id, auto: true }; u.rp = 0; return; }
    if (u.guard && u.home && Math.hypot(u.x - u.home.x, u.y - u.home.y) > 40) { u.order = { t: 'move', x: u.home.x, y: u.home.y }; setPath(u, u.home.x, u.home.y, false); }
    else if (u.owner === 1 && u.rally && !u.guard && Math.hypot(u.x - u.rally.x, u.y - u.rally.y) > 90) { u.order = { t: 'move', x: u.rally.x, y: u.rally.y }; setPath(u, u.rally.x, u.rally.y, false); }
  }
}
function updAmove(u, dt) {
  const o = u.order; u.scan -= dt;
  if (u.scan <= 0) { u.scan = .4 + Math.random() * .2; const t = u.hold ? null : acquire(u, u.d.vision * TILE, true); const nid = t ? t.id : 0; if (nid !== o.tid) { o.tid = nid; if (!nid) setPath(u, o.x, o.y, true); } }
  if (o.tid) { const t = G.byId.get(o.tid); if (!t || t.dead) { o.tid = 0; setPath(u, o.x, o.y, true); } else { attackStep(u, t, dt, false); return; } }
  if (stepMove(u, dt)) u.order = { t: 'idle' };
}
function findDrop(u) {
  let best = null, bd = 1e9;
  for (const b of G.blds) if (b.owner === u.owner && b.built && b.d.drop) { const d = rectDist(u.x, u.y, b); if (d < bd) { bd = d; best = b; } }
  return best;
}
function nearestRes(x, y, type, maxR) {
  let best = null, bd = maxR * maxR; const cx = (x / TILE) | 0, cy = (y / TILE) | 0;
  for (let ty = cy - maxR; ty <= cy + maxR; ty++) for (let tx = cx - maxR; tx <= cx + maxR; tx++) { if (!inb(tx, ty)) continue; const i = idx(tx, ty); if (G.res[i] === type && G.amt[i] > 0) { const d = (tx - cx) ** 2 + (ty - cy) ** 2; if (d < bd) { bd = d; best = [tx, ty]; } } }
  return best;
}
const RATE = { 1: 1.0, 2: .9, 3: 1.2 };
function updGather(u, dt) {
  const o = u.order, p = G.players[u.owner];
  if (o.ph === 'go') {
    let tx, ty, farm = null;
    if (o.farm) { farm = G.byId.get(o.farm); if (!farm || farm.dead || !farm.built) { u.order = { t: 'idle' }; return; } tx = farm.x; ty = farm.y; }
    else { const i = idx(o.tx, o.ty); if (G.res[i] !== o.res || G.amt[i] <= 0) { const n = nearestRes(u.x, u.y, o.res, 12); if (!n) { u.order = { t: 'idle' }; return; } o.tx = n[0]; o.ty = n[1]; setupGatherPath(u); } tx = o.tx * TILE + TILE / 2; ty = o.ty * TILE + TILE / 2; }
    const near = farm ? rectDist(u.x, u.y, farm) <= 14 : Math.hypot(u.x - tx, u.y - ty) <= (G.res[idx(o.tx, o.ty)] === 3 ? 14 : TILE * 1.15);
    if (near) { o.ph = 'work'; u.path = null; u.face = Math.atan2(ty - u.y, tx - u.x); }
    else if (stepMove(u, dt)) { if (farm) setPath(u, farm.x, farm.y + farm.h * TILE / 2 + 8, false); else setupGatherPath(u); if (!u.path && ++o.fails > 3) u.order = { t: 'idle' }; }
  } else if (o.ph === 'work') {
    if (!u.carry || u.carry.type !== o.res) u.carry = { type: o.res, amt: 0 };
    o.acc += dt * (o.farm ? .8 : RATE[o.res] || 1);
    while (o.acc >= 1) {
      o.acc -= 1;
      if (!o.farm) { const i = idx(o.tx, o.ty); if (G.amt[i] <= 0) { o.ph = 'go'; break; } G.amt[i]--; if (G.amt[i] <= 0) { G.res[i] = 0; refreshBlk(i); G.dirtyMini = true; } }
      u.carry.amt++;
      if (u.carry.amt >= 10) { o.ph = 'ret'; const d = findDrop(u); if (!d) { u.order = { t: 'idle' }; return; } o.drop = d.id; setPath(u, d.x, d.y + d.h * TILE / 2 + 6, false); break; }
    }
    if (o.ph === 'work' && !o.farm && G.res[idx(o.tx, o.ty)] !== o.res) o.ph = 'go';
  } else if (o.ph === 'ret') {
    const d = G.byId.get(o.drop);
    if (!d || d.dead) { const n = findDrop(u); if (!n) { u.order = { t: 'idle' }; return; } o.drop = n.id; setPath(u, n.x, n.y + n.h * TILE / 2 + 6, false); return; }
    if (rectDist(u.x, u.y, d) <= 24) {
      const key = ['', 'w', 'g', 'f'][u.carry.type]; if (key) p[key] += u.carry.amt; u.carry = { type: u.carry.type, amt: 0 };
      o.ph = 'go'; if (o.farm) { const f = G.byId.get(o.farm); if (f) setPath(u, f.x, f.y + f.h * TILE / 2 + 8, false); else u.order = { t: 'idle' }; } else setupGatherPath(u);
    } else if (stepMove(u, dt)) { setPath(u, d.x, d.y + d.h * TILE / 2 + 6, false); if (!u.path && ++o.fails > 3) u.order = { t: 'idle' }; }
  }
}
function updBuildOrder(u, dt) {
  const b = G.byId.get(u.order.bid);
  if (!b || b.dead || b.built) { // yeni inşaat ara
    u.order = { t: 'idle' }; if (b && b.built && b.d.farm && b.owner === u.owner) orderFarm(u, b); return;
  }
  if (rectDist(u.x, u.y, b) <= 26) { b.bw++; u.path = null; u.fails = 0; u.face = Math.atan2(b.y - u.y, b.x - u.x); }
  else { const done = u.path ? stepMove(u, dt) : true; if (done && !setPath(u, b.x, b.y + b.h * TILE / 2 + 8, false) && ++u.fails > 3) u.order = { t: 'idle' }; }
}
function updUnit(u, dt) {
  if (u.hit > 0) u.hit -= dt; u.cd -= dt;
  if (u.breaker) { if (u.breaker.dead) { u.breaker = null; if (u.goal) setPath(u, u.goal.x, u.goal.y, u.soft); } else { u.tgt = u.breaker.id; attackStep(u, u.breaker, dt, true); return; } }
  const o = u.order;
  switch (o.t) {
    case 'idle': idleThink(u, dt); break;
    case 'move': if (stepMove(u, dt)) u.order = { t: 'idle' }; break;
    case 'attack': { const t = G.byId.get(o.tid); if (!t || t.dead || t.owner === u.owner) { u.order = { t: 'idle' }; u.path = null; break; } if (o.auto && Math.hypot(t.x - u.x, t.y - u.y) > u.d.vision * TILE * 2 && !(t.kind === 'b')) { u.order = { t: 'idle' }; break; } attackStep(u, t, dt, false); break; }
    case 'amove': updAmove(u, dt); break;
    case 'gather': updGather(u, dt); break;
    case 'build': updBuildOrder(u, dt); break;
  }
}

/* ---------- bina mantığı ---------- */
function popUsed(o) { let n = 0; for (const e of G.ents) { if (e.dead) continue; if (e.kind === 'u') n += e.d.pop; else for (const q of e.queue) n += UNITS[q.type].pop; } return n; }
function popUsedOwner(o) { let n = 0; for (const e of G.ents) { if (e.dead || e.owner !== o) continue; if (e.kind === 'u') n += e.d.pop; else for (const q of e.queue) n += UNITS[q.type].pop; } return n; }
const afford = (p, c) => (p.f >= (c.f || 0)) && (p.w >= (c.w || 0)) && (p.g >= (c.g || 0));
const pay = (p, c, s) => { s = s || 1; p.f -= (c.f || 0) * s; p.w -= (c.w || 0) * s; p.g -= (c.g || 0) * s; };
function hasBuilt(owner, type) { return G.blds.some(b => b.owner === owner && b.type === type && b.built); }
function queueTrain(b, type, silent) {
  const p = G.players[b.owner], d = UNITS[type];
  if (!b.built) return false;
  if (b.queue.length >= 5) { if (!silent) msg('Üretim sırası dolu.', 'warn'); return false; }
  if (!afford(p, d.cost)) { if (!silent) msg('Yetersiz kaynak!', 'warn'); return false; }
  if (popUsedOwner(b.owner) + d.pop > p.cap) { if (!silent) msg('Nüfus sınırı! Ev inşa et.', 'warn'); return false; }
  pay(p, d.cost); b.queue.push({ type, t: 0 }); return true;
}
function spawnSpot(b) {
  const tx0 = b.tx - 1, ty0 = b.ty - 1, tx1 = b.tx + b.w, ty1 = b.ty + b.h; const c = [];
  for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) { if (x > tx0 && x < tx1 && y > ty0 && y < ty1) continue; if (!inb(x, y)) continue; const i = idx(x, y); if (!G.blkT[i] && !G.occ[i]) c.push([x, y]); }
  if (!c.length) return { x: b.x, y: b.y + b.h * TILE / 2 + 20 };
  const tgt = b.rally || { x: b.x, y: b.y + 999 }; let best = c[0], bd = 1e12;
  for (const t of c) { const d = Math.hypot(t[0] * TILE + 16 - tgt.x, t[1] * TILE + 16 - tgt.y); if (d < bd) { bd = d; best = t; } }
  return { x: best[0] * TILE + 16 + (Math.random() - .5) * 8, y: best[1] * TILE + 16 + (Math.random() - .5) * 8 };
}
function updBuilding(b, dt) {
  if (b.hit > 0) b.hit -= dt;
  if (!b.built) {
    if (b.bw > 0) { const dp = dt / b.d.time * Math.pow(b.bw, .7); b.prog = Math.min(1, b.prog + dp); b.hp = Math.min(b.maxhp, b.hp + b.maxhp * dp * .9); b.bw = 0; if (b.prog >= 1) { b.built = true; b.hp = Math.max(b.hp, b.maxhp * .95); if (b.owner === 0) msg(b.name + ' tamamlandı.', 'good'); G.dirtyMini = true; if (b.d.farm) for (const u of G.ents) if (u.kind === 'u' && u.order.t === 'build' && u.order.bid === b.id) { orderFarm(u, b); } } }
    return;
  }
  if (b.queue.length) {
    const q = b.queue[0], d = UNITS[q.type]; q.t += dt;
    if (q.t >= d.time) {
      b.queue.shift(); const s = spawnSpot(b);
      const o = {}; if (b.owner === 1) { o.ai = 'army'; o.rally = b.rally || { x: b.x, y: b.y + b.h * TILE / 2 + 60 }; }
      const u = addUnit(q.type, b.owner, s.x, s.y, o);
      if (b.rally && b.owner === 0) { const rt = G.res[idx(clamp((b.rally.x / TILE) | 0, 0, G.W - 1), clamp((b.rally.y / TILE) | 0, 0, G.H - 1))]; if (u.d.worker && rt) orderGather(u, (b.rally.x / TILE) | 0, (b.rally.y / TILE) | 0); else orderMove(u, b.rally.x, b.rally.y); }
      if (b.owner === 0 && typeof uiBeep === 'function') uiBeep();
    }
  }
  if (b.d.atk) {
    b.cd -= dt;
    if (b.cd <= 0) {
      let best = null, bd = 1e9; unitsNear(b.x, b.y, b.d.range + b.w * 16, e => { if (e.owner === b.owner) return; const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd) { bd = d; best = e; } });
      if (best) { G.proj.push({ x: b.x, y: b.y, tid: best.id, tx: best.x, ty: best.y, dmg: Math.max(1, b.d.atk - best.d.armor), owner: b.owner, kind: 'arrow', sp: 520, splash: 0, src: b.id }); b.cd = b.d.rate; } else b.cd = .3;
    }
  }
}
function updProj(dt) {
  for (const p of G.proj) {
    const t = G.byId.get(p.tid); if (t && !t.dead) { p.tx = t.x; p.ty = t.y; }
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), s = p.sp * dt; p.ang = Math.atan2(dy, dx);
    if (d <= s) {
      p.done = true;
      const src = G.byId.get(p.src);
      if (p.splash) {
        G.fx.push({ k: 'boom', x: p.tx, y: p.ty, t: 0, life: .5, r: p.splash });
        unitsNear(p.tx, p.ty, p.splash, e => { if (e.owner !== p.owner) applyDmg(e, Math.max(1, p.srcAtk * .5 - e.d.armor), src); });
        if (t && !t.dead && t.kind === 'b') applyDmg(t, p.dmg, src);
        else if (t && !t.dead && t.kind === 'u') { /* birim zaten sıçramadan etkilendi */ }
      } else if (t && !t.dead) applyDmg(t, p.dmg, src);
    } else { p.x += dx / d * s; p.y += dy / d * s; }
  }
  G.proj = G.proj.filter(p => !p.done);
}

/* ---------- görüş ---------- */
function updVis() {
  G.vis.fill(0); const W = G.W, H = G.H;
  if (G.m.noFog) { G.vis.fill(1); G.exp.fill(1); return; }
  for (const e of G.ents) {
    if (e.owner !== 0 || e.dead) continue; const r = e.d.vision || 6, cx = (e.x / TILE) | 0, cy = (e.y / TILE) | 0, r2 = r * r;
    for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) { const i = y * W + x; G.vis[i] = 1; G.exp[i] = 1; }
  }
}
const visAt = (x, y) => G.vis[idx(clamp((x / TILE) | 0, 0, G.W - 1), clamp((y / TILE) | 0, 0, G.H - 1))] === 1;
const expAt = (x, y) => G.exp[idx(clamp((x / TILE) | 0, 0, G.W - 1), clamp((y / TILE) | 0, 0, G.H - 1))] === 1;

/* ---------- Yapay zekâ ---------- */
function aiTick(dt) {
  const ai = G.ai; if (!ai) return;
  const p = G.players[1];
  p.f += ai.income.f * dt; p.w += ai.income.w * dt; p.g += ai.income.g * dt; p.cap = ai.popCap;
  // üretim
  const keys = Object.keys(ai.comp), tot = keys.reduce((a, k) => a + ai.comp[k], 0);
  for (const b of G.blds) {
    if (b.owner !== 1 || !b.built || !b.d.trains || b.queue.length >= 2) continue;
    const opts = keys.filter(k => b.d.trains.includes(k)); if (!opts.length) continue;
    let r = G.rng() * opts.reduce((a, k) => a + ai.comp[k], 0), pick = opts[0]; for (const k of opts) { r -= ai.comp[k]; if (r <= 0) { pick = k; break; } }
    queueTrain(b, pick, true);
  }
  const army = G.ents.filter(e => e.kind === 'u' && e.owner === 1 && !e.dead && e.ai === 'army');
  const idleArmy = army.filter(u => u.order.t === 'idle');
  const wave = ai.wave;
  if (wave && G.t >= ai.next) {
    const need = Math.max(3, Math.round(wave.size + wave.grow * ai.n));
    if (idleArmy.length >= need || (G.t >= ai.next + 90 && idleArmy.length >= 3)) {
      const tgt = aiTarget(); if (tgt) { for (const u of idleArmy) { u.ai = 'wave'; orderAmove(u, tgt.x, tgt.y); } ai.n++; ai.next = G.t + wave.interval; if (typeof onWave === 'function') onWave(ai.n); msg('Düşman saldırıya geçti!', 'warn'); }
    }
  }
  if (wave) for (const u of G.ents) if (u.kind === 'u' && u.owner === 1 && u.ai === 'wave' && u.order.t === 'idle' && !u.dead) { const t = aiTarget(u); if (t) orderAmove(u, t.x, t.y); }
  if (G.alert && G.t - G.alert.t < 6) { for (const u of idleArmy) if (Math.hypot(u.x - G.alert.x, u.y - G.alert.y) < 22 * TILE) orderAmove(u, G.alert.x, G.alert.y); }
}
function aiTarget(from) {
  let best = null, bd = 1e12; const ref = from || (G.blds.find(b => b.owner === 1 && b.d.trains) || { x: 0, y: 0 });
  for (const b of G.blds) if (b.owner === 0 && !b.d.wall) { const sc = Math.hypot(b.x - ref.x, b.y - ref.y) - (b.d.drop ? 200 : 0); if (sc < bd) { bd = sc; best = b; } }
  if (!best) for (const e of G.ents) if (e.owner === 0 && e.kind === 'u' && !e.dead) { best = e; break; }
  return best;
}

/* ---------- ana adım ---------- */
function popAndCap() {
  const p0 = G.players[0]; p0.pop = popUsedOwner(0); let cap = 0;
  for (const b of G.blds) if (b.owner === 0 && b.built && b.d.pop) cap += b.d.pop; p0.cap = Math.min(200, cap);
  G.players[1].pop = popUsedOwner(1);
}
function step(dt) {
  if (G.done) return;
  G.t += dt;
  rebuildHash();
  // aura
  G.otick -= dt;
  if (G.otick <= 0) { G.otick = .5; const heroes = G.ents.filter(e => e.kind === 'u' && e.d.hero && !e.dead); for (const u of G.ents) if (u.kind === 'u') { u.aura = false; if (!u.d.hero) for (const h of heroes) if (h.owner === u.owner && Math.hypot(h.x - u.x, h.y - u.y) < 170) { u.aura = true; break; } } }
  for (const e of G.ents) { if (e.dead) continue; if (e.kind === 'u') updUnit(e, dt); }
  for (const b of G.blds) if (!b.dead) updBuilding(b, dt);
  // ayrışma
  for (const u of G.ents) {
    if (u.kind !== 'u' || u.dead) continue;
    unitsNear(u.x, u.y, u.r * 2, e => {
      if (e === u || e.id < u.id) return; const dx = e.x - u.x, dy = e.y - u.y, d = Math.hypot(dx, dy) || .01, ov = u.r + e.r - d; if (ov <= 0) return;
      const px = dx / d * ov * .25, py = dy / d * ov * .25; pushUnit(u, -px, -py); pushUnit(e, px, py);
    });
  }
  updProj(dt);
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.life);
  if (G.dirty) { G.ents = G.ents.filter(e => !e.dead); G.dirty = false; G.sel = G.sel.filter(e => !e.dead); }
  popAndCap();
  G.vtick -= dt; if (G.vtick <= 0) { G.vtick = .3; updVis(); G.dirtyMini = true; }
  G.atick -= dt; if (G.atick <= 0) { G.atick = 1; aiTick(1); }
  G.ctick -= dt; if (G.ctick <= 0) { G.ctick = .5; checkMission(.5); }
  for (const m of G.msgs) m.t += dt; G.msgs = G.msgs.filter(m => m.t < 9);
}
function pushUnit(u, dx, dy) {
  if (u.order.t === 'gather' && u.order.ph === 'work') return;
  const nx = u.x + dx, ny = u.y + dy, i = idx(clamp((nx / TILE) | 0, 0, G.W - 1), clamp((ny / TILE) | 0, 0, G.H - 1));
  if (!G.blkT[i] && !G.occ[i]) { u.x = nx; u.y = ny; }
}

/* ---------- görev kontrolü ---------- */
function count(owner, pred) { let n = 0; for (const e of G.ents) if (!e.dead && e.owner === owner && (!pred || pred(e))) n++; return n; }
const isMil = e => e.kind === 'u' && e.d.atk && !e.d.worker && !e.d.hero;
function endGame(win, text, hist) { if (G.done) return; G.done = true; G.result = { win, text, hist }; if (typeof showResult === 'function') showResult(); }
function checkMission(dt) {
  const m = G.m;
  for (const ev of m.events || []) if (!G.evDone[ev.t] && G.t >= ev.t) { G.evDone[ev.t] = 1; ev.fn(); }
  (m.triggers || []).forEach((tr, i) => { if (!G.trDone[i] && tr.cond()) { G.trDone[i] = 1; tr.fn(); } });
  if (m.tick) m.tick(dt);
  let all = true;
  for (const ob of m.objectives) { if (!ob.ok && ob.done()) { ob.ok = true; if (!ob.opt) msg('✔ ' + ob.text, 'good'); } if (!ob.ok && !ob.opt) all = false; }
  if (typeof uiObjectives === 'function') uiObjectives();
  if (m.timeLimit && G.t >= m.timeLimit) { endGame(true, m.timeoutText || 'Süre doldu.', true); return; }
  if (all) { endGame(true, m.winText); return; }
  if (m.heroLose !== false && G.hero && G.hero.dead) { endGame(false, G.hero.name + ' şehit düştü. Komutansız ordu dağıldı.'); return; }
  if (!count(0)) endGame(false, 'Ordun yok edildi.');
}
