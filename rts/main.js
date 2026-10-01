'use strict';
/* ====== FATİH — Menü ve görev akışı ====== */
let curMission = 0;
const prog = () => { try { return +localStorage.getItem('fatih_prog') || 0; } catch (e) { return 0; } };
const setProg = n => { try { localStorage.setItem('fatih_prog', String(Math.max(prog(), n))); } catch (e) { } };
function resetProg() { try { localStorage.removeItem('fatih_prog'); } catch (e) { } buildMenu(); }
function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id); $('hud').classList.toggle('on', id === 'game'); }

function buildMenu() {
  const p = prog(); $('mlist').innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const d = document.createElement('div'); d.className = 'mi' + (i > p ? ' lock' : '');
    d.innerHTML = `<div><b>${i + 1}. ${m.title}</b><small>${m.date}</small></div><span>${i < p ? '✔' : i > p ? '🔒' : '▶'}</span>`;
    d.onclick = () => showBrief(i); $('mlist').appendChild(d);
  });
  if (p >= MISSIONS.length) { const d = document.createElement('div'); d.className = 'mi'; d.innerHTML = '<div><b>Epilog</b><small>Hünkârçayırı, 1481</small></div><span>📜</span>'; d.onclick = showEpilogue; $('mlist').appendChild(d); }
}
function toMenu() { running = false; if (G) G.paused = false; $('pause').style.display = 'none'; buildMenu(); show('menu'); }
function showBrief(i) {
  curMission = i; const m = MISSIONS[i];
  $('bt').textContent = (i + 1) + '. ' + m.title; $('bd').textContent = m.date + ' — Düşman: ' + m.enemy;
  $('bx').textContent = m.brief;
  $('bo').innerHTML = m.objectives.map(o => `<li>${o.text}${o.opt ? ' (isteğe bağlı)' : ''}</li>`).join('');
  $('bw').textContent = i === 5 ? 'Gedik Ahmed Paşa ölürse görev kaybedilir.' : 'Sultan (komutan) ölürse görev kaybedilir.' + (m.timeLimit ? ' Süre sınırı: ' + fmtT(m.timeLimit) + '.' : '');
  $('bgo').onclick = () => startMission(i);
  show('brief');
}
function startMission(i) {
  curMission = i; const m = MISSIONS[i];
  m.objectives.forEach(o => o.ok = false);
  newGame(m); G.rng = makeRng(m.seed); renderBase(); m.setup(); buildTerrain();
  const q = new URLSearchParams(location.search);
  if (q.has('cheat')) { Object.assign(G.players[0], { f: 9999, w: 9999, g: 9999 }); }
  if (q.has('nofog')) m.noFog = true;
  updVis(); popAndCap();
  cam = { x: 0, y: 0, z: 1 }; if (G.hero) centerOn(G.hero.x, G.hero.y); else centerOn(G.W * TILE / 2, G.H * TILE / 2);
  G.sel = G.hero ? [G.hero] : []; place = null; amovePending = false; cardSig = '';
  show('game'); uiSpeed(); uiObjectives(); msg(m.date + ' — ' + m.title, 'good');
  lastT = performance.now(); acc = 0; if (!running) { running = true; requestAnimationFrame(frame); }
}
function restartMission() { $('pause').style.display = 'none'; startMission(curMission); }
function showResult() {
  running = false; const r = G.result, m = G.m, win = r.win;
  if (win) setProg(curMission + 1);
  $('rtitle').textContent = win ? (r.hist ? 'Tarihî Sonuç' : 'Zafer!') : 'Yenilgi'; $('rtext').textContent = r.text;
  $('rhist').textContent = win ? m.after : 'Tarihin akışını değiştirmek için tekrar dene.';
  $('rstat').textContent = `Süre: ${fmtT(G.t)} · Düşman kaybı: ${G.stats.kills} · Kayıplarımız: ${G.stats.lost}`;
  const next = curMission + 1;
  $('rbtns').innerHTML = (win ? `<button class="btn" id="rn">${next < MISSIONS.length ? 'Sonraki Görev' : 'Epilog: Hünkârçayırı'}</button>` : '') + '<button class="btn" id="rr">Yeniden Dene</button><button class="btn" id="rm">Menü</button>';
  if (win) $('rn').onclick = () => next < MISSIONS.length ? showBrief(next) : showEpilogue();
  $('rr').onclick = () => startMission(curMission); $('rm').onclick = toMenu;
  show('result');
}
function showEpilogue() {
  $('et').textContent = EPILOGUE.title; $('el').innerHTML = EPILOGUE.lines.map(l => `<p>${l}</p>`).join(''); show('epi');
}
buildMenu();
(function () { // test için doğrudan başlatma: ?m=3
  const q = new URLSearchParams(location.search); if (q.has('m')) startMission(+q.get('m') - 1);
})();
