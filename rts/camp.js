'use strict';
/* ====== Sefer haritası: parşömen üstünde Fatih'in seferleri ====== */
const artURL = n => (typeof ART !== 'undefined' && ART.includes(n)) ? 'assets/art/' + n + '.jpg' : null;
const ART_IMG = {}; // boyalı portreler oyun içinde de kullanılır
if (typeof ART !== 'undefined') for (const n of ART) if (n.startsWith('p_')) { const im = new Image(); im.onload = () => { if (typeof ICONS !== 'undefined') ICONS.clear(); }; im.src = 'assets/art/' + n + '.jpg'; ART_IMG[n.slice(2)] = im; }
const artPortrait = look => { const im = ART_IMG[look === 'sahi' ? 'top' : look]; return im && im.complete && im.naturalWidth ? im : null; };

const CM = { lon0: 12, lon1: 42, lat0: 34.6, lat1: 48, k: Math.cos(41.5 * Math.PI / 180) };
const GEO = {
  med: [[12, 41.9], [13, 41.2], [14.2, 40.8], [14.8, 40.6], [15.6, 40.1], [16, 39.5], [15.6, 38.3], [16, 38], [16.5, 38.4], [17.1, 39], [16.6, 39.6], [17.2, 40.4], [17.9, 40.2], [18.4, 39.8], [18.5, 40.1], [18, 40.6], [17, 41.1], [15.9, 41.6], [16.1, 41.9], [15.3, 41.9], [14.2, 42.4], [13.5, 43.6], [12.3, 44.5], [12.3, 45.4], [13.7, 45.6], [14.3, 45.2], [15.2, 44.2], [15.9, 43.5], [17, 43], [18.5, 42.4], [19.4, 41.9], [19.5, 41.3], [19.4, 40.4], [20, 39.7], [20.7, 39], [21.4, 38.4], [21.1, 37.8], [21.7, 36.8], [22.4, 36.4], [22.8, 36.5], [22.9, 37.5], [23.2, 37.9], [24, 38.2], [22.9, 39.3], [22.6, 40.2], [23, 40.6], [23.7, 40.2], [24.4, 40.9], [26, 40.8], [26.2, 40.4], [26.1, 40.05], [26.2, 39.4], [26.8, 39], [26.4, 38.2], [27.3, 37.9], [27.3, 37], [28, 36.8], [29.6, 36.2], [30.6, 36.8], [31.5, 36.6], [32.5, 36.1], [34.6, 36.8], [36.2, 36.6], [35.9, 35.5], [35.8, 34.5], [35.6, 33], [9, 33], [9, 44.2], [10.3, 43.5], [11.1, 42.4]],
  black: [[28.2, 41.4], [27.9, 42], [27.5, 42.5], [28, 43.2], [28.6, 43.8], [28.8, 44.5], [29.6, 45], [30.2, 45.8], [30.7, 46.5], [31.8, 46.6], [32.6, 46], [33.6, 45.9], [33.6, 45.2], [33.4, 44.6], [34.3, 44.4], [35.4, 44.8], [36.6, 45.3], [37.3, 44.9], [38.3, 44.4], [39.7, 43.6], [40.8, 43], [41.6, 41.6], [40, 41], [37.8, 41.1], [36.3, 41.6], [35, 42], [33, 41.9], [31, 41.1], [29.2, 41.2]],
  marmara: [[26.1, 40.05], [26.7, 40.4], [27.5, 41], [28.6, 41], [29, 41.02], [29.4, 40.8], [29.9, 40.75], [29.1, 40.4], [28, 40.4], [27.3, 40.4], [26.6, 40.2]],
  islands: [[[12.4, 38.1], [13.4, 38.2], [15.6, 38.3], [15.1, 36.7], [14.3, 37], [12.5, 37.6]], [[23.5, 35.6], [24.3, 35.4], [26.3, 35.3], [26.1, 35], [24.6, 34.95], [23.5, 35.3]], [[32.3, 35.1], [33, 35.35], [34.6, 35.7], [34, 35], [33, 34.6], [32.3, 34.8]], [[22.8, 38.9], [24.6, 38.1], [24.2, 38], [22.9, 38.7]], [[25.9, 39.3], [26.6, 39.3], [26.5, 39], [25.9, 39.1]], [[27.7, 36.4], [28.2, 36.45], [28, 35.9]]],
  lakes: [[33.4, 38.8, .45, .3], [17.7, 46.85, .45, .12], [36.6, 46.3, 1.3, .55], [31.7, 37.8, .35, .2]],
  rivers: [[[12, 47.9], [16.4, 48.2], [17.6, 47.8], [19, 47.6], [18.9, 46], [20.5, 44.8], [22.5, 44.6], [24, 43.7], [25.9, 43.9], [27.9, 44.1], [28.2, 45.4], [29.6, 45.2]], [[15.2, 46], [16, 45.8], [18, 45.1], [19.3, 44.9], [20.5, 44.8]], [[38.5, 39.7], [36.8, 39.3], [34.5, 39.2], [33.8, 40.2], [34.4, 41.2], [35.9, 41.7]], [[41.2, 39.9], [39.5, 39.7], [38.9, 39], [38.3, 38.3], [38, 37], [38.4, 36]]],
  mts: [[23.5, 42.8, 3.5], [32, 37.2, 5], [37.5, 40.4, 4], [24.5, 46.2, 3], [18, 43.8, 2.5], [14.2, 42, 2], [41, 38.5, 1.6], [21.5, 39.8, 1.6]],
  seas: [['Karadeniz', 34, 43.3, 0], ['Akdeniz', 18.5, 36.2, 0], ['Adalar Denizi', 25.1, 37.3, -.25], ['Adriyatik', 15.6, 42.9, -.62]],
  regions: [['RUMELİ', 24.4, 42.1], ['ANADOLU', 31.6, 39.6], ['MACARİSTAN', 20.8, 46.8], ['EFLAK', 25.2, 44.6], ['BOĞDAN', 27.6, 47], ['AKKOYUNLU', 40.3, 38.1], ['NAPOLİ', 15.4, 40.9], ['KARAMAN', 32.6, 37.9], ['SIRBİSTAN', 20.6, 43.5]],
  cities: [['Bursa', 29.06, 40.18], ['Konya', 32.5, 37.87], ['Buda', 19.04, 47.5], ['Venedik', 12.33, 45.44], ['Atina', 23.73, 37.98], ['Sofya', 23.32, 42.7], ['Varna', 27.9, 43.2], ['Kefe', 35.38, 45.03]],
};
// görev konumları: [boylam, enlem, etiket ofseti x, y (px)]
const CAMP_XY = { 'Tahta Çıkış': [26.56, 41.68, -10, -34], 'Boğazkesen': [29.06, 41.1, 26, -30], 'İstanbul\'un Fethi': [28.95, 41.0, -36, 26], 'Belgrad Kuşatması': [20.46, 44.82, 0, -34], 'Trabzon': [39.72, 41.0, -10, -36], 'Eflak Seferi': [25.46, 44.93, 0, -34], 'Eğriboz': [23.6, 38.46, -30, 22], 'Otlukbeli': [39.8, 40.0, 26, 26], 'İşkodra Kuşatması': [19.51, 42.07, -34, -16], 'Otranto': [18.49, 40.15, 26, 20] };
const CAMP_PTS = MISSIONS.map(m => CAMP_XY[m.title] || [30, 40, 0, -30]);
let campSel = 0, campHit = [];
function campProj(W, H) {
  const gw = (CM.lon1 - CM.lon0) * CM.k, gh = CM.lat1 - CM.lat0, s = Math.min(W / gw, H / gh) * .98;
  const ox = (W - gw * s) / 2, oy = (H - gh * s) / 2;
  return (lon, lat) => [ox + (lon - CM.lon0) * CM.k * s, oy + (CM.lat1 - lat) * s];
}
const PARCH = new Image(); PARCH.src = 'assets/ui/parchment.jpg'; PARCH.onload = () => { if ($('camp').classList.contains('on')) drawCampMap(); };
function drawCampMap() {
  const cv = $('cmapc'), dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr; const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const P = campProj(W, H), sc = P(13, 40)[0] - P(12, 40)[0]; // 1 derece boylam kaç piksel
  if (PARCH.complete && PARCH.naturalWidth) x.drawImage(PARCH, 0, 0, W, H); else { x.fillStyle = '#e2cda0'; x.fillRect(0, 0, W, H); }
  const path = pts => { x.beginPath(); pts.forEach(([lo, la], i) => { const [px, py] = P(lo, la); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); };
  const seaPath = () => { x.beginPath(); for (const k of ['med', 'black', 'marmara']) { GEO[k].forEach(([lo, la], i) => { const [px, py] = P(lo, la); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); } for (const [lo, la, rx, ry] of GEO.lakes) { const [px, py] = P(lo, la); x.moveTo(px + rx * sc, py); x.ellipse(px, py, rx * sc, ry * sc / CM.k, 0, 0, 7); } };
  // deniz: suluboya mavi + kıyı boyunca eski harita çizgileri
  x.save(); seaPath(); x.fillStyle = 'rgba(64,112,124,.42)'; x.fill(); x.clip();
  for (const isl of GEO.islands) { path(isl); x.fillStyle = PARCH.complete ? '#d8c08e' : '#e2cda0'; x.fill(); }
  x.lineJoin = 'round'; for (let i = 5; i >= 1; i--) { x.strokeStyle = `rgba(40,80,92,${.05 + .03 * (5 - i)})`; x.lineWidth = i * 5; for (const k of ['med', 'black', 'marmara']) { path(GEO[k]); x.stroke(); } for (const isl of GEO.islands) { path(isl); x.stroke(); } }
  x.restore();
  x.strokeStyle = '#4a3218'; x.lineWidth = 1.6; x.lineJoin = 'round';
  for (const k of ['med', 'black', 'marmara']) { path(GEO[k]); x.stroke(); } for (const isl of GEO.islands) { path(isl); x.fillStyle = 'rgba(226,205,160,.85)'; x.fill(); x.stroke(); }
  for (const [lo, la, rx, ry] of GEO.lakes) { const [px, py] = P(lo, la); x.beginPath(); x.ellipse(px, py, rx * sc, ry * sc / CM.k, 0, 0, 7); x.fillStyle = 'rgba(64,112,124,.45)'; x.fill(); x.stroke(); }
  // nehirler
  x.strokeStyle = 'rgba(40,90,110,.75)'; x.lineWidth = 1.8; x.lineCap = 'round';
  for (const r of GEO.rivers) { x.beginPath(); r.forEach(([lo, la], i) => { const [px, py] = P(lo, la); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); }
  // dağlar
  const rr = makeRng(7); x.lineWidth = 1.3;
  for (const [lo, la, len] of GEO.mts) for (let i = 0; i < len * 3; i++) {
    const [px, py] = P(lo - len / 2 + rr() * len, la + (rr() - .5) * .9), h = 5 + rr() * 6;
    x.fillStyle = 'rgba(120,90,50,.35)'; x.beginPath(); x.moveTo(px - h, py); x.lineTo(px, py - h * 1.2); x.lineTo(px + h, py); x.fill();
    x.strokeStyle = 'rgba(70,46,20,.8)'; x.beginPath(); x.moveTo(px - h, py); x.lineTo(px, py - h * 1.2); x.lineTo(px + h * .9, py); x.stroke();
  }
  const fs = Math.max(11, Math.min(18, sc * .5));
  x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const [t, lo, la, rot] of GEO.seas) { const [px, py] = P(lo, la); x.save(); x.translate(px, py); x.rotate(rot); x.font = `italic ${fs * 1.25}px 'Crimson Pro',Georgia,serif`; x.fillStyle = 'rgba(30,64,80,.8)'; x.fillText(t, 0, 0); x.restore(); }
  x.font = `700 ${fs * .95}px Cinzel,Georgia,serif`; x.fillStyle = 'rgba(110,70,30,.55)';
  for (const [t, lo, la] of GEO.regions) { const [px, py] = P(lo, la); x.save(); x.translate(px, py); if (x.letterSpacing !== undefined) x.letterSpacing = '4px'; x.fillText(t, 0, 0); x.restore(); }
  x.font = `${fs * .85}px 'Crimson Pro',Georgia,serif`;
  for (const [t, lo, la] of GEO.cities) { const [px, py] = P(lo, la); x.fillStyle = '#3a2210'; x.beginPath(); x.arc(px, py, 2.6, 0, 7); x.fill(); x.fillText(t, px, py + fs * .8); }
  // pusula
  { const [cx, cy] = [W - 60, H - 64], r = 34; x.save(); x.translate(cx, cy); x.strokeStyle = '#4a3218'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, r * .7, 0, 7); x.stroke();
    for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); const l = i % 2 ? r * .55 : r; x.fillStyle = i % 2 ? '#8a6a3a' : '#7a1f17'; x.beginPath(); x.moveTo(0, -l); x.lineTo(5, 0); x.lineTo(-5, 0); x.fill(); }
    x.restore(); x.font = `700 ${fs}px Cinzel,serif`; x.fillStyle = '#5a1810'; x.fillText('K', cx, cy - r - 10); }
  // sefer güzergâhı
  const p = prog(), pts = CAMP_PTS.map(([lo, la]) => P(lo, la));
  x.setLineDash([6, 6]); x.lineWidth = 2.6;
  for (let i = 1; i < pts.length; i++) { x.strokeStyle = i <= p ? 'rgba(142,42,34,.9)' : 'rgba(80,60,40,.45)'; x.beginPath(); const [a, b] = [pts[i - 1], pts[i]]; x.moveTo(a[0], a[1]); x.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 30, b[0], b[1]); x.stroke(); }
  x.setLineDash([]);
  // görev işaretleri
  campHit = [];
  CAMP_PTS.forEach(([lo, la, dx, dy], i) => {
    const [px, py] = pts[i], bx = px + dx, by = py + dy, lock = i > p, done = i < p, sel = i === campSel;
    x.strokeStyle = '#3a2210'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(bx, by); x.stroke();
    x.fillStyle = '#3a2210'; x.beginPath(); x.arc(px, py, 3.5, 0, 7); x.fill();
    const r = sel ? 19 : 15;
    if (sel) { x.fillStyle = 'rgba(255,220,120,.5)'; x.beginPath(); x.arc(bx, by, r + 9, 0, 7); x.fill(); }
    // kalkan
    x.save(); x.translate(bx, by); x.beginPath(); x.moveTo(-r, -r); x.lineTo(r, -r); x.lineTo(r, 0); x.quadraticCurveTo(r, r * .9, 0, r * 1.35); x.quadraticCurveTo(-r, r * .9, -r, 0); x.closePath();
    x.fillStyle = lock ? '#6a6258' : done ? '#5e1a12' : '#a8352a'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 6; x.shadowOffsetY = 2; x.fill(); x.shadowColor = 'transparent';
    x.strokeStyle = lock ? '#3a342c' : '#e2b450'; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = lock ? '#cfc6b6' : '#fff3c4'; x.font = `900 ${r * .95}px Cinzel,serif`; x.font = `900 ${r * (i > 8 ? .7 : .95)}px Cinzel,serif`; x.fillText(ROMAN[i], 0, -1);
    if (done) { x.font = `700 ${r * .7}px serif`; x.fillStyle = '#f3d68a'; x.fillText('✔', r * .95, -r * .95); }
    x.restore();
    x.font = `700 ${fs * .95}px Cinzel,Georgia,serif`; x.fillStyle = lock ? 'rgba(60,40,20,.55)' : '#5a1810';
    const ty = dy > 0 ? by + r * 1.35 + fs * .8 : by - r - fs * .7; x.lineWidth = 3; x.strokeStyle = 'rgba(240,225,190,.8)'; x.strokeText(MISSIONS[i].title, bx, ty); x.fillText(MISSIONS[i].title, bx, ty);
    campHit.push([bx, by, r + 10, i]);
  });
}
function campSelect(i) {
  campSel = i; const m = MISSIONS[i], p = prog(), lock = i > p;
  $('ctl').textContent = m.title; $('cdt').textContent = m.date; $('cdx').textContent = m.brief.split('\n')[0];
  $('cnum').textContent = ROMAN[i];
  const art = artURL(mArt(i)); $('cprev').style.backgroundImage = `linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.45)), url(${art || 'assets/camp_bg.jpg'})`;
  drawPortrait($('cpor'), m.title === 'Otranto' ? 'pasa' : 'fatih', m.title === 'Otranto' ? 'sipahi' : 'fatih');
  $('cgo').disabled = lock; $('cgo').textContent = lock ? '🔒 Önceki seferi tamamla' : 'Brifinge Geç ▸'; $('cgo').onclick = () => showBrief(i);
  document.querySelectorAll('#mlist .mi').forEach((d, k) => d.classList.toggle('sel', k === i));
  drawCampMap();
}
// portre: önce ChatGPT resmi, yoksa Blender portresi
function drawPortrait(pc, artName, look) {
  const c = pc.getContext('2d'), W = pc.width; c.clearRect(0, 0, W, W);
  const g = c.createRadialGradient(W / 2, W * .38, 10, W / 2, W / 2, W * .7); g.addColorStop(0, '#7a5530'); g.addColorStop(1, '#1a0f07'); c.fillStyle = g; c.fillRect(0, 0, W, W);
  const im = artPortrait(artName) || artPortrait(look);
  if (im) { c.drawImage(im, 0, 0, W, W); return true; }
  if (typeof BL !== 'undefined' && BL.ok && SPRITES.portraits) { const f = SPRITES.portraits.f[look], img = BL.imgs[SPRITES.portraits.img]; if (f && img) { c.drawImage(img, f[0], f[1], f[2], f[3], 0, 0, W, W); return true; } }
  return false;
}
function showCamp() { buildMenu(); show('camp'); campSelect(Math.min(prog(), MISSIONS.length - 1)); }
$('cmapc').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  for (const [bx, by, rad, i] of campHit) if (Math.hypot(mx - bx, my - by) < rad) { campSelect(i); return; }
});
$('cmapc').addEventListener('dblclick', e => { if (campSel <= prog()) showBrief(campSel); });
addEventListener('resize', () => { if ($('camp').classList.contains('on')) drawCampMap(); });

/* ====== Bölüm sonu: resimli hikâye + sonraki seferin ön gösterimi ====== */
const STORY_A = [
  ["Şubat 1451. II. Murad'ın ölüm haberi Manisa'ya ulaştığında Şehzade Mehmed atına atladı: \"Beni seven ardımdan gelsin!\" Günler sonra Edirne'de ikinci kez tahta oturdu.",
    "Karamanoğlu İbrahim Bey genç sultanı sınamak için ayaklandı. Mehmed ordusunu Anadolu'ya yürüttü; Karaman beyi barış dilemek zorunda kaldı.",
    "Avrupa sarayları onu tecrübesiz bir genç sanıyordu. Yanıldıklarını anlamaları uzun sürmeyecekti."],
  ["15 Nisan 1452'de temel atıldı. Sultan bizzat taş taşıdı; vezirleri kuleleri yarıştırarak yükseltti: Saruca Paşa, Zağanos Paşa ve Çandarlı Halil Paşa kuleleri.",
    "Dört ayı bulmadan, 31 Ağustos'ta hisar tamamlandı. Kulelere yerleştirilen toplarla Boğaz'dan izinsiz geçebilen gemi kalmadı.",
    "XI. Konstantinos elçi üstüne elçi gönderdi; ama şehir artık iki hisarın arasında, boğazından yakalanmıştı."],
  ["6 Nisan 1453. Ordu Theodosius Surları'nın önünde. Orban'ın dev topları gece gündüz bin yıllık surları dövdü.",
    "22 Nisan gecesi gemiler yağlanmış kızaklar üstünde karadan Haliç'e indirildi. Zincir aşılmış, şehir iki yandan kuşatılmıştı.",
    "29 Mayıs şafağında son hücumda yeniçeriler surlara sancak dikti. 21 yaşındaki Sultan şehre girdi; Ayasofya'da ilk namaz kılındı. Artık o \"Fatih\"ti."],
  ["Temmuz 1456. Osmanlı ordusu Tuna ile Sava'nın birleştiği yerde Belgrad'ı kuşattı; toplar kaleyi günlerce dövdü.",
    "Hunyadi Yanoş'un nehir filosu Osmanlı gemilerini dağıttı, kaleye yardım ulaştı. Sultan bizzat çarpışmaya girdi ve yaralandı.",
    "Kuşatma kaldırıldı. Fatih ders aldı: büyük seferler büyük hazırlık ister. Gözünü yeniden doğuya ve denizlere çevirdi."],
  ["11 Ağustos 1473, Erzincan yakınlarında Otlukbeli. Uzun Hasan'ın Türkmen atlıları dalga dalga saldırdı.",
    "Yeniçeri tüfekleri ve sahra topları arabaların ardından ateş açtı; Akkoyunlu süvarisi barut dumanının içinde dağıldı.",
    "Zafer Anadolu'nun birliğini sağladı. İki kıtanın hâkimi Fatih, bakışlarını şimdi İtalya'ya çevirdi."],
  ["Temmuz 1480. Gedik Ahmed Paşa komutasındaki donanma Apulia kıyısına asker çıkardı.",
    "İki haftalık kuşatmanın ardından 11 Ağustos'ta Otranto düştü. Roma'da telaş başladı; Papa şehri terk etmeyi düşündü.",
    "Ertesi bahar Fatih yeni bir sefere çıktı. Ama ordunun hedefi hiçbir zaman açıklanmayacaktı..."],
];
const TEASE_A = [
  "Boğaz'ın en dar yerinde, Bizans'ın gözü önünde bir hisar yükselecek. Hisarı Bizans tamamlanmadan bitirebilecek misin?",
  "Bin yıllık surlar, Orban'ın dev topları ve 53 gün sürecek bir kuşatma. Tarihin akışı değişmek üzere.",
  "Tuna kıyısında Macaristan'ın anahtarı: Belgrad. Hunyadi Yanoş ve haçlı ordusu yaklaşıyor.",
  "Doğuda Akkoyunlu Uzun Hasan güçleniyor. İki büyük ordu Otlukbeli'nde karşılaşacak.",
  "Gedik Ahmed Paşa'nın donanması Adriyatik'i geçiyor. Hedef İtalya kıyısı: Otranto.",
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const OLD6 = ['Tahta Çıkış', 'Boğazkesen', 'İstanbul\'un Fethi', 'Belgrad Kuşatması', 'Otlukbeli', 'Otranto'];
const STORY = {}, TEASE = {}; OLD6.forEach((t, i) => { STORY[t] = STORY_A[i]; if (i) TEASE[t] = TEASE_A[i - 1]; });
const mStory = m => m.story || STORY[m.title] || [], mTease = m => m.tease || TEASE[m.title] || '';
const mArt = (i) => MISSIONS[i].art || 'brief' + (i + 1);
let storyQ = [], storyK = 0;
const artBg = (name, pos) => `url(${artURL(name) || 'assets/camp_bg.jpg'}) ${pos || 'center'}/cover no-repeat, url(assets/camp_bg.jpg) center/cover no-repeat`;
function showStory(i, r) {
  const m = MISSIONS[i], st = `Süre: ${fmtT(G.t)} · Düşman kaybı: ${G.stats.kills} · Kayıplarımız: ${G.stats.lost}`;
  const kick = `${ROMAN[i]}. Sefer · ${m.title}`, img = mArt(i);
  storyQ = [{ img, pos: '50% 50%', kick, title: r.hist ? 'Tarihî Sonuç' : 'Zafer!', text: r.text, foot: st }];
  mStory(m).forEach((t, k) => storyQ.push({ img, pos: ['20% 40%', '80% 60%', '50% 30%'][k], kick, title: m.date, text: t }));
  const n = i + 1;
  if (n < MISSIONS.length) { const nm = MISSIONS[n]; storyQ.push({ img: mArt(n), pos: '50% 50%', kick: 'Sıradaki Sefer', title: `${ROMAN[n]}. ${nm.title}`, text: mTease(nm), sub: nm.date, next: n }); }
  else storyQ.push({ img: 'epilog', pos: '50% 50%', kick: 'Son', title: 'Hünkârçayırı, 1481', text: 'Cihan Padişahı\'nın son yolculuğu.', next: -1 });
  storyK = 0; show('story'); storyGo(0);
}
function storyGo(k) {
  storyK = k; const s = storyQ[k], last = k === storyQ.length - 1;
  const bg = $('sbg'); bg.style.background = artBg(s.img, s.pos); bg.classList.remove('kb'); void bg.offsetWidth; bg.classList.add('kb');
  const box = $('sbox'); box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); box.classList.toggle('prev', !!s.next || s.next === 0);
  $('skick').textContent = s.kick; $('sh').textContent = s.title; $('ssub').textContent = s.sub || ''; $('stx').textContent = s.text; $('sfoot').textContent = s.foot || '';
  $('sdots').innerHTML = storyQ.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('');
  let b = '';
  if (!last) b = `<button class="btn" onclick="storyGo(${k + 1})">Devam ▸</button>` + (k < storyQ.length - 2 ? ` <button class="btn sm" onclick="storyGo(${storyQ.length - 1})">Geç</button>` : '');
  else if (s.next >= 0) b = `<button class="btn" onclick="showBrief(${s.next})">Sefere Başla ▸</button> <button class="btn" onclick="showCamp()">Sefer Haritası</button> <button class="btn" onclick="toMenu()">Ana Menü</button>`;
  else b = `<button class="btn" onclick="showEpilogue()">Epilog ▸</button> <button class="btn" onclick="toMenu()">Ana Menü</button>`;
  $('sbtns').innerHTML = b;
}
addEventListener('keydown', e => {
  if (!$('story').classList.contains('on')) return;
  if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') && storyK < storyQ.length - 1) { e.preventDefault(); storyGo(storyK + 1); }
  if (e.key === 'ArrowLeft' && storyK > 0) storyGo(storyK - 1);
});
$('sbg').addEventListener('click', () => { if (storyK < storyQ.length - 1) storyGo(storyK + 1); });
