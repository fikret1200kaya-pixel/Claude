'use strict';
/* ====== FATİH — Kampanya: Tahta çıkıştan ölüme ====== */
function crew(type, owner, n, tx, ty, o, cols) { cols = cols || 6; for (let i = 0; i < n; i++) U(type, owner, tx + i % cols, ty + ((i / cols) | 0), Object.assign({}, o)); }
function houses(owner, tx, ty, cols, rows) { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) B('ev', owner, tx + c * 3, ty + r * 3); }
function setupAI(cfg) { G.ai = Object.assign({ n: 0, next: cfg.wave ? cfg.wave.first : 0 }, cfg); Object.assign(G.players[1], cfg.res || {}); G.players[1].cap = cfg.popCap; }
const wallCount = () => G.blds.filter(b => b.owner === 1 && (b.type === 'sur' || b.type === 'kapi')).length;
const alive = (owner, type, label) => G.blds.some(b => b.owner === owner && b.type === type && (!label || b.name === label));
const spawnWave = (owner, list, tx, ty, target) => { list.forEach(([t, n, o]) => { for (let i = 0; i < n; i++) { const u = U(t, owner, tx + (Math.random() * 4 | 0), ty + (Math.random() * 6 | 0), Object.assign({ ai: 'wave' }, o)); if (target) orderAmove(u, target.x, target.y); } }); };
const BUILD_ALL = ['ev', 'ambar', 'tarla', 'kisla', 'ahir', 'ocak', 'dokum', 'kule'];

const MISSIONS = [
  /* ---------------- 1 ---------------- */
  {
    title: 'Tahta Çıkış', date: 'Şubat 1451 — Edirne', W: 64, H: 64, seed: 11,
    colors: ['#c0392b', '#2e8b57'], enemy: 'Karamanoğulları',
    brief: `II. Murad'ın vefatıyla 19 yaşındaki Şehzade Mehmed, Edirne'de ikinci kez tahta çıkıyor. İlk saltanatı (1444–1446) çocuk yaşta ve kısa sürmüştü; bu kez dünya onu tecrübesiz bir genç olarak görüyor.\n\nFırsatı kaçırmayan Karamanoğlu İbrahim Bey, Anadolu'daki sınır boylarına akın düzenliyor. Genç Sultan'ın ilk işi, otoritesini kanıtlamak.\n\nÖnce ekonomini kur: Reayaları ağaçlara, altın madenine ve yaban meyvesine gönder. Sonra bir Kışla kurup ordunu topla ve Karaman Kampı'nı yık.`,
    after: `Karaman tehdidi bastırıldı. Genç Sultan, ilk sınavını geçti; gözünü artık çok daha büyük bir hedefe dikmişti: Doğu Roma'nın başkenti Konstantiniyye.`,
    avail: { build: ['ev', 'ambar', 'tarla', 'kisla', 'kule'], train: ['reaya', 'azap', 'okcu'] },
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
      { t: 270, fn: () => msg('Karaman akıncıları toplanıyor! Hazırlıklı ol.', 'warn') },
    ],
  },
  /* ---------------- 2 ---------------- */
  {
    title: 'Boğazkesen', date: 'Nisan–Ağustos 1452 — Boğaz', W: 72, H: 64, seed: 22,
    colors: ['#c0392b', '#6c3fa0'], enemy: 'Bizans', sym: '✚',
    brief: `İstanbul'u fethetmek için önce Boğaz'ın kontrolü şart. Anadolu yakasında atası Yıldırım Bayezid'in yaptırdığı Anadoluhisarı var; Sultan Mehmed tam karşısına, Rumeli yakasına bir hisar inşa etmeye karar veriyor.\n\nHisar yaklaşık dört buçuk ayda tamamlanacak ve Karadeniz'den gelen yardımı kesecek; adı "Boğazkesen" olacak.\n\nAltın ve odun topla, işaretli alana Rumeli Hisarı'nı kur. Bizans akıncıları inşaatı bozmaya çalışacak: işçileri koru. Hisar bitince Bizans karakolunu yık.`,
    after: `Rumeli Hisarı 31 Ağustos 1452'de tamamlandı. Boğaz artık Osmanlı'nın elindeydi; ilk gemi geçişi denemesinde top ateşiyle batırılan bir Venedik gemisi, İstanbul'a yardımın yolunun kapandığını gösterdi.`,
    avail: { build: ['ev', 'ambar', 'tarla', 'kisla', 'kule', 'hisar'], train: ['reaya', 'azap', 'okcu'] },
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
    title: 'İstanbul\'un Fethi', date: '6 Nisan – 29 Mayıs 1453 — Konstantiniyye', W: 104, H: 72, seed: 33,
    colors: ['#c0392b', '#6c3fa0'], enemy: 'Bizans İmparatorluğu', sym: '✚',
    brief: `21 yaşındaki Sultan Mehmed, bin yıldır ayakta duran Theodosius Surları'nın önünde. Şehirde yaklaşık 7.000 savunmacı var; Haliç ağzı zincirle kapalı.\n\nMacar usta Orban'ın döktüğü Şahi Topu ve balyemez toplarla surları dövmek, kapıları zorlamak gerek. Haliç zincirini aşmak için donanma karadan yürütülecek.\n\nTopçularını surların menziline getir, gedik aç, sonra ordunu şehre sok ve Ayasofya'nın çevresini düşmandan temizleyip ele geçir.\n\nİpucu: Okçu ve piyade surlara neredeyse hasar veremez. Surları top yıkar!`,
    after: `29 Mayıs 1453 sabahı şehir fethedildi. Son Bizans imparatoru XI. Konstantinos surlarda savaşarak öldü. Fatih, İstanbul'u başkent yaptı, Ayasofya'yı camiye çevirdi ve "Fatih" unvanını aldı. Bir çağ kapanmış, bir çağ açılmıştı.`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'yeniceri', 'top', 'sahi'] },
    start: { f: 900, w: 1100, g: 900 }, winText: 'Ayasofya\'ya Osmanlı sancağı dikildi. İstanbul fethedildi!',
    setup() {
      setWater(0, 0, 103, 6); setWater(0, 64, 103, 71); setWater(0, 7, 4, 63);
      forest(78, 14, 6); forest(80, 58, 6); forest(94, 30, 5); forest(70, 40, 4); forest(60, 10, 3, .5); forest(62, 60, 3, .5); forest(90, 48, 4);
      mine(92, 18, 4); mine(92, 52, 4); mine(72, 28, 3); berries(84, 26, 6); berries(84, 42, 6);
      clearArea(88, 35, 10);
      // Ottoman
      B('saray', 0, 88, 34, { label: 'Otağ-ı Hümayun' }); B('kamp', 0, 84, 38, { label: 'Ordugâh' }); houses(0, 92, 28, 4, 2); houses(0, 92, 40, 4, 2);
      crew('reaya', 0, 12, 85, 33, {}, 4); crew('azap', 0, 20, 79, 30, {}, 5); crew('okcu', 0, 12, 76, 36, {}, 6); crew('sipahi', 0, 8, 79, 40, {}, 8); crew('yeniceri', 0, 10, 74, 31, {}, 5); U('fatih', 0, 80, 35);
      crew('top', 0, 3, 70, 26, {}, 3);
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
      const cx = 22.5 * TILE, cy = 34.5 * TILE; let mine = 0, en = 0;
      for (const e of G.ents) { if (e.kind !== 'u' || e.dead) continue; const d = Math.hypot(e.x - cx, e.y - cy); if (e.owner === 0 && isMil(e) && d < 7 * TILE) mine++; else if (e.owner === 1 && d < 9 * TILE) en++; }
      if (G.flags.captured) return;
      if (mine >= 3 && en === 0) G.capture += dt; else G.capture = Math.max(0, G.capture - dt * .5);
      if (G.capture >= 8) { G.flags.captured = true; msg('Ayasofya\'ya Ay-yıldızlı sancak dikildi!', 'good'); }
    },
    objectives: [
      { text: 'Surlarda gedik aç (kapı veya sur yık)', done: () => wallCount() < G.flags.walls0 },
      { text: 'Ayasofya çevresini temizle: en az 3 askerle düşmansız 8 sn tut', done: () => G.flags.captured, prog: () => G.capture > 0 ? '%' + Math.floor(G.capture / 8 * 100) : '' },
    ],
    events: [
      { t: 3, fn: () => msg('6 Nisan 1453. Surlar önünde mevzilendik. Toplarla surları dövün, Sultanım!', 'good') },
      { t: 45, fn: () => { crew('sahi', 0, 1, 74, 34, {}, 1); msg('Orban\'ın Şahi Topu cepheye ulaştı! Surlara yaklaştır.', 'good'); } },
      { t: 240, fn: () => msg('Haliç zinciri aşılamıyor... Donanmanın karadan yürütülmesi için hazırlıklar sürüyor.') },
      { t: 600, fn: () => { spawnWave(0, [['azap', 12], ['okcu', 8]], 29, 8); msg('22 Nisan: Osmanlı gemileri gece karadan yürütülüp Haliç\'e indirildi! Kuzey kıyısında takviye geldi.', 'good'); } },
      { t: 900, fn: () => msg('Şehrin morali çöküyor. Son hücum vakti yaklaşıyor!', 'warn') },
    ],
  },
  /* ---------------- 4 ---------------- */
  {
    title: 'Belgrad Kuşatması', date: '4–22 Temmuz 1456 — Belgrad', W: 88, H: 64, seed: 44,
    colors: ['#c0392b', '#1e5fb3'], enemy: 'Macar Krallığı', sym: '✚',
    brief: `İstanbul'dan sonra Fatih'in gözü Orta Avrupa'nın kapısı Belgrad'da. Tuna ve Sava'nın birleştiği yerdeki kale, Macar tarafının en önemli müstahkem noktası.\n\nAma Macar komutan Hunyadi János yardım ordusuyla yaklaşıyor. Kaleyi yıkmak için zamanın sınırlı: yaklaşık 14 dakika.\n\nTopları kaleye yaklaştır, Hunyadi gelince ordunu ikiye bölmeden savun. Sultan'ı koru: tarihte bu kuşatmada Fatih yaralanmıştı.`,
    after: `Belgrad kuşatması tarihte başarısızlıkla sonuçlandı: Hunyadi'nin yardımı ve kalede çıkan sonraki çatışmalarda Osmanlı ordusu ağır kayıp verdi; Sultan yaralandı ve ordu geri çekildi. Hunyadi kısa süre sonra salgında hayatını kaybetti. Fatih hiçbir yenilgiyi unutmadı; bir sonraki seferine çok daha iyi hazırlandı.`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'yeniceri', 'top', 'sahi'] },
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
      wallLine(1, 33, 7, 51, 7, 'sur', 'Kale Suru'); wallLine(1, 33, 23, 51, 23, 'sur', 'Kale Suru'); wallLine(1, 31, 9, 31, 21, 'sur', 'Kale Suru'); wallLine(1, 53, 9, 53, 21, 'sur', 'Kale Suru');
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
  {
    title: 'Otlukbeli', date: '11 Ağustos 1473 — Doğu Anadolu', W: 96, H: 64, seed: 55,
    colors: ['#c0392b', '#d0d0d0'], enemy: 'Akkoyunlular',
    brief: `Akkoyunlu hükümdarı Uzun Hasan, Venedik ile ittifak kurarak Osmanlı'ya meydan okuyor. Doğu'da kaderi belirleyecek büyük savaş Otlukbeli'nde.\n\nUzun Hasan'ın ordusu süvari ağırlıklı ve çok kalabalık. Sizde ise tüfekli Yeniçeriler ve toplar var.\n\nİpucu: Süvarilere karşı Azaplar, mızraklarıyla çok etkilidir. Yeniçeri ve toplar menzilli güçtür. Sultan'ın yakınında savaşan askerler +%20 güç kazanır.\n\nOğlu Zeynel Bey'i etkisiz hale getir ve Ordugâh'ı yık.`,
    after: `Otlukbeli'nde Osmanlı topları ve Yeniçeri tüfekleri Akkoyunlu süvarisini dağıttı; Uzun Hasan'ın oğlu Zeynel Bey savaşta öldü. Doğu cephesi güvene alındı; Fatih artık Anadolu'da hâkim güçtü.`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'yeniceri', 'top'] },
    start: { f: 600, w: 700, g: 600 }, winText: 'Otlukbeli kazanıldı! Akkoyunlu ordusu bozguna uğradı.',
    setup() {
      setWater(46, 0, 48, 17); setWater(46, 25, 48, 37); setWater(46, 45, 48, 63);
      forest(8, 10, 5); forest(10, 54, 5); forest(30, 8, 4); forest(30, 56, 4); forest(66, 10, 4); forest(66, 54, 4); forest(86, 8, 4); forest(86, 56, 4);
      mine(20, 16, 4); mine(20, 48, 4); mine(76, 30, 3); berries(18, 30, 6); berries(18, 38, 5);
      clearArea(9, 31, 8); clearArea(8, 14, 8);
      B('saray', 0, 8, 30, { label: 'Ordu Karargâhı' }); B('kamp', 0, 12, 34, { label: 'Ordugâh' }); houses(0, 2, 11, 4, 3);
      crew('reaya', 0, 10, 12, 29, {}, 5); crew('azap', 0, 24, 18, 26, {}, 8); crew('okcu', 0, 18, 22, 29, {}, 9); crew('sipahi', 0, 10, 18, 35, {}, 10); crew('yeniceri', 0, 14, 21, 32, {}, 7); crew('top', 0, 4, 24, 28, {}, 4); U('fatih', 0, 16, 31);
      B('kamp', 1, 84, 30, { label: 'Uzun Hasan Ordugâhı' }); B('kamp', 1, 80, 12, { label: 'Akkoyunlu Kanadı' }); B('kamp', 1, 80, 48, { label: 'Akkoyunlu Kanadı' }); B('burc', 1, 76, 26); B('burc', 1, 76, 36);
      U('komutan', 1, 83, 34, { name: 'Uzun Hasan', guard: true, desc: 'Akkoyunlu hükümdarı.' });
      G.flags.zeynel = U('komutan', 1, 76, 31, { name: 'Zeynel Bey', ai: 'army', rally: { x: 76 * TILE, y: 31 * TILE }, desc: 'Uzun Hasan\'ın oğlu. Öldürülürse Akkoyunlu ordusu sarsılır.' });
      crew('sipahi', 1, 24, 74, 24, { ai: 'army', rally: { x: 74 * TILE, y: 30 * TILE } }, 5); crew('okcu', 1, 22, 78, 24, { ai: 'army', rally: { x: 76 * TILE, y: 30 * TILE } }, 6); crew('azap', 1, 14, 80, 38, { ai: 'army', rally: { x: 76 * TILE, y: 33 * TILE } }, 6);
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
  {
    title: 'Otranto', date: 'Temmuz–Ağustos 1480 — Güney İtalya', W: 80, H: 64, seed: 66,
    colors: ['#c0392b', '#c9a227'], enemy: 'Napoli Krallığı', sym: '✚',
    brief: `Fatih'in son büyük hamlesi: "Roma'yı almak." Gedik Ahmed Paşa komutasındaki donanma, Temmuz 1480'de Adriyatik'i geçip İtalya'nın Otranto kıyısına asker çıkarıyor. Aynı yıl Mesih Paşa Rodos'u da kuşatıyor, ama o kale direnecek.\n\nBu görevde Gedik Ahmed Paşa'yı yönetiyorsun. Kıyıya ulaştın: Otranto surların ardında. Napoli kralının yardım ordusu yolda.\n\nTopları sur önüne getir, kaleyi düşür ve gelen takviyeyi karşıla.`,
    after: `Otranto 11 Ağustos 1480'de düştü; Osmanlı'nın İtalya'daki ilk kalıcı üssü oldu. Fatih, bir sonraki seferini hazırlarken tarihe geçecek son yolculuğuna çıkıyordu...`,
    avail: { build: BUILD_ALL, train: ['reaya', 'azap', 'okcu', 'sipahi', 'yeniceri', 'top'] },
    start: { f: 500, w: 700, g: 500 }, winText: 'Otranto Kalesi düştü! İtalya\'da Osmanlı bayrağı dalgalanıyor.',
    setup() {
      setWater(0, 0, 8, 63); setTerrain(9, 0, 12, 63, 3); forest(16, 8, 5); forest(18, 56, 5); forest(28, 22, 4); forest(28, 44, 4); forest(66, 8, 5); forest(68, 56, 5); forest(70, 30, 3);
      mine(18, 14, 4); mine(18, 50, 4); mine(26, 31, 3); berries(20, 24, 6); berries(20, 40, 5);
      clearArea(16, 32, 8);
      B('saray', 0, 14, 30, { label: 'Kıyı Karargâhı' }); B('kamp', 0, 14, 35, { label: 'Çıkarma Kampı' }); houses(0, 17, 17, 4, 2);
      crew('reaya', 0, 10, 18, 31, {}, 5); crew('azap', 0, 20, 24, 29, {}, 10); crew('okcu', 0, 16, 24, 32, {}, 8); crew('sipahi', 0, 8, 22, 36, {}, 8); crew('yeniceri', 0, 12, 26, 28, {}, 6); crew('top', 0, 5, 27, 33, {}, 5);
      U('komutan', 0, 20, 31, { name: 'Gedik Ahmed Paşa', desc: 'Osmanlı vezir-i âzamı ve kaptan-ı derya. Ölürse görev kaybedilir.' });
      for (const [x, y] of [[35, 15], [60, 15], [35, 46], [60, 46]]) B('burc', 1, x, y, { label: 'Otranto Burcu' });
      B('kapi', 1, 36, 31, { label: 'Batı Kapısı' }); B('kapi', 1, 36, 32, { label: 'Batı Kapısı' }); B('kapi', 1, 60, 31, { label: 'Doğu Kapısı' }); B('kapi', 1, 60, 32, { label: 'Doğu Kapısı' });
      wallLine(1, 37, 16, 59, 16, 'sur', 'Otranto Suru'); wallLine(1, 37, 46, 59, 46, 'sur', 'Otranto Suru'); wallLine(1, 36, 17, 36, 45, 'sur', 'Otranto Suru'); wallLine(1, 60, 17, 60, 45, 'sur', 'Otranto Suru');
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
