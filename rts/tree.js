'use strict';
/* ====== İlimler (teknoloji ağacı) ve birim üstünlükleri ====== */
const TREE_COLS = [['saray', 'Saray'], ['demirhane', 'Demirhane'], ['kisla', 'Kışla'], ['ahir', 'Ahır'], ['ocak', 'Yeniçeri Ocağı'], ['dokum', 'Dökümhane'], ['tersane', 'Tersane'], ['medrese', 'Medrese']];
let treeWasPaused = false;
function openTree(tab) {
  if (!G) return; treeWasPaused = G.paused; G.paused = true;
  const el = $('tree'); el.style.display = 'flex'; G.tutTree = true; treeTab(tab || 'ilim');
}
function closeTree() { $('tree').style.display = 'none'; if (G) G.paused = treeWasPaused; }
function treeTab(tab) {
  document.querySelectorAll('#tree .ttab').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  $('tbody').innerHTML = tab === 'ilim' ? treeHTML() : countersHTML(); fillIcons($('tbody'));
}
function techState(id) {
  if (hasTech(0, id)) return ['done', '✔ Tamamlandı'];
  if (G.blds.some(x => x.owner === 0 && x.queue.some(q => q.type === 'T:' + id))) return ['busy', '⏳ Araştırılıyor'];
  if (!techReqOk(0, id)) return ['lock', '🔒 Önce: ' + TECHS[TECHS[id].req].name];
  return ['open', ''];
}
function treeHTML() {
  const av = G.m.avail.build.concat(['saray']);
  return '<div class="tcols">' + TREE_COLS.filter(([b]) => av.includes(b) && BUILDS[b].techs).map(([b, nm]) => {
    const have = hasBuilt(0, b), techs = BUILDS[b].techs.filter(id => techAvail(id));
    return `<div class="tcol${have ? '' : ' nob'}"><h4>${icH('b', b)}<span>${nm}${have ? '' : '<small>henüz yok</small>'}</span></h4>` + techs.map(id => {
      const T = TECHS[id], [st, lb] = techState(id);
      return `<div class="tc ${st}${T.req ? ' sub' : ''}">${icH('t', id)}<div><b>${T.name}</b><i>${T.desc}</i><em>${st === 'done' || st === 'busy' || st === 'lock' ? lb : costShort(T.cost) + ' · ' + T.time + ' sn'}</em></div></div>`;
    }).join('') + '</div>';
  }).join('') + '</div><p class="tnote">İlimler ilgili binayı seçince komut düğmelerinde görünür. Tamamlanan geliştirmeler sahadaki birimlere de hemen uygulanır.</p>';
}
function countersHTML() {
  const rows = Object.entries(UNITS).filter(([k, d]) => d.str && G.m.avail.train.includes(k));
  const at = { m: 'Yakın dövüş', p: 'Ok', g: 'Barut (zırhın yarısını deler)', s: 'Kuşatma' };
  return `<table class="ctab"><tr><th></th><th>Birim</th><th>Saldırı</th><th>Zırh<br><small>yakın / ok</small></th><th>Güçlü olduğu</th><th>Zayıf olduğu</th></tr>` + rows.map(([k, d]) => {
    const u = { d, owner: 0 }; const mo = s => modOf(0, s, d.cls);
    return `<tr><td>${icH('u', k)}</td><td><b>${d.name}</b></td><td>${Math.round((d.atk + mo('atk')) * (1 + mo('atkp')))} <small>${at[d.at]}</small>${d.bonus ? '<br><small>' + Object.entries(d.bonus).map(([c, v]) => '+' + v + ' ' + CLSN[c]).join(', ') + '</small>' : ''}</td><td>${d.ma + mo('ma')} / ${d.pa + mo('pa')}</td><td class="g">▲ ${d.str}</td><td class="w">▼ ${d.weak}</td></tr>`;
  }).join('') + '</table><p class="tnote">Hasar = saldırı + sınıf ikramiyesi − hedefin ilgili zırhı. Doğru birimi doğru düşmana gönder: mızraklı azaplar süvariyi, süvari okçu ve topları, okçular piyadeyi, yeniçeriler ağır süvariyi yener.</p>';
}
