'use strict';
/* ====== Öğretici: ilk görevde adım adım rehber (kapatılabilir) ====== */
const tutOn = () => { try { return localStorage.getItem('fatih_tut') !== '0'; } catch (e) { return true; } };
function setTut(v) { try { localStorage.setItem('fatih_tut', v ? '1' : '0'); } catch (e) { } uiTut(); }
function uiTut() { const b = $('tutbtn'); if (b) b.textContent = 'Öğretici: ' + (tutOn() ? 'Açık' : 'Kapalı'); }
const hasMine = f => G.ents.some(e => e.owner === 0 && !e.dead && f(e));
const TUT = [
  { t: 'Hoş geldin Sultanım!', x: 'Haritayı <b>ok tuşları</b>, fareyi ekran kenarına götürerek veya kenardaki <b>▲▼◀▶</b> düğmeleriyle kaydır. Fare tekerleğiyle yakınlaş. Şimdi <b>H</b> tuşuna basarak kendini (Fatih) seç.', ok: () => G.hero && G.sel.includes(G.hero) },
  { t: 'Reayaları seç', x: 'Sol tuşa basılı tutup <b>reayaların etrafına kutu çiz</b>. Reayalar işçilerindir: kaynak toplar, bina yapar.', ok: () => G.sel.some(e => e.d.worker) },
  { t: 'Odun topla', x: 'Reayalar seçiliyken bir <b>ağaca sağ tıkla</b>. Odun toplayıp Saray\'a taşıyacaklar.', ok: () => hasMine(e => e.kind === 'u' && e.order.t === 'gather' && e.order.res === 1) },
  { t: 'Yiyecek ve altın', x: 'Bir reayayı <b>yemiş çalısına</b> (yiyecek), birini de <b>altın madenine</b> sağ tıklayarak gönder.', ok: () => hasMine(e => e.kind === 'u' && e.order.t === 'gather' && (e.order.res === 2 || e.order.res === 3)) },
  { t: 'Ev inşa et', x: 'Bir reaya seç, alttaki <b>Ev</b> düğmesine (Q) bas ve boş bir yere tıkla. Evler nüfus sınırını artırır.', ok: () => hasMine(e => e.kind === 'b' && e.type === 'ev' && !e.tutStart) },
  { t: 'Reaya yetiştir', x: '<b>Saray</b>\'a tıkla ve <b>Reaya</b> düğmesine (Q) bas. Ne kadar çok işçi, o kadar güçlü ekonomi. Boştaki işçileri <b>⚒</b> sayacı veya <b>B</b> tuşu bulur.', ok: () => G.blds.some(b => b.owner === 0 && b.queue.some(q => q.type === 'reaya')) || G.ents.filter(e => e.owner === 0 && e.d.worker && !e.dead).length > G.tutW },
  { t: 'Ordu kur', x: 'Reayayla bir <b>Kışla</b> kur (yeterli odun gerekir). Kışladan <b>Azap</b> (mızraklı, atlılara karşı) ve <b>Okçu</b> yetiştir.', ok: () => hasMine(e => e.kind === 'b' && e.type === 'kisla') },
  { t: 'Birim üstünlükleri', x: 'Üstteki <b>📜 İlimler</b> düğmesine (veya <b>I</b>) bas: hangi birimin kime karşı güçlü olduğunu ve Demirhane, Saray, Medrese geliştirmelerini gör.', ok: () => G.tutTree },
  { t: 'Saldırı', x: 'Askerleri seçip <b>düşmana sağ tıkla</b>. <b>V</b>: yol boyunca saldırarak ilerle. <b>G</b>: mevzi al. Görev hedefleri sol üstte. <b>Esc</b> menüsünden oyunu <b>kaydedebilirsin</b>. Kolay gelsin Sultanım!', ok: () => false, last: true },
];
let tutK = -1;
function tutStart() {
  if (!tutOn() || curMission !== 0) { $('tut').style.display = 'none'; tutK = -1; return; }
  for (const b of G.blds) if (b.owner === 0 && b.type === 'ev') b.tutStart = true;
  G.tutW = G.ents.filter(e => e.owner === 0 && e.d.worker).length; tutK = 0; tutShow();
}
function tutShow() {
  const s = TUT[tutK]; if (!s) { tutClose(); return; }
  $('tut').style.display = 'block';
  $('tut').innerHTML = `<div class="tth"><span>Öğretici · ${tutK + 1}/${TUT.length}</span><button onclick="tutClose()" title="Kapat">✕</button></div><h4>${s.t}</h4><p>${s.x}</p><div class="ttf"><label><input type="checkbox" onchange="setTut(!this.checked)"> Bir daha gösterme</label>${s.last ? '<button class="btn sm" onclick="tutClose()">Bitir</button>' : `<button class="btn sm" onclick="tutK++;tutShow()">Atla ▸</button>`}</div>`;
}
function tutClose() { tutK = -1; $('tut').style.display = 'none'; }
setInterval(() => { if (tutK < 0 || !G || !running || G.done) return; const s = TUT[tutK]; if (s && s.ok()) { tutK++; tutShow(); } }, 400);
