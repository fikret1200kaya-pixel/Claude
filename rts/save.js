'use strict';
/* ====== Kayıt sistemi: 3 elle kayıt yuvası + otomatik kayıt ====== */
const SAVE_SLOTS = ['1', '2', '3', 'auto'];
const b64 = a => { let s = ''; const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
const unb64 = (str, T) => { const s = atob(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new T(u.buffer); };
const SKIP = new Set(['d', 'breaker', 'fx']);
function entOut(e) { const o = {}; for (const k in e) if (!SKIP.has(k)) o[k] = e[k]; if (e.breaker) o.breakerId = e.breaker.id; return o; }
function serialize() {
  const g = G, plain = {};
  for (const k of ['W', 'H', 't', 'nid', 'team', 'diff', 'market', 'colors', 'flags', 'evDone', 'trDone', 'stats', 'capture', 'decor', 'zone', 'speed', 'alerts', 'idleT', 'readyT', 'proj']) plain[k] = g[k];
  return {
    v: 1, when: Date.now(), mission: curMission, sk: curMission < 0 ? Object.assign({}, lastSkirm, { seed: g.m.seed }) : null, ms: MS,
    title: g.m.title, date: g.m.date, diff: g.diff, mObj: g.m.objectives.map(o => !!o.ok), plain,
    players: g.players, ais: g.ais.map(a => Object.assign({}, a)), aiIdx: g.ais.indexOf(g.ai),
    terrain: b64(g.terrain), res: b64(g.res), amt: b64(g.amt), exp: b64(g.exp),
    ents: g.ents.filter(e => !e.dead).map(entOut), hero: g.hero ? g.hero.id : 0, sel: g.sel.map(e => e.id),
    groups: Object.fromEntries(Object.entries(g.groups).filter(([k]) => !k.startsWith('t')).map(([k, v]) => [k, v.map(e => e.id)])),
    cam: { x: cam.x, y: cam.y, z: cam.z },
  };
}
function saveGame(slot, quiet) {
  if (!G || G.done) return false;
  try { const s = JSON.stringify(serialize()); localStorage.setItem('fatih_save_' + slot, s); if (!quiet) msg('Oyun kaydedildi' + (slot === 'auto' ? ' (otomatik)' : ' — yuva ' + slot) + '.', 'good'); return true; }
  catch (e) { if (!quiet) msg('Kayıt yapılamadı: tarayıcı depolaması dolu veya kapalı.', 'warn'); return false; }
}
function saveInfo(slot) { try { const s = localStorage.getItem('fatih_save_' + slot); if (!s) return null; const d = JSON.parse(s); return { when: d.when, title: d.title, date: d.date, t: d.plain.t, sk: !!d.sk }; } catch (e) { return null; } }
function loadGame(slot) {
  let d; try { d = JSON.parse(localStorage.getItem('fatih_save_' + slot)); } catch (e) { d = null; }
  if (!d) { alert('Bu yuvada kayıt yok.'); return; }
  let m;
  if (d.mission >= 0) { curMission = d.mission; m = MISSIONS[d.mission]; }
  else { lastSkirm = d.sk; curMission = -1; m = makeSkirmish(Object.assign({}, d.sk)); }
  m.diff = d.diff; m.objectives.forEach((o, i) => o.ok = !!d.mObj[i]);
  newGame(m); MS = d.ms; G.rng = makeRng(m.seed + Math.round(d.plain.t));
  Object.assign(G, d.plain); G.players = d.players; G.ais = d.ais; G.ai = G.ais[d.aiIdx] || G.ais[0] || null;
  G.terrain = unb64(d.terrain, Uint8Array); G.res = unb64(d.res, Uint8Array); G.amt = unb64(d.amt, Uint16Array); G.exp = unb64(d.exp, Uint8Array);
  const n = G.W * G.H; G.blkT = new Uint8Array(n); G.occ = new Int32Array(n); G.vis = new Uint8Array(n);
  G.cw = Math.ceil(G.W * TILE / 64); G.ch = Math.ceil(G.H * TILE / 64); G.cells = Array.from({ length: G.cw * G.ch }, () => []); pfInit();
  for (let i = 0; i < n; i++) refreshBlk(i);
  G.ents = []; G.blds = []; G.byId = new Map();
  for (const o of d.ents) {
    const e = Object.assign({}, o); e.d = e.kind === 'u' ? UNITS[e.type] : BUILDS[e.type]; if (!e.d) continue;
    G.ents.push(e); G.byId.set(e.id, e);
    if (e.kind === 'b') { G.blds.push(e); for (let y = e.ty; y < e.ty + e.h; y++) for (let x = e.tx; x < e.tx + e.w; x++) if (inb(x, y)) G.occ[idx(x, y)] = e.id; }
  }
  for (const e of G.ents) { if (e.breakerId) { e.breaker = G.byId.get(e.breakerId) || null; delete e.breakerId; } }
  G.hero = G.byId.get(d.hero) || null; G.sel = d.sel.map(i => G.byId.get(i)).filter(Boolean);
  G.groups = {}; for (const [k, v] of Object.entries(d.groups)) G.groups[k] = v.map(i => G.byId.get(i)).filter(Boolean);
  G.fx = []; G.msgs = []; G.done = false; G.paused = false; G.navVer++; G.dirtyMini = true; G.fogDirty = true;
  renderBase(); buildTerrain(); updVis(); popAndCap();
  $('pause').style.display = 'none'; place = null; amovePending = false; cardSig = '';
  show('game'); resize(); cam = Object.assign({ x: 0, y: 0, z: 1 }, d.cam); clampCam(); uiSpeed(); uiObjectives();
  if (typeof tutClose === 'function') tutClose();
  msg('Kayıt yüklendi: ' + d.title + ' (' + fmtT(d.plain.t) + ')', 'good');
  lastT = performance.now(); acc = 0; if (!running) { running = true; requestAnimationFrame(frame); }
}
// otomatik kayıt: her 3 dakikada bir
setInterval(() => { if (G && running && !G.done && !G.paused && G.t > 30) saveGame('auto', true); }, 180000);
function slotList(mode) {
  return SAVE_SLOTS.map(s => {
    const i = saveInfo(s), nm = s === 'auto' ? 'Otomatik kayıt' : 'Yuva ' + s;
    if (mode === 'save' && s === 'auto') return '';
    const desc = i ? `<b>${i.title}</b> · ${fmtT(i.t)} oyun süresi<br><small>${new Date(i.when).toLocaleString('tr-TR')}</small>` : '<i>boş</i>';
    const dis = mode === 'load' && !i ? ' disabled' : '';
    return `<button class="slot"${dis} onclick="${mode === 'save' ? `saveGame('${s}');closeSlots()` : `closeSlots();loadGame('${s}')`}"><span>${nm}</span><span>${desc}</span></button>`;
  }).join('');
}
function openSlots(mode) { $('slots').style.display = 'flex'; $('slh').textContent = mode === 'save' ? 'Oyunu Kaydet' : 'Kayıtlı Oyunu Yükle'; $('sll').innerHTML = slotList(mode); }
function closeSlots() { $('slots').style.display = 'none'; }
const hasAnySave = () => SAVE_SLOTS.some(s => saveInfo(s));
