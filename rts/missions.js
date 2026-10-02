'use strict';
/* ====== FATİH — Kampanya: Tahta çıkıştan ölüme ====== */
function crew(type, owner, n, tx, ty, o, cols) { cols = cols || 6; const bx = sc(tx), by = sc(ty); for (let i = 0; i < n; i++) { const [x, y] = freeTileNear(bx + i % cols, by + ((i / cols) | 0)); addUnit(type, owner, x * TILE + TILE / 2, y * TILE + TILE / 2, Object.assign({}, o)); } }
function houses(owner, tx, ty, cols, rows) { const bx = sc(tx), by = sc(ty); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) addBuilding('ev', owner, bx + c * 3, by + r * 3); }
function setupAI(cfg) { const o = cfg.owner || 1; G.ai = Object.assign({ owner: o, n: 0, next: cfg.wave ? cfg.wave.first : 0 }, cfg); G.ais.push(G.ai); Object.assign(G.players[o], cfg.res || {}); G.players[o].cap = cfg.popCap; }
const wallCount = () => G.blds.filter(b => b.owner === 1 && (b.type === 'sur' || b.type === 'kapi')).length;
const alive = (owner, type, label) => G.blds.some(b => b.owner === owner && b.type === type && (!label || b.name === label));
const spawnWave = (owner, list, tx, ty, target) => { list.forEach(([t, n, o]) => { for (let i = 0; i < n; i++) { const u = U(t, owner, tx + (Math.random() * 4 | 0), ty + (Math.random() * 6 | 0), Object.assign({ ai: 'wave' }, o)); if (target) orderAmove(u, target.x, target.y); } }); };
function ship(type, owner, tx, ty, o) {     // gemiyi en yakın su karosuna koy
  const cx = sc(tx), cy = sc(ty);
  for (let r = 0; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = cx + dx, y = cy + dy; if (inb(x, y) && G.terrain[idx(x, y)] === 1) return addUnit(type, owner, x * TILE + 16, y * TILE + 16, o); }
  return null;
}
function fleet(type, owner, n, tx, ty, o) { for (let i = 0; i < n; i++) ship(type, owner, tx + (i % 3) * 2, ty + ((i / 3) | 0) * 2, o); }
const BUILD_ALL = ['ev', 'ambar', 'tarla', 'kisla', 'ahir', 'ocak', 'dokum', 'kule', 'cami', 'medrese', 'pazar', 'demirhane', 'tersane'];

const MISSIONS = [
  /* ---------------- 1 ---------------- */
  {
    title: 'Tahta Çıkış', art: 'brief1', date: 'Şubat 1451 — Edirne', W: 64, H: 64, seed: 11,
    colors: ['#c0392b', '#2e8b57'], enemy: 'Karamanoğulları',
    brief: `II. Murad'ın vefatıyla 19 yaşındaki Şehzade Mehmed, Edirne'de ikinci kez tahta çıkıyor. İlk saltanatı (1444–1446) çocuk yaşta ve kısa sürmüştü; bu kez dünya onu tecrübesiz bir genç olarak görüyor.\n\nFırsatı kaçırmayan Karamanoğlu İbrahim Bey, Anadolu'daki sınır boylarına akın düzenliyor. Genç Sultan'ın ilk işi, otoritesini kanıtlamak.\n\nÖnce ekonomini kur: Reayaları ağaçlara, altın madenine ve yaban meyvesine gönder. Sonra bir Kışla kurup ordunu topla ve Karaman Kampı'nı yık.`,
    after: `Karaman tehdidi bastırıldı. Genç Sultan, ilk sınavını geçti; gözünü artık çok daha büyük bir hedefe dikmişti: Doğu Roma'nın başkenti Konstantiniyye.`,
    avail: { build: ['ev', 'ambar', 'tarla', 'kisla', 'ahir', 'demirhane', 'kule', 'cami', 'medrese', 'pazar'], train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'molla'] },
    start: { f: 350, w: 300, g: 100 }, winText: 'Karaman Kampı yıkıldı. Sultan\'ın otoritesi sağlandı!',
    setup() {
      setWater(28, 26, 33, 31); forest(4, 40, 4); forest(20, 36, 5); forest(22, 52, 4); forest(44, 6, 3); forest(58, 22, 4); forest(36, 44, 4); forest(10, 22, 4);
      mine(14, 54, 4); mine(56, 6, 4); mine(26, 12, 3); berries(15, 42, 6); berries(46, 20, 5);
      clearArea(9, 46, 7); clearArea(51, 11, 8);
      B('saray', 0, 8, 45, { label: 'Edirne Sarayı' }); crew('reaya', 0, 6, 12, 45, {}, 3); crew('azap', 0, 3, 12, 49, {}, 3); U('fatih', 0, 13, 43);
      B('kamp', 1, 50, 10, { label: 'Karaman Kampı', hp: 800 }); B('ev', 1, 46, 12); B('ev', 1, 55, 10); B('kisla', 1, 50, 15); B('burc', 1, 55, 15);
      crew('azap', 1, 5, 48, 13, { guard: true }, 5); crew('okcu', 1, 3, 49, 18, { guard: true }, 3);
      setupAI({ income: { f: 1, w: 1, g: .7 }, res: { f: 150, w: 150, g: 80 }, popCap: 26, comp: { azap: 3, okcu: 2 }, wave: { first: 330, interval: 200, size: 5, grow: 1 } });
    },
    objectives: [
      { text: '12 Reaya yetiştir', done: () => count(0, e => e.type === 'reaya') >= 12, prog: () => count(0, e => e.type === 'reaya') + '/12' },
      { text: 'Bir Kışla inşa et', done: () => hasBuilt(0, 'kisla') },
      { text: '10 asker topla', done: () => count(0, isMil) >= 10, prog: () => count(0, isMil) + '/10' },
      { text: 'Karaman Kampı\'nı yık', done: () => !alive(1, 'kamp') },
    ],
    events: [
      { t: 3, fn: () => msg('Hoş geldin Sultanım! Reayaları seç, sağ tıkla: ağaç=odun, sarı kaya=altın, çalı=yiyecek.', 'good') },
      { t: 40, fn: () => msg('Sarayı seçip "Reaya" butonuyla işçi yetiştir. Nüfus dolarsa Ev inşa et.') },
      { t: 120, fn: () => msg('Reaya seçip Kışla\'yı seç, yerleştir. Askerlerle Sultan\'ı (H tuşu) yan yana tut: +%20 güç.') },
      { t: 200, fn: () => msg('İpucu: Cami inşa et, Molla yetiştir: yaralıları iyileştirir ve geniş alanı görür. Medrese\'de İlm-i Coğrafya haritanın tamamını açar.') },
      { t: 270, fn: () => msg('Karaman akıncıları toplanıyor! Hazırlıklı ol.', 'warn') },
    ],
  },
  /* ---------------- 2 ---------------- */
  {
    title: 'Boğazkesen', art: 'brief2', date: 'Nisan–Ağustos 1452 — Boğaz', W: 72, H: 64, seed: 22,
    colors: ['#c0392b', '#6c3fa0'], enemy: 'Bizans', sym: '✚',
    brief: `İstanbul'u fethetmek için önce Boğaz'ın kontrolü şart. Anadolu yakasında atası Yıldırım Bayezid'in yaptırdığı Anadoluhisarı var; Sultan Mehmed tam karşısına, Rumeli yakasına bir hisar inşa etmeye karar veriyor.\n\nHisar yaklaşık dört buçuk ayda tamamlanacak ve Karadeniz'den gelen yardımı kesecek; adı "Boğazkesen" olacak.\n\nAltın ve odun topla, işaretli alana Rumeli Hisarı'nı kur. Bizans akıncıları inşaatı bozmaya çalışacak: işçileri koru. Hisar bitince Bizans karakolunu yık.`,
    after: `Rumeli Hisarı 31 Ağustos 1452'de tamamlandı. Boğaz artık Osmanlı'nın elindeydi; ilk gemi geçişi denemesinde top ateşiyle batırılan bir Venedik gemisi, İstanbul'a yardımın yolunun kapandığını gösterdi.`,
    avail: { build: ['ev', 'ambar', 'tarla', 'kisla', 'ahir', 'demirhane', 'tersane', 'kule', 'cami', 'medrese', 'pazar', 'hisar'], train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'molla', 'balikci', 'kadirga'] },
    start: { f: 450, w: 700, g: 350 }, winText: 'Boğaz Osmanlı\'nın! Rumeli Hisarı ayakta, Bizans karakolu yıkıldı.',
    zone: { x0: 50, y0: 25, x1: 57, y1: 35 },
    setup() {
      setWater(60, 0, 66, 63); setTerrain(67, 0, 71, 63, 2); setTerrain(58, 0, 59, 63, 3);
      forest(6, 18, 5); forest(20, 48, 5); forest(40, 40, 4); forest(42, 14, 4); forest(26, 24, 4); forest(52, 52, 4);
      mine(13, 40, 4); mine(30, 34, 4); mine(48, 18, 3); berries(14, 28, 6); berries(36, 50, 5);
      clearArea(9, 31, 7); clearArea(31, 7, 8);
      B('saray', 0, 8, 30, { label: 'Edirne Karargâhı' }); houses(0, 4, 36, 3, 1); crew('reaya', 0, 8, 12, 30, {}, 4); crew('azap', 0, 4, 12, 34, {}, 4); crew('okcu', 0, 3, 16, 34, {}, 3); U('fatih', 0, 14, 28);
      B('kale', 1, 30, 5, { label: 'Bizans Karakolu' }); B('ev', 1, 25, 6); B('ev', 1, 36, 6); B('burc', 1, 27, 10); B('burc', 1, 34, 10); B('kisla', 1, 40, 5);
      crew('azap', 1, 8, 29, 11, { guard: true }, 8); crew('okcu', 1, 6, 29, 13, { guard: true }, 6);
      setupAI({ income: { f: 1.4, w: 1.4, g: 1 }, res: { f: 200, w: 200, g: 100 }, popCap: 36, comp: { azap: 3, okcu: 2, sovalye: 1 }, wave: { first: 240, interval: 160, size: 4, grow: 1.5 } });
    },
    tick() { if (G.blds.some(b => b.owner === 0 && b.type === 'hisar')) G.flags.hisarSeen = true; if (G.flags.hisarSeen && !G.blds.some(b => b.owner === 0 && b.type === 'hisar')) endGame(false, 'Rumeli Hisarı yıkıldı! Boğaz\'ın kontrolü kaybedildi.'); },
    objectives: [
      { text: 'Rumeli Hisarı\'nı inşa et (işaretli alan)', done: () => G.blds.some(b => b.owner === 0 && b.type === 'hisar' && b.built), prog: () => { const h = G.blds.find(b => b.owner === 0 && b.type === 'hisar'); return h ? '%' + Math.floor(h.prog * 100) : ''; } },
      { text: 'Bizans Karakolu\'nu yık', done: () => !alive(1, 'kale') },
    ],
    events: [
      { t: 3, fn: () => msg('Boğaz kıyısındaki altın çerçeveli alana Rumeli Hisarı kurulacak: 450 odun, 250 altın.', 'good') },
      { t: 30, fn: () => msg('Hisarı birden çok reaya birlikte daha hızlı inşa eder. Bizans akıncıları gelince askerlerle koru.') },
      { t: 200, fn: () => msg('Bizans akıncıları görüldü!', 'warn') },
    ],
  },
  /* ---------------- 3 ---------------- */
  {
    title: 'İstanbul\'un Fethi', art: 'brief3', date: '6 Nisan – 29 Mayıs 1453 — Konstantiniyye', W: 104, H: 72, seed: 33,
    colors: ['#c0392b', '#6c3fa0'], enemy: 'Bizans İmparatorluğu', sym: '✚',
    brief: `21 yaşındaki Sultan Mehmed, bin yıldır ayakta duran Theodosius Surları'nın önünde. Şehirde yaklaşık 7.000 savunmacı var; Haliç ağzı zincirle kapalı.\n\nMacar usta Orban'ın döktüğü Şahi Topu ve balyemez toplarla surları dövmek, kapıları zorlamak gerek. Haliç zincirini aşmak için donanma karadan yürütülecek.\n\nTopçularını surların menziline getir, gedik aç, sonra ordunu şehre sok ve Ayasofya'nın çevresini düşmandan temizleyip ele geçir.\n\nİpucu: Okçu ve piyade surlara neredeyse hasar veremez. Surları top yıkar!`,
    after: `29 Mayıs 1453 sabahı şehir fethedildi. Son Bizans imparatoru XI. Konstantinos surlarda savaşarak öldü. Fatih, İstanbul'u başkent yaptı, Ayasofya'yı camiye çevirdi ve "Fatih" unvanını aldı. Bir çağ kapanmış, bir çağ açılmıştı.`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'sahi', 'molla', 'balikci', 'kadirga', 'bastarda'] },
    start: { f: 900, w: 1100, g: 900 }, winText: 'Ayasofya\'ya Osmanlı sancağı dikildi. İstanbul fethedildi!',
    setup() {
      setWater(0, 0, 103, 6); setWater(0, 64, 103, 71); setWater(0, 7, 4, 63);
      fleet('kadirga', 1, 3, 52, 2, { guard: true });
      forest(78, 14, 6); forest(80, 58, 6); forest(94, 30, 5); forest(70, 40, 4); forest(60, 10, 3, .5); forest(62, 60, 3, .5); forest(90, 48, 4);
      mine(92, 18, 4); mine(92, 52, 4); mine(72, 28, 3); berries(84, 26, 6); berries(84, 42, 6);
      clearArea(88, 35, 10);
      // Ottoman
      B('saray', 0, 88, 34, { label: 'Otağ-ı Hümayun' }); B('kamp', 0, 84, 38, { label: 'Ordugâh' }); houses(0, 92, 28, 4, 2); houses(0, 92, 40, 4, 2);
      crew('reaya', 0, 12, 85, 33, {}, 4); crew('azap', 0, 20, 79, 30, {}, 5); crew('okcu', 0, 12, 76, 36, {}, 6); crew('sipahi', 0, 8, 79, 40, {}, 8); crew('yeniceri', 0, 10, 74, 31, {}, 5); U('fatih', 0, 80, 35);
      crew('top', 0, 3, 70, 26, {}, 3);
      U('molla', 0, 84, 36, { name: 'Akşemseddin', heal: 10, hp: 160, maxhp: 160, desc: 'Fatih\'in hocası. Askerleri hem bedenen hem manen güçlendirir; güçlü şifa verir.' });
      // Surlar
      for (const y of [9, 17, 25, 33, 41, 49, 57]) B('burc', 1, 52, y, { label: 'Sur Burcu' });
      B('kapi', 1, 52, 28, { label: 'Topkapı' }); B('kapi', 1, 52, 29, { label: 'Topkapı' }); B('kapi', 1, 52, 44, { label: 'Edirnekapı' }); B('kapi', 1, 52, 45, { label: 'Edirnekapı' });
      wallLine(1, 52, 7, 52, 63, 'sur', 'Theodosius Surları');
      // Şehir
      setTerrain(6, 30, 50, 31, 4); setTerrain(6, 44, 50, 45, 4); setTerrain(26, 8, 27, 62, 4); setTerrain(17, 29, 28, 40, 4); setTerrain(36, 12, 37, 60, 4);
      B('ayasofya', 1, 20, 32, { label: 'Ayasofya' });
      for (const [hx, hy] of [[8, 9], [11, 9], [14, 9], [20, 10], [8, 18], [11, 18], [17, 18], [8, 24], [12, 26], [30, 10], [33, 14], [30, 26], [33, 28], [8, 34], [8, 38], [12, 41], [8, 48], [12, 53], [16, 55], [20, 48], [23, 53], [30, 36], [32, 41], [30, 54], [34, 57], [40, 46], [44, 56], [46, 36], [40, 16], [20, 22], [14, 34], [30, 32]]) if (![0, 1].some(a => [0, 1].some(b2 => G.occ[idx(hx + a, hy + b2)] || G.blkT[idx(hx + a, hy + b2)]))) B('ev', 1, hx, hy); B('kale', 1, 43, 9, { label: 'Blakhernai Sarayı' }); B('kisla', 1, 38, 38); B('kisla', 1, 38, 24); B('ev', 1, 12, 14); B('ev', 1, 15, 14); B('ev', 1, 28, 20); B('ev', 1, 12, 50); B('ev', 1, 16, 50); B('ev', 1, 30, 48); B('ev', 1, 44, 52); B('ev', 1, 44, 20); B('burc', 1, 40, 31);
      for (let y = 10; y <= 60; y += 3) U('okcu', 1, 50, y, { guard: true });
      crew('azap', 1, 10, 46, 25, { guard: true }, 5); crew('azap', 1, 10, 46, 41, { guard: true }, 5); crew('sovalye', 1, 6, 42, 32, { guard: true }, 6);
      crew('okcu', 1, 8, 24, 28, { guard: true }, 8); crew('azap', 1, 8, 24, 40, { guard: true }, 8);
      U('komutan', 1, 30, 33, { name: 'XI. Konstantinos', guard: true });
      G.flags.walls0 = wallCount();
      setupAI({ income: { f: 3, w: 3, g: 2 }, res: { f: 400, w: 400, g: 300 }, popCap: 110, comp: { azap: 3, okcu: 2, sovalye: 1 }, wave: { first: 420, interval: 300, size: 8, grow: 2 } });
    },
    tick(dt) {
      const ay = G.blds.find(b => b.type === 'ayasofya'); if (!ay) return; const cx = ay.x, cy = ay.y; let mine = 0, en = 0;
      for (const e of G.ents) { if (e.kind !== 'u' || e.dead) continue; const d = Math.hypot(e.x - cx, e.y - cy); if (e.owner === 0 && isMil(e) && d < 7 * TILE) mine++; else if (e.owner === 1 && d < 9 * TILE) en++; }
      if (G.flags.captured) return;
      if (mine >= 3 && en === 0) G.capture += dt; else G.capture = Math.max(0, G.capture - dt * .5);
      if (G.capture >= 8) { G.flags.captured = true; msg('Ayasofya\'ya Ay-yıldızlı sancak dikildi!', 'good'); }
    },
    triggers: [
      { cond: () => wallCount() < G.flags.walls0, fn: () => { const h = G.hero || { x: G.W * TILE / 2, y: G.H * TILE / 2 }, ay = G.blds.find(b => b.type === 'ayasofya'); const u = addUnit('azap', 0, h.x + 30, h.y + 10, { name: 'Ulubatlı Hasan', hp: 300, maxhp: 300, atk: 15, desc: 'Sancağı ilk diken yiğit. Rivayete göre surlara ilk Osmanlı sancağını o dikti.' }); if (ay) orderAmove(u, ay.x, ay.y); msg('Ulubatlı Hasan sancağı kaptı ve gediğe atıldı!', 'good'); } },
    ],
    objectives: [
      { text: 'Surlarda gedik aç (kapı veya sur yık)', done: () => wallCount() < G.flags.walls0 },
      { text: 'Ayasofya çevresini temizle: en az 3 askerle düşmansız 8 sn tut', done: () => G.flags.captured, prog: () => G.capture > 0 ? '%' + Math.floor(G.capture / 8 * 100) : '' },
    ],
    events: [
      { t: 3, fn: () => msg('6 Nisan 1453. Surlar önünde mevzilendik. Toplarla surları dövün, Sultanım!', 'good') },
      { t: 45, fn: () => { crew('sahi', 0, 1, 74, 34, {}, 1); msg('Orban\'ın Şahi Topu cepheye ulaştı! Surlara yaklaştır.', 'good'); } },
      { t: 240, fn: () => msg('Haliç zinciri aşılamıyor... Donanmanın karadan yürütülmesi için hazırlıklar sürüyor.') },
      { t: 600, fn: () => { spawnWave(0, [['azap', 12], ['okcu', 8]], 29, 8); fleet('kadirga', 0, 5, 22, 2); msg('22 Nisan: Osmanlı gemileri gece karadan yürütülüp Haliç\'e indirildi! Kuzey kıyısında takviye geldi.', 'good'); } },
      { t: 900, fn: () => msg('Şehrin morali çöküyor. Son hücum vakti yaklaşıyor!', 'warn') },
    ],
  },
  /* ---------------- 4 ---------------- */
  {
    title: 'Belgrad Kuşatması', art: 'brief4', date: '4–22 Temmuz 1456 — Belgrad', W: 88, H: 64, seed: 44,
    colors: ['#c0392b', '#1e5fb3'], enemy: 'Macar Krallığı', sym: '✚',
    brief: `İstanbul'dan sonra Fatih'in gözü Orta Avrupa'nın kapısı Belgrad'da. Tuna ve Sava'nın birleştiği yerdeki kale, Macar tarafının en önemli müstahkem noktası.\n\nAma Macar komutan Hunyadi János yardım ordusuyla yaklaşıyor. Kaleyi yıkmak için zamanın sınırlı: yaklaşık 14 dakika.\n\nTopları kaleye yaklaştır, Hunyadi gelince ordunu ikiye bölmeden savun. Sultan'ı koru: tarihte bu kuşatmada Fatih yaralanmıştı.`,
    after: `Belgrad kuşatması tarihte başarısızlıkla sonuçlandı: Hunyadi'nin yardımı ve kalede çıkan sonraki çatışmalarda Osmanlı ordusu ağır kayıp verdi; Sultan yaralandı ve ordu geri çekildi. Hunyadi kısa süre sonra salgında hayatını kaybetti. Fatih hiçbir yenilgiyi unutmadı; bir sonraki seferine çok daha iyi hazırlandı.`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'sahi', 'molla', 'balikci', 'kadirga', 'bastarda'] },
    start: { f: 600, w: 800, g: 600 }, winText: 'Belgrad Kalesi düştü! Tarihin akışını değiştirdin.', timeLimit: 840, timeoutText: 'Süre doldu. Tarihte olduğu gibi ordu Belgrad önünden geri çekildi.',
    setup() {
      setWater(0, 0, 87, 5); forest(10, 40, 5); forest(70, 44, 5); forest(20, 56, 4); forest(62, 28, 4); forest(10, 22, 4); forest(76, 14, 4);
      mine(14, 50, 4); mine(66, 54, 4); mine(60, 36, 3); berries(30, 46, 6); berries(54, 46, 6);
      clearArea(42, 55, 9);
      B('saray', 0, 41, 54, { label: 'Ordu Karargâhı' }); B('kamp', 0, 36, 56, { label: 'Ordugâh' }); houses(0, 46, 54, 4, 2);
      crew('reaya', 0, 10, 38, 51, {}, 5); crew('azap', 0, 14, 40, 47, {}, 7); crew('okcu', 0, 10, 40, 49, {}, 10); crew('sipahi', 0, 6, 33, 48, {}, 6); crew('yeniceri', 0, 8, 46, 48, {}, 8); crew('top', 0, 4, 42, 44, {}, 4); U('fatih', 0, 44, 52);
      // kale
      B('burc', 1, 31, 7, { label: 'Kale Burcu' }); B('burc', 1, 52, 7, { label: 'Kale Burcu' }); B('burc', 1, 31, 22, { label: 'Kale Burcu' }); B('burc', 1, 52, 22, { label: 'Kale Burcu' });
      B('kapi', 1, 42, 23, { label: 'Kale Kapısı' }); B('kapi', 1, 43, 23, { label: 'Kale Kapısı' });
      wallLine(1, 31, 7, 53, 7, 'sur', 'Kale Suru'); wallLine(1, 31, 23, 53, 23, 'sur', 'Kale Suru'); wallLine(1, 31, 7, 31, 23, 'sur', 'Kale Suru'); wallLine(1, 53, 7, 53, 23, 'sur', 'Kale Suru');
      setTerrain(32, 8, 52, 22, 4);
      B('kale', 1, 40, 11, { label: 'Belgrad Kalesi' }); B('ev', 1, 35, 11); B('ev', 1, 47, 11); B('kisla', 1, 35, 16); B('ev', 1, 47, 16);
      crew('azap', 1, 14, 36, 20, { guard: true }, 14); crew('okcu', 1, 14, 36, 9, { guard: true }, 14); crew('sovalye', 1, 8, 44, 17, { guard: true }, 8);
      for (let x = 34; x <= 50; x += 3) U('okcu', 1, x, 22, { guard: true });
      G.flags.walls0 = wallCount();
      setupAI({ income: { f: 2.5, w: 2.5, g: 2 }, res: { f: 300, w: 300, g: 200 }, popCap: 60, comp: { azap: 2, okcu: 2, sovalye: 1 }, wave: null });
    },
    objectives: [
      { text: 'Belgrad Kalesi\'ni yık (süre sınırlı)', done: () => !alive(1, 'kale', 'Belgrad Kalesi') },
      { text: 'Hunyadi János\'u yen (isteğe bağlı)', opt: true, done: () => G.flags.hunyadi && G.flags.hunyadi.dead },
    ],
    events: [
      { t: 3, fn: () => msg('Belgrad önündeyiz Sultanım. Toplar surları dövsün, Hunyadi\'nin gelişine hazır ol.', 'good') },
      { t: 300, fn: () => msg('Casuslar: Hunyadi\'nin yardım ordusu Tuna kıyısında görüldü!', 'warn') },
      { t: 420, fn: () => { G.flags.hunyadi = U('komutan', 1, 83, 34, { name: 'Hunyadi János', ai: 'wave' }); G.flags.hunyadi.hp = G.flags.hunyadi.maxhp = 600; const tg = aiTarget(); orderAmove(G.flags.hunyadi, tg.x, tg.y); spawnWave(1, [['sovalye', 10], ['okcu', 10], ['azap', 12]], 82, 30, tg); msg('Hunyadi\'nin yardım ordusu geldi! Doğu kanadını savun!', 'warn'); } },
      { t: 720, fn: () => msg('Zaman daralıyor... Kaleyi yıkmak için son dakikalar!', 'warn') },
    ],
  },
  /* ---------------- 5 ---------------- */
  /* ---------------- Trabzon 1461 ---------------- */
  {
    title: 'Trabzon', date: 'Haziran–Ağustos 1461 — Karadeniz kıyısı', W: 84, H: 64, seed: 77, art: 'trabzon',
    colors: ['#c0392b', '#7d3c98'], enemy: 'Trabzon Rum İmparatorluğu', sym: '✚',
    brief: `Bizans'ın son kalıntısı Trabzon Rum İmparatorluğu, Uzun Hasan'la ittifak kurmuş, Osmanlı'ya karşı Avrupa'dan haçlı yardımı bekliyor.\n\n1461 yazında Fatih, Karadeniz kıyısından ilerliyor: Candaroğulları'nın Sinop'u savaşmadan teslim oldu, donanma kıyı boyunca doğuya yelken açtı. Ordu ise Doğu Karadeniz'in sarp dağlarını aşarak şehre ulaştı.\n\nTrabzon'u karadan ve denizden kuşat: önce limandaki Trabzon donanmasını batır, sonra surları top ateşine tut.`,
    after: `İmparator David Komnenos, kuşatmanın ardından Ağustos 1461'de şehri teslim etti. Bizans'ın son parçası da tarihe karıştı; Karadeniz'in güney kıyısı tamamen Osmanlı'nın oldu.`,
    story: ["1461 yazı. Sinop savaşmadan teslim oldu; Osmanlı donanması Karadeniz kıyısı boyunca doğuya yelken açtı.",
      "Ordu, Doğu Karadeniz'in sarp ve ormanlık dağlarını günlerce aşarak Trabzon önlerine vardı. Şehir karadan ve denizden kuşatıldı.",
      "Yardım gelmeyeceğini anlayan İmparator David Komnenos şehrin anahtarlarını teslim etti. Bizans'ın son kalıntısı da artık Osmanlı'nındı."],
    tease: "Karadeniz'de son Rum devleti, Trabzon. Donanma ve ordu birlikte: önce denizi, sonra surları al.",
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'molla', 'balikci', 'kadirga', 'bastarda'] },
    start: { f: 600, w: 800, g: 600 }, winText: 'Trabzon teslim oldu! Karadeniz kıyıları artık Osmanlı\'nın.',
    setup() {
      setWater(0, 0, 83, 11); setTerrain(0, 12, 83, 13, 3);
      forest(10, 52, 6); forest(30, 56, 6); forest(50, 58, 6); forest(72, 54, 5); forest(26, 30, 4); forest(44, 42, 4); forest(4, 44, 4);
      mine(14, 44, 4); mine(36, 46, 4); mine(60, 50, 3); berries(18, 34, 6); berries(40, 30, 5); clearArea(14, 26, 8);
      B('saray', 0, 8, 24, { label: 'Ordugâh-ı Hümâyun' }); B('tersane', 0, 12, 12, { label: 'Sinop Tersanesi' }); houses(0, 4, 32, 3, 1);
      crew('reaya', 0, 8, 12, 28, {}, 4); crew('azap', 0, 8, 18, 30, {}, 4); crew('okcu', 0, 6, 22, 30, {}, 3); crew('yeniceri', 0, 6, 18, 34, {}, 3); crew('top', 0, 3, 24, 34, {}, 3); U('fatih', 0, 16, 26);
      fleet('kadirga', 0, 3, 10, 5); ship('balikci', 0, 6, 9); ship('balikci', 0, 20, 9);
      wallLine(1, 54, 16, 76, 16, 'sur', 'Trabzon Suru'); wallLine(1, 54, 40, 76, 40, 'sur', 'Trabzon Suru'); wallLine(1, 54, 16, 54, 40, 'sur', 'Trabzon Suru'); wallLine(1, 76, 16, 76, 40, 'sur', 'Trabzon Suru');
      B('kapi', 1, 54, 27, { label: 'Kale Kapısı' }); B('kapi', 1, 54, 28, { label: 'Kale Kapısı' });
      setTerrain(55, 17, 75, 39, 4); setTerrain(44, 27, 53, 28, 2);
      for (const [x, y] of [[55, 17], [74, 17], [55, 38], [74, 38]]) B('burc', 1, x, y, { label: 'Trabzon Burcu' });
      B('kale', 1, 63, 25, { label: 'Trabzon Sarayı' }); B('kisla', 1, 58, 32); B('ev', 1, 70, 20); B('ev', 1, 70, 33); B('ev', 1, 58, 20);
      B('tersane', 1, 62, 12, { label: 'Trabzon Limanı' });
      crew('azap', 1, 10, 58, 22, { guard: true }, 5); crew('okcu', 1, 8, 66, 34, { guard: true }, 4); crew('sovalye', 1, 4, 66, 30, { guard: true }, 4);
      fleet('kadirga', 1, 4, 62, 5, { guard: true }); ship('bastarda', 1, 72, 6, { guard: true });
      setupAI({ income: { f: 2, w: 2, g: 1.5 }, res: { f: 300, w: 300, g: 200 }, popCap: 45, comp: { azap: 2, okcu: 2, sovalye: 1, kadirga: 1 }, wave: { first: 360, interval: 210, size: 5, grow: 1.5 } });
    },
    objectives: [
      { text: 'Trabzon donanmasını batır', done: () => count(1, e => e.kind === 'u' && e.d.naval) === 0 },
      { text: 'Trabzon Sarayı\'nı düşür', done: () => !alive(1, 'kale', 'Trabzon Sarayı') },
      { text: 'Trabzon Limanı\'nı yık (isteğe bağlı)', opt: true, done: () => !alive(1, 'tersane') },
    ],
    events: [
      { t: 3, fn: () => msg('Donanma Sinop\'tan geldi! Kadırgaları seç, Trabzon gemilerine sağ tıkla.', 'good') },
      { t: 40, fn: () => msg('Tersane\'den Balıkçı Kayığı çıkar: denizdeki balık sürülerine sağ tıklayınca yiyecek getirir.') },
      { t: 120, fn: () => msg('Baştarda gemisinin topları kıyıdaki burçları denizden dövebilir.') },
    ],
  },
  /* ---------------- Eflak 1462 ---------------- */
  {
    title: 'Eflak Seferi', date: '17 Haziran 1462 — Tırgovişte önleri', W: 84, H: 70, seed: 88, art: 'eflak', night: true,
    colors: ['#c0392b', '#1f6f8b'], enemy: 'Eflak (III. Vlad — Kazıklı Voyvoda)', sym: '✚',
    brief: `Eflak Voyvodası III. Vlad, haracı kesti ve 1461-62 kışında Tuna boyundaki Osmanlı topraklarını yakıp yıktı. Fatih büyük bir orduyla Tuna'yı geçti; Vlad meydan savaşından kaçıp kuyuları zehirledi, ekinleri yaktı.\n\n17 Haziran 1462 gecesi Vlad, birkaç bin atlıyla Osmanlı ordugâhına ani bir gece baskını yapacak. Hedefi Sultan'ın otağı.\n\nKaranlıkta Otağ-ı Hümâyun'u koru; şafak sökünce Tırgovişte'ye yürü ve sarayı düşür.`,
    after: `Gece baskını Osmanlı ordusunu dağıtamadı. Ordu Tırgovişte'ye vardığında şehri boşaltılmış buldu. Vlad Macaristan'a kaçtı; Eflak tahtına kardeşi Radu getirildi ve Eflak yeniden Osmanlı'ya bağlandı.`,
    story: ["Haziran 1462. Osmanlı ordusu Tuna'yı geçti. Vlad, kavrulmuş toprak taktiğiyle kuyuları zehirledi, köyleri yaktı.",
      "17 Haziran gecesi Kazıklı Voyvoda'nın atlıları meşalelerle ordugâha daldı. Karanlıkta Sultan'ın otağı arandı; ama yeniçeriler hattı tuttu.",
      "Şafakla Vlad geri çekildi. Tırgovişte'ye giren ordu boş bir şehir buldu; Eflak tahtına Radu oturtuldu."],
    tease: "Tuna'nın ötesinde Kazıklı Voyvoda bekliyor. Karanlık bir gece, ani bir baskın…",
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'molla', 'balikci', 'kadirga'] },
    start: { f: 500, w: 600, g: 500 }, winText: 'Tırgovişte düştü! Vlad kaçtı, Eflak yeniden Osmanlı\'ya bağlandı.',
    setup() {
      setWater(0, 60, 83, 69); setTerrain(0, 58, 83, 59, 3);
      forest(10, 22, 7); forest(72, 26, 7); forest(14, 46, 5); forest(68, 46, 5); forest(40, 30, 4); forest(26, 14, 4); forest(58, 12, 4);
      mine(20, 52, 4); mine(64, 52, 4); berries(26, 40, 6); berries(56, 40, 6); clearArea(40, 49, 9);
      B('kamp', 0, 38, 46, { label: 'Otağ-ı Hümâyun' }); B('saray', 0, 30, 49, { label: 'Ordugâh' }); B('tersane', 0, 48, 57, { label: 'Tuna İskelesi' });
      crew('reaya', 0, 6, 32, 53, {}, 3); crew('azap', 0, 12, 36, 42, {}, 6); crew('okcu', 0, 8, 44, 42, {}, 4); crew('yeniceri', 0, 10, 40, 52, {}, 5); crew('sipahi', 0, 6, 48, 48, {}, 3); crew('top', 0, 2, 46, 52, {}, 2); U('fatih', 0, 42, 50);
      fleet('kadirga', 0, 2, 40, 63);
      wallLine(1, 28, 18, 56, 18, 'sur', 'Tırgovişte Suru'); wallLine(1, 28, 2, 28, 18, 'sur', 'Tırgovişte Suru'); wallLine(1, 56, 2, 56, 18, 'sur', 'Tırgovişte Suru');
      B('kapi', 1, 41, 18, { label: 'Şehir Kapısı' }); B('kapi', 1, 42, 18, { label: 'Şehir Kapısı' }); setTerrain(29, 2, 55, 17, 4); setTerrain(41, 19, 42, 30, 2);
      B('kale', 1, 40, 6, { label: 'Tırgovişte Sarayı' }); B('burc', 1, 30, 15); B('burc', 1, 53, 15); B('kisla', 1, 32, 6); B('ahir', 1, 49, 6); B('ev', 1, 34, 12); B('ev', 1, 47, 12);
      crew('azap', 1, 10, 36, 13, { guard: true }, 5); crew('okcu', 1, 6, 44, 13, { guard: true }, 3);
      setupAI({ income: { f: 2, w: 2, g: 1.5 }, res: { f: 300, w: 300, g: 200 }, popCap: 50, comp: { akinci: 3, azap: 2, okcu: 1 }, wave: { first: 420, interval: 200, size: 6, grow: 2 } });
    },
    tick() { if (G.t > 2 && !alive(0, 'kamp', 'Otağ-ı Hümâyun')) endGame(false, 'Otağ-ı Hümâyun düştü! Ordu karanlıkta panik içinde dağıldı.'); },
    objectives: [
      { text: 'Gece baskınında Otağ-ı Hümâyun\'u koru (şafağa kadar)', done: () => !!G.flags.dawn, prog: () => G.flags.dawn ? '' : fmtT(Math.max(0, 260 - G.t)) },
      { text: 'Tırgovişte Sarayı\'nı yık', done: () => !alive(1, 'kale', 'Tırgovişte Sarayı') },
    ],
    events: [
      { t: 3, fn: () => msg('Gece çöktü. Nöbetçiler tetikte; Vlad\'ın atlıları her an gelebilir. Askerleri Otağ\'ın çevresine diz.', 'warn') },
      { t: 90, fn: () => { const o = G.blds.find(b => b.name === 'Otağ-ı Hümâyun'); spawnWave(1, [['akinci', 14], ['sovalye', 4]], 40, 22, o); msg('GECE BASKINI! Kazıklı Voyvoda\'nın atlıları kuzeyden ordugâha daldı!', 'warn'); } },
      { t: 130, fn: () => { const o = G.blds.find(b => b.name === 'Otağ-ı Hümâyun'); spawnWave(1, [['akinci', 10], ['azap', 6]], 2, 44, o); msg('Batıdan ikinci dalga!', 'warn'); } },
      { t: 260, fn: () => { G.flags.dawn = true; msg('Şafak söktü. Vlad geri çekildi; Tırgovişte\'ye yürü!', 'good'); } },
    ],
  },
  /* ---------------- Eğriboz 1470 ---------------- */
  {
    title: 'Eğriboz', date: 'Haziran–Temmuz 1470 — Eğriboz Adası', W: 88, H: 64, seed: 99, art: 'egriboz',
    colors: ['#c0392b', '#2471a3'], enemy: 'Venedik Cumhuriyeti', sym: '✚',
    brief: `Venedik'le savaş yıllardır sürüyor. Ege'deki en büyük Venedik üssü Eğriboz (Negroponte), anakaradan dar bir boğazla ayrılan adada.\n\nFatih karadan, Mahmud Paşa denizden geliyor. Osmanlı donanması tarihinde ilk kez Venedik'e bu kadar büyük bir güçle meydan okuyacak.\n\nÖnce boğazdaki Venedik donanmasını batır. Boğaz temizlenince gemilerden bir köprü kurulacak; ordu adaya geçip Eğriboz Kalesi'ni düşürecek.`,
    after: `12 Temmuz 1470'te Eğriboz düştü. Venedik'in Ege'deki en önemli üssü kaybedildi; Osmanlı donanması artık Akdeniz'de hesaba katılması gereken bir güçtü.`,
    story: ["Haziran 1470. Mahmud Paşa'nın donanması Ege'ye açıldı; Venedik kadırgaları Eğriboz boğazında bekliyordu.",
      "Deniz temizlenince gemiler yan yana bağlandı: anakaradan adaya bir köprü kuruldu. Ordu boğazı yürüyerek geçti.",
      "Haftalar süren top ateşinin ardından 12 Temmuz'da kale düştü. Venedik'in Ege'deki gücü kırılmıştı."],
    tease: "Venedik'in Ege'deki kalesi bir adada. Önce denizi kazan, sonra gemilerden köprü kur.",
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'sahi', 'molla', 'balikci', 'kadirga', 'bastarda'] },
    start: { f: 700, w: 900, g: 700 }, winText: 'Eğriboz düştü! Venedik\'in Ege\'deki gücü kırıldı.',
    setup() {
      setWater(38, 0, 46, 63); setTerrain(36, 0, 37, 63, 3); setTerrain(47, 0, 48, 63, 3);
      forest(8, 10, 5); forest(10, 54, 5); forest(24, 40, 4); forest(26, 8, 4); forest(84, 6, 3); forest(84, 58, 3);
      mine(14, 44, 4); mine(22, 18, 4); berries(16, 34, 6); berries(28, 26, 5); clearArea(14, 28, 8);
      B('saray', 0, 10, 26, { label: 'Ordugâh' }); B('tersane', 0, 35, 20, { label: 'Tersane' }); houses(0, 5, 34, 3, 1);
      crew('reaya', 0, 8, 14, 30, {}, 4); crew('azap', 0, 10, 20, 26, {}, 5); crew('okcu', 0, 8, 20, 32, {}, 4); crew('yeniceri', 0, 8, 24, 30, {}, 4); crew('top', 0, 3, 26, 36, {}, 3); U('fatih', 0, 18, 29);
      fleet('kadirga', 0, 3, 40, 14); ship('bastarda', 0, 42, 20);
      wallLine(1, 58, 16, 84, 16, 'sur', 'Eğriboz Suru'); wallLine(1, 58, 46, 84, 46, 'sur', 'Eğriboz Suru'); wallLine(1, 58, 16, 58, 46, 'sur', 'Eğriboz Suru'); wallLine(1, 84, 16, 84, 46, 'sur', 'Eğriboz Suru');
      B('kapi', 1, 58, 30, { label: 'Köprü Kapısı' }); B('kapi', 1, 58, 31, { label: 'Köprü Kapısı' }); setTerrain(59, 17, 83, 45, 4); setTerrain(49, 30, 57, 31, 2);
      for (const [x, y] of [[59, 17], [82, 17], [59, 44], [82, 44], [70, 17]]) B('burc', 1, x, y, { label: 'Venedik Burcu' });
      B('kale', 1, 70, 29, { label: 'Eğriboz Kalesi' }); B('kisla', 1, 63, 22); B('kisla', 1, 63, 38); B('ev', 1, 76, 22); B('ev', 1, 76, 38);
      B('tersane', 1, 49, 42, { label: 'Venedik Tersanesi' });
      crew('azap', 1, 10, 62, 28, { guard: true }, 5); crew('okcu', 1, 8, 66, 34, { guard: true }, 4); crew('sovalye', 1, 6, 74, 30, { guard: true }, 3);
      fleet('kadirga', 1, 5, 40, 34, { guard: true }); fleet('bastarda', 1, 2, 41, 46, { guard: true });
      setupAI({ income: { f: 2.5, w: 2.5, g: 2 }, res: { f: 300, w: 400, g: 300 }, popCap: 60, comp: { azap: 2, okcu: 2, sovalye: 1, kadirga: 2 }, wave: { first: 420, interval: 220, size: 5, grow: 1.5 } });
    },
    objectives: [
      { text: 'Boğazdaki Venedik donanmasını batır', done: () => count(1, e => e.kind === 'u' && e.d.naval) === 0 },
      { text: 'Eğriboz Kalesi\'ni düşür', done: () => !alive(1, 'kale', 'Eğriboz Kalesi') },
    ],
    triggers: [
      { cond: () => G.m.objectives[0].ok, fn: () => { setTerrain(36, 29, 48, 32, 2); for (const e of G.ents) if (e.kind === 'u' && e.d.naval && !e.dead && G.terrain[idx((e.x / TILE) | 0, (e.y / TILE) | 0)] !== 1) e.y += 6 * TILE; G.navVer++; G.dirtyMini = true; if (typeof buildTerrain === 'function') buildTerrain(); msg('Gemiler yan yana bağlandı: boğaza köprü kuruldu! Ordu adaya geçebilir.', 'good'); } },
    ],
    events: [
      { t: 3, fn: () => msg('Venedik donanması boğazı tutuyor. Tersane\'den kadırga ve baştarda üret, gemilerini toplu saldırt.', 'good') },
      { t: 60, fn: () => msg('Kıyıya Gözcü Kulesi kurmak düşman gemilerini uzak tutar.') },
    ],
  },
  {
    title: 'Otlukbeli', art: 'brief5', date: '11 Ağustos 1473 — Doğu Anadolu', W: 96, H: 64, seed: 55,
    colors: ['#c0392b', '#d0d0d0'], enemy: 'Akkoyunlular',
    brief: `Akkoyunlu hükümdarı Uzun Hasan, Venedik ile ittifak kurarak Osmanlı'ya meydan okuyor. Doğu'da kaderi belirleyecek büyük savaş Otlukbeli'nde.\n\nUzun Hasan'ın ordusu süvari ağırlıklı ve çok kalabalık. Sizde ise tüfekli Yeniçeriler ve toplar var.\n\nİpucu: Süvarilere karşı Azaplar, mızraklarıyla çok etkilidir. Yeniçeri ve toplar menzilli güçtür. Sultan'ın yakınında savaşan askerler +%20 güç kazanır.\n\nOğlu Zeynel Bey'i etkisiz hale getir ve Ordugâh'ı yık.`,
    after: `Otlukbeli'nde Osmanlı topları ve Yeniçeri tüfekleri Akkoyunlu süvarisini dağıttı; Uzun Hasan'ın oğlu Zeynel Bey savaşta öldü. Doğu cephesi güvene alındı; Fatih artık Anadolu'da hâkim güçtü.`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'molla', 'balikci', 'kadirga', 'bastarda'] },
    start: { f: 600, w: 700, g: 600 }, winText: 'Otlukbeli kazanıldı! Akkoyunlu ordusu bozguna uğradı.',
    setup() {
      setWater(46, 0, 48, 17); setWater(46, 25, 48, 37); setWater(46, 45, 48, 63);
      forest(8, 10, 5); forest(10, 54, 5); forest(30, 8, 4); forest(30, 56, 4); forest(66, 10, 4); forest(66, 54, 4); forest(86, 8, 4); forest(86, 56, 4);
      mine(20, 16, 4); mine(20, 48, 4); mine(76, 30, 3); berries(18, 30, 6); berries(18, 38, 5);
      clearArea(9, 31, 8); clearArea(8, 14, 8);
      B('saray', 0, 8, 30, { label: 'Ordu Karargâhı' }); B('kamp', 0, 12, 34, { label: 'Ordugâh' }); houses(0, 2, 11, 4, 3);
      crew('reaya', 0, 10, 12, 29, {}, 5); crew('azap', 0, 24, 18, 26, {}, 8); crew('okcu', 0, 18, 22, 29, {}, 9); crew('sipahi', 0, 10, 18, 35, {}, 10); crew('yeniceri', 0, 14, 21, 32, {}, 7); crew('top', 0, 4, 24, 28, {}, 4); U('fatih', 0, 16, 31);
      B('kamp', 1, 84, 30, { label: 'Uzun Hasan Ordugâhı' }); B('kamp', 1, 80, 12, { label: 'Akkoyunlu Kanadı' }); B('kamp', 1, 80, 48, { label: 'Akkoyunlu Kanadı' }); B('burc', 1, 76, 26); B('burc', 1, 76, 36);
      U('bey', 1, 83, 34, { name: 'Uzun Hasan', guard: true, desc: 'Akkoyunlu hükümdarı.' });
      G.flags.zeynel = U('bey', 1, 76, 31, { name: 'Zeynel Bey', ai: 'army', rally: TP(76, 31), desc: 'Uzun Hasan\'ın oğlu. Öldürülürse Akkoyunlu ordusu sarsılır.' });
      crew('sipahi', 1, 24, 74, 24, { ai: 'army', rally: TP(74, 30) }, 5); crew('okcu', 1, 22, 78, 24, { ai: 'army', rally: TP(76, 30) }, 6); crew('azap', 1, 14, 80, 38, { ai: 'army', rally: TP(76, 33) }, 6);
      setupAI({ income: { f: 4, w: 4, g: 3 }, res: { f: 400, w: 400, g: 400 }, popCap: 130, comp: { sipahi: 3, okcu: 2, azap: 1 }, wave: { first: 100, interval: 140, size: 24, grow: 4 } });
    },
    objectives: [
      { text: 'Zeynel Bey\'i etkisiz hale getir', done: () => G.flags.zeynel && G.flags.zeynel.dead },
      { text: 'Uzun Hasan Ordugâhı\'nı yık', done: () => !alive(1, 'kamp', 'Uzun Hasan Ordugâhı') },
    ],
    events: [
      { t: 3, fn: () => msg('Akkoyunlu ordusu ufukta, Sultanım! Azaplar öne, tüfekliler ve toplar arkaya.', 'good') },
      { t: 90, fn: () => msg('Uzun Hasan\'ın süvarisi hücuma geçiyor!', 'warn') },
    ],
  },
  /* ---------------- 6 ---------------- */
  /* ---------------- İşkodra 1478 ---------------- */
  {
    title: 'İşkodra Kuşatması', date: 'Mayıs–Eylül 1478 — Arnavutluk', W: 80, H: 64, seed: 111, art: 'iskodra',
    colors: ['#c0392b', '#2471a3'], enemy: 'Venedik (İşkodra muhafızları)', sym: '✚',
    brief: `Arnavutluk'ta Venedik'in elindeki son büyük kale: İşkodra, Rozafa tepesinde, gölle nehirlerin kucakladığı sarp bir kayalık üzerinde.\n\nFatih kuşatmaya bizzat geliyor. Dev toplar oracıkta, kuşatma alanında dökülecek; aylarca sürecek bir bombardıman başlıyor.\n\nSurlarda gedik aç ve burçları sustur. Venedik'in yardım ümidini kır.`,
    after: `Rozafa'nın muhafızları aylarca direndi; kale hücumla düşmedi. Ama Venedik, uzayan savaşa dayanamadı ve 25 Ocak 1479 İstanbul Antlaşması ile İşkodra'yı Osmanlı'ya bıraktı.`,
    story: ["Mayıs 1478. Ordu Rozafa tepesinin eteğine kuruldu. Dökümhaneler kuşatma alanında dev toplar döktü.",
      "Haftalarca süren bombardıman surları yer yer yıktı; ama kayalık tepedeki muhafızlar her hücumu geri püskürttü.",
      "Kale düşmedi ama Venedik yoruldu: Ocak 1479 antlaşmasıyla İşkodra Osmanlı'ya bırakıldı. Fatih'in gözü artık İtalya'daydı."],
    tease: "Rozafa tepesinde Venedik'in son kalesi. Toplarını dök, aylarca sürecek bombardımana hazırlan.",
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'sahi', 'molla', 'balikci', 'kadirga'] },
    start: { f: 700, w: 900, g: 900 }, winText: 'Rozafa\'nın surları yıkıldı, burçlar sustu. Venedik barış istiyor!',
    setup() {
      setWater(0, 0, 13, 63); setTerrain(14, 0, 15, 63, 3); setWater(16, 58, 79, 63); setTerrain(16, 56, 79, 57, 3);
      forest(20, 8, 5); forest(30, 20, 4); forest(74, 8, 4); forest(76, 30, 4); forest(24, 48, 4);
      mine(22, 30, 4); mine(36, 50, 4); berries(20, 40, 6); berries(34, 12, 5); clearArea(28, 40, 8);
      B('saray', 0, 22, 38, { label: 'Ordugâh' }); B('dokum', 0, 28, 44, { label: 'Sahra Dökümhanesi' }); B('tersane', 0, 16, 30, { label: 'Göl İskelesi' }); houses(0, 18, 45, 3, 1);
      crew('reaya', 0, 10, 26, 40, {}, 5); crew('azap', 0, 10, 32, 34, {}, 5); crew('okcu', 0, 8, 32, 30, {}, 4); crew('yeniceri', 0, 10, 36, 38, {}, 5); crew('sipahi', 0, 6, 34, 44, {}, 3); crew('top', 0, 5, 38, 30, {}, 5); U('sahi', 0, 36, 34); U('fatih', 0, 30, 38);
      wallLine(1, 46, 14, 70, 14, 'sur', 'Rozafa Suru'); wallLine(1, 46, 38, 70, 38, 'sur', 'Rozafa Suru'); wallLine(1, 46, 14, 46, 38, 'sur', 'Rozafa Suru'); wallLine(1, 70, 14, 70, 38, 'sur', 'Rozafa Suru');
      B('kapi', 1, 46, 25, { label: 'Rozafa Kapısı' }); B('kapi', 1, 46, 26, { label: 'Rozafa Kapısı' }); setTerrain(47, 15, 69, 37, 4);
      for (const [x, y] of [[47, 15], [68, 15], [47, 36], [68, 36], [57, 15], [57, 36]]) B('burc', 1, x, y, { label: 'Rozafa Burcu' });
      B('kale', 1, 56, 24, { label: 'Rozafa Kalesi', hp: 7000 }); B('kisla', 1, 50, 18); B('kisla', 1, 62, 30); B('ev', 1, 64, 18); B('ev', 1, 50, 31);
      for (let y = 16; y <= 36; y += 3) U('okcu', 1, 47, y, { guard: true });
      crew('azap', 1, 10, 52, 22, { guard: true }, 5); crew('okcu', 1, 8, 60, 28, { guard: true }, 4);
      G.flags.walls0 = G.blds.filter(b => b.owner === 1 && b.type === 'sur').length;
      setupAI({ income: { f: 2.5, w: 2.5, g: 2 }, res: { f: 300, w: 300, g: 300 }, popCap: 60, comp: { azap: 3, okcu: 3, sovalye: 1 }, wave: { first: 480, interval: 240, size: 6, grow: 2 } });
    },
    objectives: [
      { text: 'Rozafa surlarında gedik aç (12 sur parçası yık)', done: () => G.flags.walls0 - G.blds.filter(b => b.owner === 1 && b.type === 'sur').length >= 12, prog: () => Math.min(12, G.flags.walls0 - G.blds.filter(b => b.owner === 1 && b.type === 'sur').length) + '/12' },
      { text: 'Rozafa burçlarını sustur', done: () => !G.blds.some(b => b.owner === 1 && b.type === 'burc'), prog: () => (6 - G.blds.filter(b => b.owner === 1 && b.type === 'burc').length) + '/6' },
      { text: 'Rozafa Kalesi\'ni düşür (isteğe bağlı — tarihte düşmedi)', opt: true, done: () => !alive(1, 'kale', 'Rozafa Kalesi') },
    ],
    events: [
      { t: 3, fn: () => msg('Toplarını surlara yönelt. Sahra Dökümhanesi\'nde yeni toplar dökebilirsin.', 'good') },
      { t: 30, fn: () => msg('Dökümhane\'deki "Dökümcülük" ilmi toplarını güçlendirir. Demirhane\'de zırh geliştir.') },
      { t: 420, fn: () => { spawnWave(1, [['azap', 8], ['okcu', 6], ['sovalye', 4]], 76, 50, aiTarget()); msg('Venedik\'in Arnavut müttefikleri arkadan saldırıyor!', 'warn'); } },
    ],
  },
  {
    title: 'Otranto', art: 'brief6', date: 'Temmuz–Ağustos 1480 — Güney İtalya', W: 80, H: 64, seed: 66,
    colors: ['#c0392b', '#c9a227'], enemy: 'Napoli Krallığı', sym: '✚',
    brief: `Fatih'in son büyük hamlesi: "Roma'yı almak." Gedik Ahmed Paşa komutasındaki donanma, Temmuz 1480'de Adriyatik'i geçip İtalya'nın Otranto kıyısına asker çıkarıyor. Aynı yıl Mesih Paşa Rodos'u da kuşatıyor, ama o kale direnecek.\n\nBu görevde Gedik Ahmed Paşa'yı yönetiyorsun. Kıyıya ulaştın: Otranto surların ardında. Napoli kralının yardım ordusu yolda.\n\nTopları sur önüne getir, kaleyi düşür ve gelen takviyeyi karşıla.`,
    after: `Otranto 11 Ağustos 1480'de düştü; Osmanlı'nın İtalya'daki ilk kalıcı üssü oldu. Fatih, bir sonraki seferini hazırlarken tarihe geçecek son yolculuğuna çıkıyordu...`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'akinci', 'yeniceri', 'top', 'molla', 'balikci', 'kadirga', 'bastarda'] },
    start: { f: 500, w: 700, g: 500 }, winText: 'Otranto Kalesi düştü! İtalya\'da Osmanlı bayrağı dalgalanıyor.',
    setup() {
      setWater(0, 0, 8, 63); setTerrain(9, 0, 12, 63, 3); forest(16, 8, 5); forest(18, 56, 5); forest(28, 22, 4); forest(28, 44, 4); forest(66, 8, 5); forest(68, 56, 5); forest(70, 30, 3);
      mine(18, 14, 4); mine(18, 50, 4); mine(26, 31, 3); berries(20, 24, 6); berries(20, 40, 5);
      clearArea(16, 32, 8);
      B('saray', 0, 14, 30, { label: 'Kıyı Karargâhı' }); B('kamp', 0, 14, 35, { label: 'Çıkarma Kampı' }); houses(0, 17, 17, 4, 2);
      crew('reaya', 0, 10, 18, 31, {}, 5); crew('azap', 0, 20, 24, 29, {}, 10); crew('okcu', 0, 16, 24, 32, {}, 8); crew('sipahi', 0, 8, 22, 36, {}, 8); crew('yeniceri', 0, 12, 26, 28, {}, 6); crew('top', 0, 5, 27, 33, {}, 5);
      U('pasa', 0, 20, 31, { name: 'Gedik Ahmed Paşa', desc: 'Osmanlı vezir-i âzamı ve kaptan-ı derya. Ölürse görev kaybedilir.' });
      for (const [x, y] of [[35, 15], [60, 15], [35, 46], [60, 46]]) B('burc', 1, x, y, { label: 'Otranto Burcu' });
      B('kapi', 1, 36, 31, { label: 'Batı Kapısı' }); B('kapi', 1, 36, 32, { label: 'Batı Kapısı' }); B('kapi', 1, 60, 31, { label: 'Doğu Kapısı' }); B('kapi', 1, 60, 32, { label: 'Doğu Kapısı' });
      wallLine(1, 36, 16, 60, 16, 'sur', 'Otranto Suru'); wallLine(1, 36, 46, 60, 46, 'sur', 'Otranto Suru'); wallLine(1, 36, 16, 36, 46, 'sur', 'Otranto Suru'); wallLine(1, 60, 16, 60, 46, 'sur', 'Otranto Suru');
      setTerrain(37, 17, 59, 45, 4); setTerrain(30, 31, 36, 32, 2); setTerrain(61, 31, 70, 32, 2);
      B('kale', 1, 48, 28, { label: 'Otranto Kalesi' }); B('kisla', 1, 41, 22); B('kisla', 1, 41, 38); B('ev', 1, 54, 20); B('ev', 1, 54, 38); B('ev', 1, 44, 41); B('ev', 1, 38, 28); B('burc', 1, 54, 28);
      for (const [hx, hy] of [[39, 18], [44, 18], [50, 18], [56, 22], [39, 42], [50, 42], [56, 42], [46, 36], [52, 34]]) if (![0, 1].some(a => [0, 1].some(b2 => G.occ[idx(hx + a, hy + b2)]))) B('ev', 1, hx, hy);
      for (let y = 18; y <= 44; y += 3) U('okcu', 1, 37, y, { guard: true });
      crew('azap', 1, 16, 39, 24, { guard: true }, 8); crew('sovalye', 1, 12, 44, 32, { guard: true }, 6); crew('okcu', 1, 12, 54, 24, { guard: true }, 6);
      setupAI({ income: { f: 2.5, w: 2.5, g: 2 }, res: { f: 300, w: 300, g: 200 }, popCap: 70, comp: { azap: 2, okcu: 2, sovalye: 2 }, wave: { first: 600, interval: 240, size: 10, grow: 2 } });
    },
    objectives: [
      { text: 'Otranto Kalesi\'ni yık', done: () => !alive(1, 'kale', 'Otranto Kalesi') },
      { text: 'Napoli takviyesini püskürt (isteğe bağlı)', opt: true, done: () => G.flags.relief && count(1, e => e.kind === 'u' && e.ai === 'wave') === 0 },
    ],
    events: [
      { t: 3, fn: () => msg('Kıyıdayız Paşam! Otranto surlarının ardında. Topları öne alın.', 'good') },
      { t: 480, fn: () => msg('Napoli kralının yardım ordusu yaklaşıyor!', 'warn') },
      { t: 540, fn: () => { G.flags.relief = true; const tg = aiTarget(); spawnWave(1, [['sovalye', 10], ['okcu', 8], ['azap', 10]], 76, 30, tg); msg('Napoli ordusu doğudan geliyor! Arkanı kolla.', 'warn'); } },
    ],
  },
];

const EPILOGUE = {
  title: 'Hünkârçayırı — 3 Mayıs 1481',
  lines: [
    'Bahar 1481. Fatih Sultan Mehmed yeni bir sefer için büyük bir ordu topluyor. Hedefin neresi olduğu, onu bırakın düşmanları, devlet erkânı bile bilmiyor. (Rodos mu, Mısır mı, İtalya mı — tarihçiler bugün hâlâ tartışır.)',
    'Yıllardır gut ve şişkinlik hastalığından muzdarip olan Sultan, ordunun başında İstanbul\'dan Anadolu yakasına geçiyor.',
    'Gebze yakınlarındaki Hünkârçayırı\'na ulaştığında hastalığı şiddetleniyor.',
    '3 Mayıs 1481\'de, 49 yaşında vefat ediyor. (Zehirlenme rivayetleri vardır ama kesin bir kanıt yoktur.)',
    'Otuz yıl hüküm süren Fatih; Bizans\'ı sona erdirmiş, İstanbul\'u başkent yapmış, Balkanlar\'ı, Anadolu\'yu ve Karadeniz kıyılarını Osmanlı\'ya katmıştı. İstanbul\'da yaptırdığı Fatih Camii\'nin yanındaki türbeye defnedildi.',
    'Bir ordu komutanı, bir devlet kurucusu, bir şehir fatihi: Sultan II. Mehmed — "Fatih".',
  ],
};
