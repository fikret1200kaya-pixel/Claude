'use strict';
/* ====== FATİH — Menü ve görev akışı ====== */
let curMission = 0;
const prog = () => { try { return +localStorage.getItem('fatih_prog') || 0; } catch (e) { return 0; } };
const setProg = n => { try { localStorage.setItem('fatih_prog', String(Math.max(prog(), n))); } catch (e) { } };
function resetProg() { try { localStorage.removeItem('fatih_prog'); } catch (e) { } buildMenu(); }
function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id); $('hud').classList.toggle('on', id === 'game'); }

const getDiff = () => { try { const v = localStorage.getItem('fatih_diff'); return v == null ? 1 : +v; } catch (e) { return 1; } };
function setDiff(v) { try { localStorage.setItem('fatih_diff', String(v)); } catch (e) { } uiDiff(); }
function uiDiff() { const v = getDiff(); document.querySelectorAll('#diffseg button').forEach(b => b.classList.toggle('on', +b.dataset.v === v)); $('diffcap').textContent = ['Düşman yavaş toplanır, saldırıları küçük; başlangıç kaynağın fazla.', 'Tarihî denge.', 'Düşman hızlı ve kalabalık saldırır, askerleri daha dayanıklı.'][v]; }
document.querySelectorAll('#diffseg button').forEach(b => b.onclick = () => setDiff(+b.dataset.v));
function buildMenu() {
  uiDiff(); uiTut(); $('mepi').hidden = prog() < MISSIONS.length; $('mload').hidden = !hasAnySave();
  const p = prog(); $('mlist').innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const d = document.createElement('div'); d.className = 'mi' + (i > p ? ' lock' : '');
    d.innerHTML = `<span class="num">${ROMAN[i]}</span><div style="flex:1"><b>${m.title}</b><small>${m.date}</small></div><span>${i < p ? '✔' : i > p ? '🔒' : '▶'}</span>`;
    d.onclick = () => showBrief(i); $('mlist').appendChild(d);
  });
  if (p >= MISSIONS.length) { const d = document.createElement('div'); d.className = 'mi'; d.innerHTML = '<div><b>Epilog</b><small>Hünkârçayırı, 1481</small></div><span>📜</span>'; d.onclick = showEpilogue; $('mlist').appendChild(d); }
}
function toMenu() { running = false; $('mepi').hidden = prog() < MISSIONS.length; if (G) G.paused = false; $('pause').style.display = 'none'; buildMenu(); show('menu'); }
function showBrief(i) {
  curMission = i; const m = MISSIONS[i];
  $('bt').textContent = (i + 1) + '. ' + m.title; $('bd').textContent = m.date + ' — Düşman: ' + m.enemy;
  $('bx').textContent = m.brief;
  $('bo').innerHTML = m.objectives.map(o => `<li>${o.text}${o.opt ? ' (isteğe bağlı)' : ''}</li>`).join('');
  $('bw').textContent = m.title === 'Otranto' ? 'Gedik Ahmed Paşa ölürse görev kaybedilir.' : 'Sultan (komutan) ölürse görev kaybedilir.' + (m.timeLimit ? ' Süre sınırı: ' + fmtT(m.timeLimit) + '.' : '');
  const pc = $('bpor'); pc.hidden = !drawPortrait(pc, m.title === 'Otranto' ? 'pasa' : 'fatih', m.title === 'Otranto' ? 'sipahi' : 'fatih');
  $('brief').style.background = `linear-gradient(180deg,rgba(8,4,2,.2),rgba(8,4,2,.7)), ${artBg(mArt(i))}`;
  $('bgo').onclick = () => startMission(i);
  show('brief');
}
function startMission(i) {
  curMission = i; const m = MISSIONS[i]; m.diff = getDiff();
  startGame(m);
}
let lastSkirm = null;
function showSkirmish() { $('skdiff').value = String(getDiff()); show('skirm'); }
function startSkirmish(again) {
  if (!again) lastSkirm = { map: $('skmap').value, size: $('sksize').value, enemies: +$('skenemy').value, allies: +$('skally').value, diff: +$('skdiff').value, res: $('skres').value, reveal: $('skreveal').checked };
  curMission = -1; startGame(makeSkirmish(Object.assign({}, lastSkirm)));
}
function startGame(m) {
  m.objectives.forEach(o => o.ok = false);
  newGame(m); G.rng = makeRng(m.seed); renderBase(); m.setup(); scatterNature(); scatterFish(); buildTerrain();
  const q = new URLSearchParams(location.search);
  if (q.has('cheat')) { Object.assign(G.players[0], { f: 9999, w: 9999, g: 9999 }); }
  if (q.has('nofog')) m.noFog = true;
  updVis(); popAndCap();
  cam = { x: 0, y: 0, z: 1 }; if (G.hero) centerOn(G.hero.x, G.hero.y); else centerOn(G.W * TILE / 2, G.H * TILE / 2);
  G.sel = G.hero ? [G.hero] : []; place = null; amovePending = false; cardSig = '';
  show('game'); resize(); if (G.hero) centerOn(G.hero.x, G.hero.y); uiSpeed(); uiObjectives(); msg(m.date + ' — ' + m.title, 'good'); tutStart();
  lastT = performance.now(); acc = 0; if (!running) { running = true; requestAnimationFrame(frame); }
}
function restartMission() { $('pause').style.display = 'none'; if (curMission < 0) startSkirmish(true); else startMission(curMission); }
function showResult() {
  running = false; const r = G.result, m = G.m, win = r.win;
  if (win && curMission >= 0) { setProg(curMission + 1); showStory(curMission, r); return; }
  $('rtitle').textContent = win ? (r.hist ? 'Tarihî Sonuç' : 'Zafer!') : 'Yenilgi'; $('rtext').textContent = r.text;
  $('rhist').textContent = win ? m.after : 'Tarihin akışını değiştirmek için tekrar dene.';
  $('rstat').textContent = `Süre: ${fmtT(G.t)} · Düşman kaybı: ${G.stats.kills} · Kayıplarımız: ${G.stats.lost}`;
  const next = curMission + 1;
  $('rbtns').innerHTML = (win ? `<button class="btn" id="rn">${next < MISSIONS.length ? 'Sonraki Görev' : 'Epilog: Hünkârçayırı'}</button>` : '') + '<button class="btn" id="rr">Yeniden Dene</button><button class="btn" id="rm">Menü</button>';
  if (curMission < 0) { $('rbtns').innerHTML = '<button class="btn" id="rr">Yeni Harita</button><button class="btn" id="rs">Ayarlar</button><button class="btn" id="rm">Menü</button>'; $('rs').onclick = showSkirmish; }
  else if (win) $('rn').onclick = () => next < MISSIONS.length ? showBrief(next) : showEpilogue();
  $('rr').onclick = () => curMission < 0 ? startSkirmish(true) : startMission(curMission); $('rm').onclick = toMenu;
  show('result');
}
function showEpilogue() {
  $('et').textContent = EPILOGUE.title; $('el').innerHTML = EPILOGUE.lines.map(l => `<p>${l}</p>`).join(''); show('epi');
}
buildMenu();
/* ---------- menü arka planı: alacakaranlıkta İstanbul silüeti ---------- */
function drawMenuBg() {
  const W = Math.max(800, innerWidth), H = Math.max(500, innerHeight), c = mkCanvas(W, H), x = c.getContext('2d'), r = makeRng(1453);
  const sky = x.createLinearGradient(0, 0, 0, H * .72); sky.addColorStop(0, '#0d0a1c'); sky.addColorStop(.45, '#3a1c2e'); sky.addColorStop(.8, '#a8462a'); sky.addColorStop(1, '#e8a04a'); x.fillStyle = sky; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,245,220,${r() * .7})`; x.fillRect(r() * W, r() * H * .45, 1.3, 1.3); }
  x.fillStyle = '#f6e7b8'; x.beginPath(); x.arc(W * .8, H * .2, 34, 0, 7); x.fill(); x.fillStyle = sky; x.fillStyle = '#1a1024'; x.beginPath(); x.arc(W * .8 + 13, H * .2 - 6, 30, 0, 7); x.fill();
  const sea = H * .74; const sg = x.createLinearGradient(0, sea, 0, H); sg.addColorStop(0, '#c0703a'); sg.addColorStop(.25, '#4a2a2a'); sg.addColorStop(1, '#0b0805'); x.fillStyle = sg; x.fillRect(0, sea, W, H - sea);
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,200,120,${r() * .35})`; x.fillRect(r() * W, sea + r() * (H - sea) * .5, 10 + r() * 30, 1.2); }
  const sil = '#120a0c'; x.fillStyle = sil;
  // tepeler
  x.beginPath(); x.moveTo(0, sea); for (let i = 0; i <= 40; i++) { const px = i / 40 * W; x.lineTo(px, sea - 26 - Math.sin(i * .7) * 10 - Math.sin(i * .23) * 18); } x.lineTo(W, sea); x.fill();
  const domeAt = (cx, base, rw, h) => { x.beginPath(); x.moveTo(cx - rw, base); x.bezierCurveTo(cx - rw, base - h * 1.3, cx + rw, base - h * 1.3, cx + rw, base); x.fill(); x.fillRect(cx - 1, base - h - 14, 2, 14); };
  const minaret = (cx, base, h) => { x.fillRect(cx - 3, base - h, 6, h); x.beginPath(); x.moveTo(cx - 4, base - h); x.lineTo(cx, base - h - 24); x.lineTo(cx + 4, base - h); x.fill(); x.fillRect(cx - 6, base - h * .7, 12, 3); };
  const mosque = (cx, s) => { const base = sea - 30; x.fillRect(cx - 90 * s, base - 40 * s, 180 * s, 42 * s); domeAt(cx, base - 40 * s, 62 * s, 54 * s); domeAt(cx - 70 * s, base - 30 * s, 26 * s, 20 * s); domeAt(cx + 70 * s, base - 30 * s, 26 * s, 20 * s); for (const k of [-1, 1]) { minaret(cx + k * 112 * s, base, 150 * s); minaret(cx + k * 132 * s, base + 4, 130 * s); } };
  mosque(W * .32, 1); mosque(W * .66, .7);
  for (let i = 0; i < 30; i++) { const px = r() * W, hh = 20 + r() * 30; x.fillRect(px, sea - 30 - hh, 20 + r() * 26, hh + 6); }
  // ön planda surlar
  const wy = H * .9; x.fillStyle = '#0b0607'; x.fillRect(0, wy, W, H - wy); for (let px = 0; px < W; px += 22) x.fillRect(px, wy - 10, 12, 10); for (let k = 0; k < 6; k++) { const px = k * W / 5; x.fillRect(px - 26, wy - 52, 52, 60); for (let q = 0; q < 3; q++) x.fillRect(px - 26 + q * 20, wy - 62, 12, 10); }
  const v = x.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  const url = c.toDataURL('image/jpeg', .85);
  for (const s of document.querySelectorAll('.screen')) {
    if (s.id === 'story' || s.id === 'camp') continue;
    const img = s.id === 'menu' ? 'menu_bg.jpg' : 'camp_bg.jpg', art = artURL({ menu: 'menu', skirm: 'skirmish', epi: 'epilog' }[s.id]);
    const shade = s.id === 'menu' ? 'linear-gradient(90deg,rgba(8,4,2,.5),rgba(8,4,2,0) 45%)' : 'linear-gradient(180deg,rgba(8,4,2,.35),rgba(8,4,2,.75))';
    s.style.background = `${shade}, ${art ? `url(${art}) ${s.id === 'menu' ? 'right' : 'center'}/cover no-repeat, ` : ''}url(assets/${img}) center/cover no-repeat, #0b0805 url(${url}) center/cover no-repeat`;
  }
}
drawMenuBg();
loadBlender(() => { // Blender sprite atlasları yüklendikten sonra başla
  if (BL.ok) Object.assign(BH, {'demirhane': 51, 'tersane': 71, 'pazar': 47, 'cami': 44, 'medrese': 44, 'saray': 94, 'ev': 75, 'ambar': 68, 'tarla': 23, 'kisla': 102, 'ahir': 73, 'ocak': 63, 'dokum': 85, 'kule': 101, 'burc': 95, 'sur': 30, 'kapi': 24, 'kale': 134, 'hisar': 35, 'kamp': 45, 'ayasofya': 68});
  const q = new URLSearchParams(location.search); if (q.has('m')) startMission(+q.get('m') - 1);
});
