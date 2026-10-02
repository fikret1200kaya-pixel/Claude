'use strict';
/* ====== FATİH — Serbest Savaş (rastgele harita, çoklu düşman/müttefik) ====== */
const SK_ENEMIES = [
  { name: 'Bizans', color: '#6c3fa0', sym: '✚', comp: { azap: 3, okcu: 3, sovalye: 1 } },
  { name: 'Macar Krallığı', color: '#1e5fb3', sym: '✚', comp: { azap: 2, okcu: 2, sovalye: 2 } },
  { name: 'Venedik', color: '#c9a227', sym: '✚', comp: { azap: 3, okcu: 3, sovalye: 1 } },
  { name: 'Akkoyunlular', color: '#d8d8d8', sym: '', comp: { sipahi: 3, okcu: 2, azap: 1 } },
  { name: 'Karamanoğulları', color: '#2e8b57', sym: '', comp: { azap: 2, okcu: 2, sipahi: 2 } },
  { name: 'Sırp Despotluğu', color: '#8b1e3f', sym: '✚', comp: { azap: 3, okcu: 2, sovalye: 1 } },
  { name: 'Eflak (Kazıklı Voyvoda)', color: '#4a4a4a', sym: '✚', comp: { sipahi: 2, okcu: 2, azap: 2 } },
];
const SK_ALLIES = [
  { name: 'Rumeli Beylerbeyliği', color: '#e67e22', sym: '☪', comp: { azap: 2, okcu: 2, sipahi: 2, yeniceri: 1 } },
  { name: 'Anadolu Beylerbeyliği', color: '#16a085', sym: '☪', comp: { azap: 2, okcu: 2, sipahi: 2 } },
];
const SK_MAPS = { ova: 'Ova', orman: 'Orman', nehir: 'Nehir', gol: 'Göl', kiyi: 'Kıyı' };
const SK_SIZE = { kucuk: 80, orta: 104, buyuk: 128 };
const SK_RES = { dusuk: { f: 200, w: 200, g: 100 }, normal: { f: 350, w: 350, g: 200 }, yuksek: { f: 900, w: 900, g: 700 } };

function makeSkirmish(o) {
  const seed = o.seed || ((Math.random() * 1e9) | 0), rng = makeRng(seed);
  const pick = arr => arr[(rng() * arr.length) | 0];
  const type = o.map === 'rastgele' ? pick(Object.keys(SK_MAPS)) : o.map;
  const N = 1 + o.allies + o.enemies, W = SK_SIZE[o.size] || 104;
  const enemies = [...SK_ENEMIES].sort(() => rng() - .5).slice(0, o.enemies), allies = SK_ALLIES.slice(0, o.allies);
  const facs = [{ name: 'Osmanlı (Sen)', color: '#c0392b' }, ...allies, ...enemies];
  const team = facs.map((_, i) => i === 0 || i <= o.allies ? 0 : 1);
  const m = {
    title: 'Serbest Savaş', date: SK_MAPS[type] + ' haritası · ' + DIFF[o.diff].name, W, H: W, scale: 1, seed, nPlayers: N, team, diff: o.diff, skirmish: o,
    colors: facs.map(f => f.color), enemy: enemies.map(e => e.name).join(', '), sym: enemies[0] ? enemies[0].sym : '', factions: facs,
    avail: { build: ['ev', 'ambar', 'tarla', 'kisla', 'ahir', 'ocak', 'dokum', 'kule', 'cami', 'medrese', 'pazar'], train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'molla'] },
    start: Object.assign({}, SK_RES[o.res] || SK_RES.normal), heroLose: false, noFog: !!o.reveal,
    winText: 'Bütün düşmanlar yenildi. Zafer Osmanlı\'nın!',
    after: 'Serbest savaş kazanıldı. Yeni bir harita ve rakiplerle tekrar dene.',
    brief: '', objectives: [], events: [],
  };
  const alive = p => G.blds.some(b => b.owner === p && !b.d.wall) || G.ents.some(u => u.kind === 'u' && u.owner === p && !u.dead);
  m.objectives = [{ text: 'Tüm düşmanları yenilgiye uğrat', done: () => { for (let p = 1; p < N; p++) if (team[p] !== 0 && alive(p)) return false; return true; }, prog: () => { let n = 0; for (let p = 1; p < N; p++) if (team[p] !== 0 && alive(p)) n++; return n + ' rakip kaldı'; } }];
  m.tick = () => {
    G.flags.out = G.flags.out || {};
    for (let p = 1; p < N; p++) if (!G.flags.out[p] && !alive(p)) { G.flags.out[p] = 1; msg(facs[p].name + (team[p] === 0 ? ' (müttefik) savaş dışı kaldı.' : ' yenildi!'), team[p] === 0 ? 'warn' : 'good'); }
  };
  m.setup = () => skSetup(m, type, rng, facs, team, o);
  m.events = [
    { t: 2, fn: () => msg('Serbest savaş başladı: ' + enemies.map(e => e.name).join(', ') + (allies.length ? ' — müttefikler: ' + allies.map(a => a.name).join(', ') : ''), 'good') },
    { t: 6, fn: () => msg('İpucu: Pazar inşa edip kaynak alıp satabilirsin. Reayalar boşta kalırsa B tuşu.') },
  ];
  return m;
}

function skSetup(m, type, rng, facs, team, o) {
  const W = G.W, H = G.H, N = facs.length;
  // arazi
  if (type === 'nehir') { const cx = W / 2; for (let y = 0; y < H; y++) { const x0 = Math.round(cx + Math.sin(y * .08) * 5 - 2); const ford = (y % Math.round(H / 3)) < 4 && y > 4 && y < H - 4; if (!ford) setWater(x0, y, x0 + 3, y); } }
  if (type === 'gol') { const r = W * .11; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - W / 2, (y - H / 2) * 1.2) < r + Math.sin(x * .5) * 1.5) setWater(x, y, x, y); }
  if (type === 'kiyi') { for (let x = 0; x < W; x++) { const d = Math.round(H * .1 + Math.sin(x * .12) * 3); setWater(x, H - d, x, H - 1); setTerrain(x, H - d - 2, x, H - d - 1, 3); } }
  const forests = type === 'orman' ? 34 : type === 'ova' ? 8 : 16;
  for (let k = 0; k < forests; k++) forest((rng() * W) | 0, (rng() * H) | 0, 3 + ((rng() * 4) | 0), .75);
  for (let k = 0; k < Math.round(W / 14); k++) { const x = 6 + (rng() * (W - 12)) | 0, y = 6 + (rng() * (H - 12)) | 0; mine(x, y, 4, 800); }
  // üs konumları
  const pos = [];
  if (type === 'nehir') {
    const left = team.map((t, i) => i).filter(i => team[i] === 0), right = team.map((t, i) => i).filter(i => team[i] !== 0);
    left.forEach((p, k) => pos[p] = [W * .17, H * (k + 1) / (left.length + 1)]); right.forEach((p, k) => pos[p] = [W * .83, H * (k + 1) / (right.length + 1)]);
  } else {
    const a0 = rng() * Math.PI * 2, R = W * (type === 'gol' ? .37 : .35);
    for (let i = 0; i < N; i++) { const a = a0 + i / N * Math.PI * 2; pos[i] = [W / 2 + Math.cos(a) * R, H / 2 + Math.sin(a) * R * (type === 'kiyi' ? .8 : 1) - (type === 'kiyi' ? H * .05 : 0)]; }
  }
  for (let i = 0; i < N; i++) {
    const [bx, by] = pos[i].map(Math.round), f = facs[i];
    // üssün çevresini temizle, suyu kurut
    for (let y = by - 7; y <= by + 7; y++) for (let x = bx - 7; x <= bx + 7; x++) if (inb(x, y) && Math.hypot(x - bx, y - by) < 7.5) { const k = idx(x, y); if (G.terrain[k] === 1) G.terrain[k] = 0; G.res[k] = 0; refreshBlk(k); }
    const dir = Math.atan2(H / 2 - by, W / 2 - bx) + Math.PI;  // haritanın dışına doğru
    forest(Math.round(bx + Math.cos(dir) * 10), Math.round(by + Math.sin(dir) * 10), 4, .8);
    forest(Math.round(bx + Math.cos(dir + 1.6) * 10), Math.round(by + Math.sin(dir + 1.6) * 10), 3, .8);
    mine(Math.round(bx + Math.cos(dir - 1.4) * 8), Math.round(by + Math.sin(dir - 1.4) * 8), 4, 900);
    mine(Math.round(bx + Math.cos(dir + 2.6) * 9), Math.round(by + Math.sin(dir + 2.6) * 9), 3, 700);
    berries(Math.round(bx + Math.cos(dir - 2.6) * 6), Math.round(by + Math.sin(dir - 2.6) * 6), 7);
    B('saray', i, bx - 1, by - 1, { label: i === 0 ? 'Saray' : f.name + ' Merkezi' });
    crew('reaya', i, 5, bx + 2, by + 2, {}, 3);
    if (i === 0) { U('fatih', 0, bx - 2, by + 3); crew('azap', 0, 2, bx + 3, by - 2, {}, 2); }
    else {
      crew('azap', i, 2, bx + 3, by - 2, { ai: 'army', rally: { x: bx * TILE, y: (by + 4) * TILE } }, 2);
      const e = team[i] !== 0, d = DIFF[o.diff];
      G.players[i].f = G.players[0].f; G.players[i].w = G.players[0].w; G.players[i].g = G.players[0].g;
      const ai = {
        owner: i, name: f.name, builder: true, n: 0, comp: f.comp,
        workers: e ? [10, 15, 22][o.diff] : 16, maxArmy: e ? [25, 45, 70][o.diff] : 45,
        income: { f: .35, w: .35, g: .25 }, popCap: 200,
        wave: { first: e ? [420, 300, 210][o.diff] : 360, interval: e ? 170 : 200, size: e ? 6 : 8, grow: 2 },
      };
      ai.next = ai.wave.first; G.ais.push(ai);
    }
  }
}
