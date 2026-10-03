'use strict';
/* ====== FATİH — Oyun Motoru ====== */
const TILE = 32;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const RESN = { f: 'Yiyecek', w: 'Odun', g: 'Altın' };

// at: saldırı türü — m yakın dövüş, p ok, g barut (ok zırhının yarısını deler), s kuşatma
// ma: yakın dövüş zırhı, pa: ok/mermi zırhı. bonus: sınıfa karşı ek hasar.
const UNITS = {
  reaya: { name: 'Reaya', look: 'reaya', cls: 'civ', hp: 35, atk: 3, at: 'm', range: 0, speed: 62, rate: 1.6, ma: 0, pa: 0, cost: { f: 50 }, pop: 1, time: 12, vision: 6, r: 9, worker: true, bm: .2, desc: 'İşçi. Kaynak toplar, bina inşa eder.' },
  azap: { name: 'Azap', look: 'azap', cls: 'spear', hp: 60, atk: 6, at: 'm', range: 0, speed: 60, rate: 1.2, ma: 1, pa: 0, cost: { f: 50, w: 25 }, pop: 1, time: 14, vision: 6, r: 9, bonus: { cav: 10, hero: 6 }, bm: .35, str: 'Atlılar', weak: 'Okçular, Yeniçeri', desc: 'Mızraklı hafif piyade. Atlılara karşı çok güçlü.' },
  okcu: { name: 'Okçu', look: 'okcu', cls: 'arc', hp: 38, atk: 6, at: 'p', range: 160, speed: 62, rate: 1.4, ma: 0, pa: 0, cost: { w: 45, g: 25 }, pop: 1, time: 16, vision: 7, r: 9, proj: 'arrow', bonus: { spear: 3, gun: 3, ship: 2 }, bm: .08, str: 'Piyade, Yeniçeri', weak: 'Sipahi, Akıncı', desc: 'Menzilli. Piyadeye karşı etkili, atlılara karşı zayıf.' },
  sipahi: { name: 'Sipahi', look: 'sipahi', cls: 'cav', hp: 100, atk: 10, at: 'm', range: 0, speed: 112, rate: 1.2, ma: 2, pa: 1, cost: { f: 70, g: 40 }, pop: 2, time: 20, vision: 7, r: 11, bonus: { arc: 6, sie: 12 }, bm: .3, str: 'Okçular, Toplar', weak: 'Azap, Yeniçeri', desc: 'Tımarlı süvari. Okçu ve topları ezer.' },
  yeniceri: { name: 'Yeniçeri', look: 'yeniceri', cls: 'gun', hp: 65, atk: 13, at: 'g', range: 192, speed: 58, rate: 2.0, ma: 1, pa: 1, cost: { f: 60, g: 70 }, pop: 1, time: 22, vision: 7, r: 9, proj: 'shot', bonus: { cav: 6, hero: 4 }, bm: .25, str: 'Ağır süvari, Şövalye', weak: 'Okçular, Akıncı, Top', desc: 'Kapıkulu tüfekli piyadesi. Barut zırhı deler.' },
  sovalye: { name: 'Şövalye', look: 'sovalye', cls: 'cav', hp: 130, atk: 12, at: 'm', range: 0, speed: 92, rate: 1.3, ma: 3, pa: 3, cost: { f: 90, g: 60 }, pop: 2, time: 24, vision: 6, r: 11, bonus: { arc: 5 }, bm: .3, str: 'Okçular, Piyade', weak: 'Azap, Yeniçeri', desc: 'Ağır zırhlı süvari. Oklara dayanıklı.' },
  top: { name: 'Balyemez Topu', look: 'top', cls: 'sie', hp: 120, atk: 85, at: 's', range: 256, speed: 32, rate: 5, ma: 2, pa: 5, cost: { w: 150, g: 120 }, pop: 3, time: 40, vision: 6, r: 12, proj: 'ball', splash: 44, bm: 3, str: 'Binalar, Surlar, toplu piyade', weak: 'Atlılar', desc: 'Kuşatma topu. Surlara ve binalara ağır hasar verir.' },
  sahi: { name: 'Şahi Topu', look: 'sahi', cls: 'sie', hp: 160, atk: 230, at: 's', range: 352, speed: 24, rate: 9, ma: 2, pa: 6, cost: { w: 350, g: 350 }, pop: 5, time: 70, vision: 6, r: 15, proj: 'ball', splash: 60, bm: 3.5, str: 'Surlar, Binalar', weak: 'Atlılar', desc: 'Orban\'ın döktüğü dev top. Sur yıkıcı.' },
  fatih: { name: 'Fatih Sultan Mehmed', look: 'fatih', cls: 'hero', hp: 700, atk: 22, at: 'm', range: 0, speed: 98, rate: 1.0, ma: 4, pa: 4, cost: {}, pop: 0, vision: 8, r: 12, bm: .5, hero: true, bonus: { arc: 6 }, desc: 'Komutan. Çevresindeki askerlere +%20 saldırı gücü verir. Ölürse görev kaybedilir.' },
  pasa: { name: 'Paşa', look: 'sipahi', cls: 'hero', hp: 520, atk: 20, at: 'm', range: 0, speed: 100, rate: 1.0, ma: 3, pa: 3, cost: {}, pop: 0, vision: 8, r: 12, bm: .5, hero: true, bonus: { arc: 6 }, desc: 'Osmanlı komutanı. Çevresindeki askerlere +%20 saldırı gücü verir.' },
  bey: { name: 'Bey', look: 'akinci', cls: 'hero', hp: 420, atk: 18, at: 'm', range: 0, speed: 104, rate: 1.0, ma: 2, pa: 2, cost: {}, pop: 0, vision: 8, r: 12, bm: .5, hero: true, desc: 'Türkmen beyi.' },
  akinci: { name: 'Akıncı', look: 'akinci', cls: 'cav', hp: 75, atk: 8, at: 'm', range: 0, speed: 128, rate: 1.1, ma: 1, pa: 1, cost: { f: 60, g: 25 }, pop: 1, time: 15, vision: 11, r: 11, bonus: { arc: 4, gun: 5, civ: 4, sie: 8 }, bm: .25, str: 'Okçular, Yeniçeri, Reaya', weak: 'Azap, Sipahi', desc: 'Hızlı keşif süvarisi. Çok geniş görüş; yeniçeri ve okçuya baskın yapar.' },
  molla: { name: 'Molla', look: 'molla', cls: 'civ', hp: 45, atk: 0, at: 'm', range: 0, speed: 56, rate: 1, ma: 0, pa: 0, cost: { f: 40, g: 80 }, pop: 1, time: 24, vision: 12, r: 9, healer: true, heal: 4, desc: 'Yakındaki yaralı askerleri iyileştirir. Çok geniş görüş alanıyla haritayı açar.' },
  komutan: { name: 'Komutan', look: 'komutan', cls: 'hero', hp: 380, atk: 18, at: 'm', range: 0, speed: 94, rate: 1.1, ma: 3, pa: 3, cost: {}, pop: 0, vision: 8, r: 12, bm: .5, hero: true, desc: 'Düşman komutanı.' },
  balikci: { name: 'Balıkçı Kayığı', look: 'balikci', cls: 'ship', hp: 60, atk: 0, at: 'm', range: 0, speed: 92, rate: 1, ma: 0, pa: 2, cost: { w: 60 }, pop: 1, time: 14, vision: 6, r: 14, naval: true, fisher: true, desc: 'Denizden balık tutar ve Tersane\'ye taşır. Sınırsız gibi bol yiyecek.' },
  kadirga: { name: 'Kadırga', look: 'kadirga', cls: 'ship', hp: 280, atk: 9, at: 'g', range: 192, speed: 86, rate: 1.6, ma: 2, pa: 4, cost: { w: 180, g: 60 }, pop: 3, time: 30, vision: 8, r: 22, naval: true, proj: 'shot', bonus: { ship: 6 }, bm: .4, str: 'Gemiler, kıyıdaki birlikler', weak: 'Baştarda, Kuleler', desc: 'Kürekli savaş gemisi. Pruva topu ve tüfeklerle hızlı saldırır.' },
  bastarda: { name: 'Baştarda', look: 'bastarda', cls: 'ship', hp: 450, atk: 32, at: 's', range: 256, speed: 70, rate: 4.5, ma: 3, pa: 6, cost: { w: 300, g: 200 }, pop: 4, time: 45, vision: 9, r: 26, naval: true, proj: 'ball', splash: 28, bm: 2.2, bonus: { ship: 14 }, str: 'Binalar, Gemiler', weak: 'Kadırga sürüsü', desc: 'Büyük amiral gemisi. Üç pruva topuyla kıyı tahkimatını döver.' },
};
// Hristiyan (✚) düşmanların piyade ve okçusu Avrupa kıyafetiyle görünür
const EURO_LOOK = { azap: 'avr_piyade', okcu: 'avr_okcu' };
const isEuro = o => o && (G.m.factions ? (G.m.factions[o] && G.m.factions[o].sym === '✚') : (G.m.sym === '✚' && G.team[o] !== G.team[0]));
const lookOf = u => (isEuro(u.owner) && EURO_LOOK[u.type] && typeof SPRITES !== 'undefined' && SPRITES.units && SPRITES.units[EURO_LOOK[u.type]]) ? EURO_LOOK[u.type] : u.d.look;
const CLSN = { civ: 'işçi', spear: 'mızraklı', arc: 'okçu', gun: 'tüfekli', cav: 'atlı', sie: 'top', hero: 'komutan', ship: 'gemi' };

const BUILDS = {
  saray: { name: 'Saray', w: 3, h: 3, hp: 1800, cost: {}, time: 0, pop: 10, drop: true, trains: ['reaya'], techs: ['balta', 'kazma', 'saban', 'kagni'], atk: 9, range: 224, rate: 2, vision: 9, desc: 'Ana bina. Reaya yetiştirir, kaynak teslim noktası; ekonomi ilimleri.' },
  ev: { name: 'Ev', w: 2, h: 2, hp: 350, cost: { w: 40 }, time: 14, pop: 5, vision: 4, desc: 'Nüfus sınırını +5 artırır.' },
  ambar: { name: 'Ambar', w: 2, h: 2, hp: 450, cost: { w: 60 }, time: 16, drop: true, vision: 4, desc: 'Kaynak teslim noktası.' },
  tarla: { name: 'Tarla', w: 2, h: 2, hp: 250, cost: { w: 60 }, time: 12, farm: true, vision: 3, desc: 'Sınırsız yiyecek kaynağı.' },
  kisla: { name: 'Kışla', w: 3, h: 3, hp: 1000, cost: { w: 150 }, time: 30, trains: ['azap', 'okcu'], techs: ['talim'], vision: 5, desc: 'Azap ve okçu yetiştirir.' },
  ahir: { name: 'Ahır', w: 3, h: 3, hp: 1000, cost: { w: 150, g: 30 }, time: 30, trains: ['sipahi', 'akinci'], techs: ['turkmen'], vision: 5, desc: 'Sipahi ve Akıncı yetiştirir.' },
  demirhane: { name: 'Demirhane', w: 3, h: 3, hp: 1000, cost: { w: 150 }, time: 30, techs: ['kilic', 'kilic2', 'zirh', 'lamel', 'atzirhi', 'temren', 'kemankes'], req: 'kisla', vision: 5, desc: 'Silah ve zırh geliştirmeleri. (Kışla gerekir)' },
  cami: { name: 'Cami', w: 3, h: 3, hp: 1600, cost: { w: 200, g: 150 }, time: 45, trains: ['molla'], vision: 8, healAura: 1, desc: 'Molla yetiştirir. Çevresindeki birimleri yavaşça iyileştirir.' },
  medrese: { name: 'Medrese', w: 3, h: 3, hp: 1400, cost: { w: 220, g: 180 }, time: 50, techs: ['cografya', 'tip', 'mimari', 'hendese'], req: 'cami', vision: 6, desc: 'İlim merkezi: teknoloji araştırır. (Cami gerekir)' },
  ocak: { name: 'Yeniçeri Ocağı', w: 3, h: 3, hp: 1200, cost: { w: 200, g: 100 }, time: 40, trains: ['yeniceri'], techs: ['fitil'], req: 'kisla', vision: 5, desc: 'Yeniçeri yetiştirir. (Kışla gerekir)' },
  dokum: { name: 'Dökümhane', w: 3, h: 3, hp: 1200, cost: { w: 250, g: 150 }, time: 45, trains: ['top', 'sahi'], techs: ['topcu'], req: 'kisla', vision: 5, desc: 'Kuşatma topları döker. (Kışla gerekir)' },
  tersane: { name: 'Tersane', w: 3, h: 3, hp: 1300, cost: { w: 175 }, time: 35, trains: ['balikci', 'kadirga', 'bastarda'], techs: ['ag', 'kalafat', 'pusula'], drop: true, dock: true, vision: 6, desc: 'Gemi inşa eder; balık teslim noktası. Kıyıya, suya bitişik kurulur.' },
  kule: { name: 'Gözcü Kulesi', w: 2, h: 2, hp: 800, cost: { w: 100, g: 40 }, time: 25, atk: 11, range: 224, rate: 1.6, vision: 8, tower: true, desc: 'Yakındaki düşmanlara ok atar.' },
  hisar: { name: 'Rumeli Hisarı', w: 4, h: 4, hp: 3500, cost: { w: 450, g: 250 }, time: 90, atk: 18, range: 288, rate: 1.4, vision: 10, tower: true, zone: true, desc: 'Boğaz\'ı kontrol eden hisar. Yalnızca işaretli alana kurulur.' },
  sur: { name: 'Sur', w: 1, h: 1, hp: 1800, wall: true, vision: 1 },
  kapi: { name: 'Kapı', w: 1, h: 1, hp: 1100, wall: true, gate: true, vision: 1 },
  burc: { name: 'Burç', w: 2, h: 2, hp: 1600, atk: 11, range: 230, rate: 1.7, vision: 7, tower: true },
  kale: { name: 'Kale', w: 4, h: 4, hp: 4500, atk: 16, range: 256, rate: 1.5, pop: 20, trains: ['azap', 'okcu', 'sovalye'], vision: 9, tower: true },
  kamp: { name: 'Ordugâh', w: 3, h: 3, hp: 1300, pop: 20, trains: ['azap', 'okcu', 'sipahi', 'sovalye'], vision: 7, drop: true },
  pazar: { name: 'Pazar', w: 3, h: 3, hp: 1100, cost: { w: 175 }, time: 35, market: true, vision: 6, desc: 'Ticaret: odun, yiyecek ve altını birbirine çevir. Fiyatlar alışverişe göre değişir.' },
  ayasofya: { name: 'Ayasofya', w: 5, h: 5, hp: 99999, landmark: true, vision: 4 },
};

// fx: [özellik, sınıflar (null = hepsi), değer]. atk/ma/pa/rng: ekleme; hp/spd/rate/atkp: oran
const INF = ['spear', 'arc', 'gun', 'civ'], CAV = ['cav', 'hero'], MELEE = ['spear', 'cav', 'hero'], RANGED = ['arc', 'gun'];
const TECHS = {
  balta: { name: 'Çift Ağızlı Balta', cost: { f: 100, w: 50 }, time: 25, fx: [['gw', null, .2]], desc: 'Odun toplama +%20.' },
  kazma: { name: 'Maden Kazması', cost: { f: 100, w: 75 }, time: 25, fx: [['gg', null, .2]], desc: 'Altın toplama +%20.' },
  saban: { name: 'Demir Saban', cost: { f: 75, w: 100 }, time: 25, fx: [['gf', null, .2]], desc: 'Yiyecek toplama (tarla, yemiş) +%20.' },
  kagni: { name: 'Kağnı Arabası', cost: { f: 150, w: 150 }, time: 35, req: 'balta', fx: [['spd', ['civ'], .15], ['carry', null, 5]], desc: 'Reaya hızı +%15, bir seferde +5 kaynak taşır.' },
  kilic: { name: 'Dövme Kılıç', cost: { f: 100, g: 50 }, time: 30, fx: [['atk', MELEE, 1]], desc: 'Yakın dövüş birimleri +1 saldırı.' },
  kilic2: { name: 'Şam Çeliği', cost: { f: 200, g: 150 }, time: 45, req: 'kilic', fx: [['atk', MELEE, 2]], desc: 'Yakın dövüş birimleri +2 saldırı daha.' },
  zirh: { name: 'Zincir Zırh', cost: { f: 100, g: 60 }, time: 30, fx: [['ma', INF, 1], ['pa', INF, 1]], desc: 'Piyadeye +1 yakın / +1 ok zırhı.' },
  lamel: { name: 'Lamel Zırh', cost: { f: 200, g: 150 }, time: 45, req: 'zirh', fx: [['ma', INF, 1], ['pa', INF, 2]], desc: 'Piyadeye +1 yakın / +2 ok zırhı daha.' },
  atzirhi: { name: 'Bargüstüvan (At Zırhı)', cost: { f: 150, g: 100 }, time: 40, fx: [['ma', CAV, 1], ['pa', CAV, 2]], desc: 'Atlılara +1 yakın / +2 ok zırhı.' },
  temren: { name: 'Çelik Temren', cost: { w: 100, g: 50 }, time: 30, fx: [['atk', RANGED, 1], ['tatk', null, 1]], desc: 'Okçu, yeniçeri ve kulelere +1 saldırı.' },
  kemankes: { name: 'Kemankeş Ustalığı', cost: { w: 200, g: 150 }, time: 45, req: 'temren', fx: [['atk', ['arc'], 1], ['rng', ['arc'], 32]], desc: 'Okçulara +1 saldırı, +1 kare menzil.' },
  talim: { name: 'Sefer Talimi', cost: { f: 150, g: 50 }, time: 30, fx: [['hp', ['spear', 'arc', 'gun'], .15]], desc: 'Piyade canı +%15.' },
  turkmen: { name: 'Türkmen Atları', cost: { f: 200, g: 100 }, time: 40, fx: [['spd', ['cav'], .1], ['hp', ['cav'], .1]], desc: 'Atlıların hızı ve canı +%10.' },
  fitil: { name: 'Fitilli Tüfek', cost: { f: 150, g: 150 }, time: 40, fx: [['rate', ['gun'], .2]], desc: 'Yeniçeriler %20 daha hızlı ateş eder.' },
  topcu: { name: 'Dökümcülük', cost: { w: 200, g: 250 }, time: 45, fx: [['atkp', ['sie'], .25], ['rngp', ['sie'], .1]], desc: 'Topların hasarı +%25, menzili +%10.' },
  cografya: { name: 'İlm-i Coğrafya', cost: { f: 150, g: 150 }, time: 35, desc: 'Haritanın tamamını açar.' },
  tip: { name: 'Tıp İlmi', cost: { f: 150, g: 200 }, time: 40, desc: 'Tüm birimler yavaşça iyileşir; mollalar iki kat iyileştirir.' },
  mimari: { name: 'Mimar Ocağı', cost: { f: 100, w: 200, g: 100 }, time: 40, fx: [['bhp', null, .2], ['bspd', null, .3]], desc: 'Bina canı +%20, inşaat hızı +%30.' },
  hendese: { name: 'Hendese (Geometri)', cost: { w: 150, g: 200 }, time: 40, fx: [['tatk', null, 2], ['trng', null, 32]], desc: 'Kule ve kaleler +2 saldırı, +1 kare menzil.' },
  ag: { name: 'Geniş Ağ', cost: { w: 100, f: 50 }, time: 25, fx: [['gfish', null, .3]], desc: 'Balıkçılar %30 daha hızlı balık tutar.' },
  kalafat: { name: 'Kalafat', cost: { w: 150, g: 75 }, time: 35, fx: [['hp', ['ship'], .2], ['pa', ['ship'], 1]], desc: 'Gemi canı +%20, +1 ok zırhı.' },
  pusula: { name: 'Pusula', cost: { w: 100, g: 100 }, time: 30, fx: [['spd', ['ship'], .15], ['vis', ['ship'], 2]], desc: 'Gemiler %15 daha hızlı, görüş +2.' },
};
const techReqOk = (o, id) => !TECHS[id].req || hasTech(o, TECHS[id].req);
// oyuncunun birim sınıfına uygulanan toplam değişiklik
function modOf(o, stat, cls) { const P = G.players[o]; let v = 0; for (const id in P.tech) { const fx = TECHS[id] && TECHS[id].fx; if (fx) for (const [s, c, x] of fx) if (s === stat && (!c || c.includes(cls))) v += x; } return v; }
function recalcUnit(u) {
  const d = u.d, o = u.owner, c = d.cls;
  u.atk = (d.atk + (d.atk ? modOf(o, 'atk', c) : 0)) * (1 + modOf(o, 'atkp', c));
  u.ma = d.ma + modOf(o, 'ma', c); u.pa = d.pa + modOf(o, 'pa', c);
  u.spd = d.speed * (1 + modOf(o, 'spd', c)); u.rate = d.rate * (1 - modOf(o, 'rate', c));
  u.rng = d.range ? (d.range + modOf(o, 'rng', c)) * (1 + modOf(o, 'rngp', c)) : 0;
  u.vis = (d.vision || 6) + modOf(o, 'vis', c);
  const mx = Math.round(d.hp * (1 + modOf(o, 'hp', c)) * (u.hpMul || 1)), f = u.maxhp ? u.hp / u.maxhp : 1; u.maxhp = mx; u.hp = Math.max(1, mx * f);
}
const qTime = q => q.type.startsWith('T:') ? TECHS[q.type.slice(2)].time : UNITS[q.type].time;
const qPop = q => q.type.startsWith('T:') ? 0 : UNITS[q.type].pop;
const qCost = q => q.type.startsWith('T:') ? TECHS[q.type.slice(2)].cost : UNITS[q.type].cost;
const qName = q => q.type.startsWith('T:') ? TECHS[q.type.slice(2)].name : UNITS[q.type].name;
const hasTech = (o, id) => !!(G.players[o].tech && G.players[o].tech[id]);
const rangeOf = u => u.rng || u.d.range;
const gatherMul = (o, res) => 1 + modOf(o, res === 4 ? 'gfish' : ['', 'gw', 'gg', 'gf'][res], null);
let MS = 1;                       // harita ölçeği: görev koordinatları bununla büyütülür
const sc = v => Math.round(v * MS);
const sc1 = v => Math.round((v + 1) * MS) - 1;
const sfmt = c => Object.entries(c).map(([k, v]) => v + ' ' + RESN[k]).join(', ') || 'Ücretsiz';

/* ---------- durum ---------- */
let G = null;
const isEnemy = (a, b) => a !== b && G.team[a] !== G.team[b];
const ally = o => G.team[o] === G.team[0];
const DIFF = [{ name: 'Kolay', inc: .55, wave: .65, hp: .85, start: 1.4 }, { name: 'Normal', inc: 1, wave: 1, hp: 1, start: 1 }, { name: 'Zor', inc: 1.6, wave: 1.4, hp: 1.15, start: .85 }];
const PF = {};

function newGame(m) {
  MS = m.scale || 1.45;
  const W = Math.round(m.W * MS), H = Math.round(m.H * MS), n = W * H;
  G = {
    m, W, H, t: 0, nid: 0, ents: [], byId: new Map(), blds: [],
    terrain: new Uint8Array(n), res: new Uint8Array(n), amt: new Uint16Array(n),
    blkT: new Uint8Array(n), occ: new Int32Array(n), vis: new Uint8Array(n), exp: new Uint8Array(n),
    players: Array.from({ length: m.nPlayers || 2 }, (_, i) => ({ f: 0, w: 0, g: 0, pop: 0, cap: i ? 999 : 0, tech: {} })), team: m.team || [0, 1], ais: [], alerts: {}, diff: m.diff == null ? 1 : m.diff, market: { f: 100, w: 100 },
    colors: m.colors, proj: [], fx: [], navVer: 0, sel: [], groups: {}, speed: 1, paused: false,
    msgs: [], done: false, flags: {}, evDone: {}, trDone: {}, ai: null, ctick: 0, vtick: 0, otick: 0, atick: 0,
    cells: null, cw: Math.ceil(W * TILE / 64), ch: Math.ceil(H * TILE / 64), alert: null, hero: null,
    stats: { kills: 0, lost: 0 }, dirtyMini: true, capture: 0, decor: [], idleT: -99, readyT: -99, ltick: 0,
    zone: m.zone ? { x0: Math.round(m.zone.x0 * MS), y0: Math.round(m.zone.y0 * MS), x1: Math.round((m.zone.x1 + 1) * MS) - 1, y1: Math.round((m.zone.y1 + 1) * MS) - 1 } : null,
  };
  G.cells = Array.from({ length: G.cw * G.ch }, () => []);
  pfInit();
  Object.assign(G.players[0], m.start || {}); const ds = DIFF[G.diff].start; for (const k of ['f', 'w', 'g']) G.players[0][k] = Math.round(G.players[0][k] * ds);
  return G;
}
function msg(text, cls) { G.msgs.push({ text, cls: cls || '', t: 0 }); if (G.msgs.length > 6) G.msgs.shift(); if (typeof uiMsg === 'function') uiMsg(); }

/* ---------- harita ---------- */
const idx = (x, y) => y * G.W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < G.W && y < G.H;
function refreshBlk(i) { const t = G.terrain[i], r = G.res[i]; G.blkT[i] = (t === 1 || r === 1 || r === 2) ? 1 : 0; }
function setWater(x0, y0, x1, y1) { x0 = sc(x0); y0 = sc(y0); x1 = sc1(x1); y1 = sc1(y1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) { const i = idx(x, y); G.terrain[i] = 1; G.res[i] = 0; refreshBlk(i); } }
function setTerrain(x0, y0, x1, y1, t) { x0 = sc(x0); y0 = sc(y0); x1 = sc1(x1); y1 = sc1(y1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) { G.terrain[idx(x, y)] = t; refreshBlk(idx(x, y)); } }
function putRes(x, y, type, amt) { if (!inb(x, y)) return; const i = idx(x, y); if (G.terrain[i] === 1 || G.occ[i]) return; G.res[i] = type; G.amt[i] = amt; refreshBlk(i); }
function forest(cx, cy, r, dens) {
  dens = dens || .7; cx = sc(cx); cy = sc(cy); r = Math.round(r * MS);
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const d = Math.hypot(x - cx, y - cy); if (d <= r && G.rng() < dens * (1 - d / (r * 1.4))) putRes(x, y, 1, 120);
  }
}
function mine(cx, cy, n, amt) { cx = sc(cx); cy = sc(cy); n = n || 4; amt = amt || 700; const o = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1]]; for (let k = 0; k < n; k++) putRes(cx + o[k][0], cy + o[k][1], 2, amt); }
function berries(cx, cy, n) { cx = sc(cx); cy = sc(cy); n = n || 5; for (let k = 0; k < n; k++) putRes(cx + Math.round((G.rng() - .5) * 3), cy + Math.round((G.rng() - .5) * 3), 3, 150); }
function clearArea(cx, cy, r) { cx = sc(cx); cy = sc(cy); r = Math.round(r * MS); for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= r) { const i = idx(x, y); if (G.res[i] === 1) { G.res[i] = 0; refreshBlk(i); } } }
function wallLine(owner, x0, y0, x1, y1, type, label) {
  const X0 = sc(x0), Y0 = sc(y0); x1 = x1 > x0 ? sc1(x1) : sc(x1); y1 = y1 > y0 ? sc1(y1) : sc(y1); x0 = X0; y0 = Y0;
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); let x = x0, y = y0;
  for (let k = 0; k < 400; k++) { if (!G.occ[idx(x, y)]) addBuilding(type || 'sur', owner, x, y, { label }); if (x === x1 && y === y1) break; x += dx; y += dy; }
}
function makeRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function putFish(tx, ty, amt) { if (!inb(tx, ty)) return; const i = idx(tx, ty); if (G.terrain[i] !== 1 || G.res[i]) return; G.res[i] = 4; G.amt[i] = amt || 250; }
function scatterFish() {             // her su kütlesine balık sürüleri
  let n = 0; for (let i = 0; i < G.W * G.H; i++) if (G.terrain[i] === 1) n++;
  const want = Math.round(n / 140), r = G.rng;
  for (let k = 0, tries = 0; k < want && tries < want * 40; tries++) {
    const tx = (r() * G.W) | 0, ty = (r() * G.H) | 0; if (G.terrain[idx(tx, ty)] !== 1) continue;
    let land = false; for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) if (inb(x, y) && G.terrain[idx(x, y)] !== 1) land = true;
    if (!land && r() < .6) continue;   // kıyıya yakın olanlar daha olası
    for (let q = 0; q < 4; q++) putFish(tx + ((r() * 3) | 0) - 1, ty + ((r() * 3) | 0) - 1, 260); k++;
  }
}
function scatterNature() {          // görev haritasına rastgele korular ve süsler
  const W = G.W, H = G.H, r = G.rng, Z = G.zone;
  const free = (x, y, d) => {
    if (Z && x > Z.x0 - 4 && x < Z.x1 + 4 && y > Z.y0 - 4 && y < Z.y1 + 4) return false;
    for (const b of G.blds) if (x > b.tx - d && x < b.tx + b.w + d && y > b.ty - d && y < b.ty + b.h + d) return false;
    for (const u of G.ents) if (u.kind === 'u' && Math.abs(u.x / TILE - x) < d && Math.abs(u.y / TILE - y) < d) return false;
    return true;
  };
  const n = Math.round(W * H / 650);
  for (let k = 0; k < n; k++) {
    const cx = (r() * W) | 0, cy = (r() * H) | 0; if (G.terrain[idx(cx, cy)] !== 0 || !free(cx, cy, 8)) continue;
    const rad = 1.5 + r() * 2.2;
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) { if (!inb(x, y) || G.terrain[idx(x, y)] !== 0 || G.res[idx(x, y)] || G.occ[idx(x, y)]) continue; const d = Math.hypot(x - cx, y - cy); if (d <= rad && r() < .75 * (1 - d / (rad * 1.5))) { G.res[idx(x, y)] = 1; G.amt[idx(x, y)] = 120; refreshBlk(idx(x, y)); } }
  }
  const m = Math.round(W * H / 45);
  for (let k = 0; k < m; k++) { const x = (r() * W) | 0, y = (r() * H) | 0, i = idx(x, y); if (G.terrain[i] === 1 || G.terrain[i] === 4 || G.res[i] || G.occ[i]) continue; G.decor.push({ tx: x, ty: y, v: (r() * 6) | 0, ox: (r() - .5) * 18, oy: (r() - .5) * 18 }); }
}
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
  if (owner !== 0 && G.team[owner] !== G.team[0] && DIFF[G.diff].hp !== 1 && !u.d.worker) u.hpMul = DIFF[G.diff].hp;
  u.maxhp = 0; recalcUnit(u); u.hp = u.maxhp;
  if (d.hero && owner === 0 && !G.hero) G.hero = u;
  return u;
}
const u_isWorker = t => !!UNITS[t].worker;
function freeTileNear(tx, ty) {
  for (let r = 0; r <= 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = tx + dx, y = ty + dy; if (inb(x, y) && !G.blkT[idx(x, y)] && !G.occ[idx(x, y)]) return [x, y]; }
  return [tx, ty];
}
const U = (type, owner, tx, ty, o) => { const [x, y] = freeTileNear(sc(tx), sc(ty)); return addUnit(type, owner, x * TILE + TILE / 2, y * TILE + TILE / 2, o); };
function addBuilding(type, owner, tx, ty, o) {
  o = o || {}; const d = BUILDS[type];
  const b = { id: ++G.nid, kind: 'b', type, d, owner, tx, ty, w: d.w, h: d.h, x: (tx + d.w / 2) * TILE, y: (ty + d.h / 2) * TILE, r: Math.max(d.w, d.h) * TILE / 2, hp: d.hp, maxhp: d.hp, built: o.built !== false, prog: o.built === false ? 0 : 1, queue: [], cd: 1, rally: null, dead: false, name: o.label || d.name, hit: 0, bw: 0 };
  if (o.hp) { b.hp = b.maxhp = o.hp; } else if (G.players[owner] && !d.wall) { const bhp = modOf(owner, 'bhp', null); if (bhp) b.hp = b.maxhp = Math.round(d.hp * (1 + bhp)); }
  if (!b.built) b.hp = Math.max(10, d.hp * .1);
  for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) if (inb(x, y)) { G.occ[idx(x, y)] = b.id; if (G.res[idx(x, y)] === 3) { G.res[idx(x, y)] = 0; } }
  G.ents.push(b); G.byId.set(b.id, b); G.blds.push(b); G.navVer++; G.dirtyMini = true;
  return b;
}
const B = (type, owner, tx, ty, o) => {
  tx = sc(tx); ty = sc(ty); const d = BUILDS[type];
  if (o && o.ifFree) { for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) if (!inb(x, y) || G.occ[idx(x, y)] || G.blkT[idx(x, y)]) return null; }
  return addBuilding(type, owner, tx, ty, o);
};
const TP = (tx, ty) => ({ x: sc(tx) * TILE + TILE / 2, y: sc(ty) * TILE + TILE / 2 });

function kill(e, src) {
  if (e.dead) return; e.dead = true; G.byId.delete(e.id); G.dirty = true;
  if (e.kind === 'b') {
    for (let y = e.ty; y < e.ty + e.h; y++) for (let x = e.tx; x < e.tx + e.w; x++) if (inb(x, y) && G.occ[idx(x, y)] === e.id) G.occ[idx(x, y)] = 0;
    G.navVer++; G.blds = G.blds.filter(b => b !== e); G.dirtyMini = true;
    if (!e.d.landmark) G.fx.push({ k: 'rubble', x: e.x, y: e.y, t: 0, life: 40, tx: e.tx, ty: e.ty, w: e.w, h: e.h, id: e.id });
    for (let k = 0; k < 14; k++) G.fx.push({ k: 'puff', x: e.x + (Math.random() - .5) * e.w * TILE, y: e.y + (Math.random() - .5) * e.h * TILE, t: 0, life: .8 + Math.random() * .6, r: 8 + Math.random() * 14 });
  } else {
    G.fx.push({ k: 'corpse', x: e.x, y: e.y, t: 0, life: 9, look: lookOf(e), owner: e.owner, face: e.face || 0 });
    if (e.owner === 0) G.stats.lost++; else G.stats.kills++;
  }
  if (e.owner === 0 && e.kind === 'b' && e.d.drop) { /* kaynak teslim noktası kaybı */ }
}
function applyDmg(t, dmg, src) {
  if (t.dead || t.d.landmark) return;
  t.hp -= dmg; t.hit = .15;
  if (t.hp <= 0) { kill(t, src); return; }
  if (src && isEnemy(t.owner, src.owner)) G.alerts[t.owner] = { x: src.x, y: src.y, t: G.t };
  if (t.kind === 'u' && src && isEnemy(t.owner, src.owner) && src.kind === 'u' && t.d.atk && !t.d.worker && !t.hold && (t.order.t === 'idle')) { t.order = { t: 'attack', tid: src.id, auto: true }; t.rp = 0; }
  if (src && isEnemy(t.owner, src.owner) && src.kind === 'u' && !src.dead && G.t - (t.callT || -9) > 1.5) {   // yardım çağrısı: yakındaki boştaki askerler karşılık verir
    t.callT = G.t; const R = (t.d.hero ? 10 : 6) * TILE;
    unitsNear(t.x, t.y, R, a => { if (a.owner === t.owner && a !== t && a.atk && !a.d.worker && !a.d.hero && !a.hold && a.order.t === 'idle') { a.order = { t: 'attack', tid: src.id, auto: true }; a.rp = 0; } });
  }
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
let NAV = false;                   // yol bulma gemi için mi?
function tcost(i, owner, soft) {
  if (NAV) return G.terrain[i] === 1 ? 1 : -1;
  if (G.blkT[i]) return -1;
  const bid = G.occ[i]; if (!bid) return 1;
  const b = G.byId.get(bid); if (!b) return 1;
  if (b.d.gate && !isEnemy(owner, b.owner)) return 1;
  if (!isEnemy(owner, b.owner) || !soft || b.d.landmark) return -1;
  return 25;
}
const LOSO = [[0, 0], [10, 10], [-10, 10], [10, -10], [-10, -10]];
function los(x0, y0, x1, y1, owner) {   // karo koordinatları; birim genişliğinde koridor kontrolü
  const ax = x0 * TILE + 16, ay = y0 * TILE + 16, bx = x1 * TILE + 16, by = y1 * TILE + 16, n = Math.ceil(Math.hypot(bx - ax, by - ay) / 8);
  for (let k = 0; k <= n; k++) {
    const px = ax + (bx - ax) * k / n, py = ay + (by - ay) * k / n;
    for (const o of LOSO) { const tx = ((px + o[0]) / TILE) | 0, ty = ((py + o[1]) / TILE) | 0; if (!inb(tx, ty) || tcost(idx(tx, ty), owner, false) < 0) return false; }
  }
  return true;
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function findPath(sx, sy, gx, gy, owner, soft) {
  const W = G.W, H = G.H; if (sx === gx && sy === gy) return [];
  const hh = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return dx + dy - .586 * Math.min(dx, dy); };
  PF.cur++; const cur = PF.cur; PF.hi.length = 0; PF.hf.length = 0;
  const s = sy * W + sx, gi = gy * W + gx; PF.g[s] = 0; PF.mark[s] = cur; hpush(s, hh(sx, sy));
  let best = s, bestH = hh(sx, sy), it = 0;
  while (PF.hi.length && it++ < 40000) {
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
  while (i < last) { let j = i + 1; while (j < last && j - i < 20 && los(out[i][0], out[i][1], out[j + 1][0], out[j + 1][1], owner)) j++; res.push(out[j]); i = j; }
  return res;
}
function setPath(u, x, y, soft) { NAV = !!u.d.naval; const r = setPath0(u, x, y, soft); NAV = false; return r; }
function setPath0(u, x, y, soft) {
  const gx = clamp((x / TILE) | 0, 0, G.W - 1), gy = clamp((y / TILE) | 0, 0, G.H - 1);
  const p = findPath(clamp((u.x / TILE) | 0, 0, G.W - 1), clamp((u.y / TILE) | 0, 0, G.H - 1), gx, gy, u.owner, soft);
  u.soft = soft; u.goal = { x, y }; u.chk = -1; u.pi = 0; u.stuck = 0;
  if (!p.length) { u.path = null; return false; }
  u.path = p.map(t => [t[0] * TILE + TILE / 2, t[1] * TILE + TILE / 2]);
  const lt = p[p.length - 1]; if (lt[0] === gx && lt[1] === gy && (NAV ? G.terrain[idx(gx, gy)] === 1 : !G.blkT[idx(gx, gy)] && !G.occ[idx(gx, gy)])) u.path[u.path.length - 1] = [x, y];
  return true;
}
function canStand(u, x, y) { const tx = (x / TILE) | 0, ty = (y / TILE) | 0; if (!inb(tx, ty)) return false; NAV = !!u.d.naval; const r = tcost(idx(tx, ty), u.owner, false) >= 0; NAV = false; return r; }
function stepMove(u, dt) { NAV = !!u.d.naval; const r = stepMove0(u, dt); NAV = false; return r; }
function stepMove0(u, dt) {
  const p = u.path; if (!p || u.pi >= p.length) return true;
  const w = p[u.pi], last = u.pi === p.length - 1;
  if (u.chk !== u.pi) {
    u.chk = u.pi; u.bestD = 1e9; u.noProg = 0;
    const wx = (w[0] / TILE) | 0, wy = (w[1] / TILE) | 0, i = idx(wx, wy);
    const c = tcost(i, u.owner, u.soft);
    if (c < 0) { if (++u.fails > 4) { u.fails = 0; u.path = null; return true; } if (!setPath(u, u.goal.x, u.goal.y, u.soft)) return true; return false; }
    if (c > 1) { const b = G.byId.get(G.occ[i]); if (b && b.id !== u.tgt) { u.breaker = b; return false; } }
  }
  const dx = w[0] - u.x, dy = w[1] - u.y, d = Math.hypot(dx, dy), sp = u.spd * dt;
  if (d <= Math.max(sp, last ? 3 : 10)) { if (d <= sp && canStand(u, w[0], w[1])) { u.x = w[0]; u.y = w[1]; } u.pi++; return u.pi >= p.length; }
  let nx = u.x + dx / d * sp, ny = u.y + dy / d * sp;
  if (canStand(u, u.x, u.y) && !canStand(u, nx, ny)) {        // köşeye takılırsa duvar boyunca kay
    if (canStand(u, nx, u.y)) ny = u.y; else if (canStand(u, u.x, ny)) nx = u.x; else { nx = u.x; ny = u.y; }
  }
  u.x = nx; u.y = ny; u.face = Math.atan2(dy, dx);
  if (d < u.bestD - .5) { u.bestD = d; u.noProg = 0; } else u.noProg += dt;
  if (u.noProg > .6) {                                          // ilerleme yok: kalabalık veya engel
    u.noProg = 0; u.bestD = 1e9;
    if (u.goal && Math.hypot(u.goal.x - u.x, u.goal.y - u.y) < 60) { u.path = null; return true; }
    if (++u.fails > 6) { u.fails = 0; u.path = null; return true; }
    if (!setPath(u, u.goal.x, u.goal.y, u.soft)) return true;
  }
  return false;
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
  const reach = u.d.range > 0 ? rangeOf(u) : 10;
  if (t.kind === 'b') return rectDist(u.x, u.y, t) <= reach + u.r;
  return Math.hypot(t.x - u.x, t.y - u.y) <= reach + u.r + t.r;
}
function armorVs(at, t) { return at === 'm' ? t.ma : at === 'g' ? t.pa * .5 : at === 's' ? t.pa * .3 : t.pa; }
function unitDmg(dmg, d, t) { if (d.bonus && d.bonus[t.d.cls]) dmg += d.bonus[t.d.cls]; return Math.max(1, dmg - armorVs(d.at, t)); }
function doAttack(u, t) {
  const d = u.d; let dmg = u.atk * (u.aura ? 1.2 : 1);
  if (t.kind === 'u') dmg = unitDmg(dmg, d, t);
  else dmg = Math.max(1, dmg * (d.bm == null ? .3 : d.bm));
  u.atkT = u.atkD = Math.min(.5, u.rate * .55);
  if (d.proj) G.proj.push({ x: u.x, y: u.y, sx: u.x, sy: u.y, d0: Math.hypot(t.x - u.x, t.y - u.y) || 1, tid: t.id, tx: t.x, ty: t.y, dmg, owner: u.owner, kind: d.proj, sp: d.proj === 'ball' ? 380 : 520, splash: d.splash || 0, src: u.id, srcAtk: u.atk });
  else { applyDmg(t, dmg, u); }
}
function attackStep(u, t, dt, brk) {
  if (u.guard && u.home && Math.hypot(u.x - u.home.x, u.y - u.home.y) > 7 * TILE && !brk) { u.order = { t: 'move', x: u.home.x, y: u.home.y }; setPath(u, u.home.x, u.home.y, false); return; }
  if (inRange(u, t)) {
    u.face = Math.atan2(t.y - u.y, t.x - u.x); u.path = null;
    if (u.cd <= 0) { doAttack(u, t); u.cd = u.rate; }
    return;
  }
  if (u.hold && u.order.auto) { u.order = { t: 'idle' }; return; }
  u.rp -= dt; u.tgt = t.id;
  if (!u.path || u.rp <= 0) { setPath(u, t.x, t.y, true); u.rp = .6; u.tgt = t.id; }
  if (stepMove(u, dt) && !inRange(u, t)) { u.path = null; }
}
function acquire(u, radius, bld) {
  let best = null, bs = 1e9; const o = u.owner;
  const melee = !u.d.range;
  unitsNear(u.x, u.y, radius, e => { if (!isEnemy(o, e.owner)) return; if (melee && e.d.naval !== u.d.naval) return; const d = Math.hypot(e.x - u.x, e.y - u.y); const sc = d + (e.d.worker ? 60 : 0); if (sc < bs) { bs = sc; best = e; } });
  for (const b of G.blds) {
    if (!isEnemy(o, b.owner) || b.dead || b.d.landmark) continue;
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
    const rad = u.hold ? (rangeOf(u) || 10) + u.r : u.vis * TILE;
    const t = acquire(u, rad, u.owner !== 0);
    if (t) { u.order = { t: 'attack', tid: t.id, auto: true }; u.rp = 0; return; }
    if (u.guard && u.home && Math.hypot(u.x - u.home.x, u.y - u.home.y) > 40) { u.order = { t: 'move', x: u.home.x, y: u.home.y }; setPath(u, u.home.x, u.home.y, false); }
    else if (u.owner !== 0 && u.rally && !u.guard && Math.hypot(u.x - u.rally.x, u.y - u.rally.y) > 90) { u.order = { t: 'move', x: u.rally.x, y: u.rally.y }; setPath(u, u.rally.x, u.rally.y, false); }
  }
}
function updAmove(u, dt) {
  const o = u.order; u.scan -= dt;
  if (u.scan <= 0) { u.scan = .4 + Math.random() * .2; const t = acquire(u, u.vis * TILE, true); const nid = t ? t.id : 0; if (nid !== o.tid) { o.tid = nid; if (!nid) setPath(u, o.x, o.y, true); } }
  if (o.tid) { const t = G.byId.get(o.tid); if (!t || t.dead) { o.tid = 0; setPath(u, o.x, o.y, true); } else { attackStep(u, t, dt, false); return; } }
  if (stepMove(u, dt)) u.order = { t: 'idle' };
}
function findDrop(u) {
  let best = null, bd = 1e9;
  for (const b of G.blds) if (b.owner === u.owner && b.built && b.d.drop && !!b.d.dock === !!u.d.naval) { const d = rectDist(u.x, u.y, b); if (d < bd) { bd = d; best = b; } }
  return best;
}
function goDrop(u, d) { const w = u.d.naval && dockWater(d, u); if (w) setPath(u, w.x, w.y, false); else setPath(u, d.x, d.y + d.h * TILE / 2 + 6, false); }
function nearestRes(x, y, type, maxR) {
  let best = null, bd = maxR * maxR; const cx = (x / TILE) | 0, cy = (y / TILE) | 0;
  for (let ty = cy - maxR; ty <= cy + maxR; ty++) for (let tx = cx - maxR; tx <= cx + maxR; tx++) { if (!inb(tx, ty)) continue; const i = idx(tx, ty); if (G.res[i] === type && G.amt[i] > 0) { const d = (tx - cx) ** 2 + (ty - cy) ** 2; if (d < bd) { bd = d; best = [tx, ty]; } } }
  return best;
}
const RATE = { 1: 1.0, 2: .9, 3: 1.2, 4: 1.1 };
function updGather(u, dt) {
  const o = u.order, p = G.players[u.owner];
  if (o.ph === 'go') {
    let tx, ty, farm = null;
    if (o.farm) { farm = G.byId.get(o.farm); if (!farm || farm.dead || !farm.built) { u.order = { t: 'idle' }; return; } tx = farm.x; ty = farm.y; }
    else { const i = idx(o.tx, o.ty); if (G.res[i] !== o.res || G.amt[i] <= 0) { const n = nearestRes(u.x, u.y, o.res, 12) || nearestRes(u.x, u.y, o.res, 26); if (!n) { autoNext(u, null); return; } o.tx = n[0]; o.ty = n[1]; setupGatherPath(u); } tx = o.tx * TILE + TILE / 2; ty = o.ty * TILE + TILE / 2; }
    const near = farm ? rectDist(u.x, u.y, farm) <= 14 : Math.hypot(u.x - tx, u.y - ty) <= (G.res[idx(o.tx, o.ty)] === 3 ? 20 : TILE * 1.62);
    if (near) { o.ph = 'work'; u.path = null; u.face = Math.atan2(ty - u.y, tx - u.x); }
    else if (stepMove(u, dt)) { if (farm) setPath(u, farm.x, farm.y + farm.h * TILE / 2 + 8, false); else setupGatherPath(u); if (!u.path && ++o.fails > 3) u.order = { t: 'idle' }; }
  } else if (o.ph === 'work') {
    if (!u.carry || u.carry.type !== o.res) u.carry = { type: o.res, amt: 0 };
    u.workT = G.t + .3; o.acc += dt * (o.farm ? .8 : RATE[o.res] || 1) * gatherMul(u.owner, o.farm ? 3 : o.res);
    while (o.acc >= 1) {
      o.acc -= 1;
      if (!o.farm) { const i = idx(o.tx, o.ty); if (G.amt[i] <= 0) { o.ph = 'go'; break; } G.amt[i]--; if (G.amt[i] <= 0) { G.res[i] = 0; refreshBlk(i); G.dirtyMini = true; } }
      u.carry.amt++;
      if (u.carry.amt >= 10 + modOf(u.owner, 'carry', null)) { o.ph = 'ret'; const d = findDrop(u); if (!d) { u.order = { t: 'idle' }; if (u.owner === 0) msg(u.d.naval ? 'Balık teslim edilecek Tersane yok!' : 'Kaynak teslim edilecek Ambar veya Saray yok!', 'warn'); return; } o.drop = d.id; goDrop(u, d); break; }
    }
    if (o.ph === 'work' && !o.farm && G.res[idx(o.tx, o.ty)] !== o.res) o.ph = 'go';
  } else if (o.ph === 'ret') {
    const d = G.byId.get(o.drop);
    if (!d || d.dead) { const n = findDrop(u); if (!n) { u.order = { t: 'idle' }; return; } o.drop = n.id; goDrop(u, n); return; }
    if (rectDist(u.x, u.y, d) <= (u.d.naval ? 44 : 24)) {
      const key = ['', 'w', 'g', 'f', 'f'][u.carry.type]; if (key) p[key] += u.carry.amt; u.carry = { type: u.carry.type, amt: 0 };
      o.ph = 'go'; if (o.farm) { const f = G.byId.get(o.farm); if (f) setPath(u, f.x, f.y + f.h * TILE / 2 + 8, false); else u.order = { t: 'idle' }; } else setupGatherPath(u);
    } else if (stepMove(u, dt)) { goDrop(u, d); if (!u.path && ++o.fails > 3) u.order = { t: 'idle' }; }
  }
}
function updBuildOrder(u, dt) {
  const b = G.byId.get(u.order.bid);
  if (!b || b.dead || b.built) { autoNext(u, b); return; }
  if (rectDist(u.x, u.y, b) <= 26) { b.bw++; u.workT = G.t + .3; u.path = null; u.fails = 0; u.face = Math.atan2(b.y - u.y, b.x - u.x); }
  else { const done = u.path ? stepMove(u, dt) : true; if (done && !setPath(u, b.x, b.y + b.h * TILE / 2 + 8, false) && ++u.fails > 3) u.order = { t: 'idle' }; }
}
// İşi biten işçi kendine yeni iş bulur: tarla -> tarlada çalış, yakında inşaat varsa ona yardım et, yoksa en yakın kaynağı topla
function autoNext(u, b) {
  u.order = { t: 'idle' };
  if (!u.d.worker) return;
  if (b && b.built && b.d.farm && b.owner === u.owner && !b.dead) { orderFarm(u, b); return; }
  let site = null, sd = 15 * TILE;
  for (const x of G.blds) if (x.owner === u.owner && !x.built && !x.dead) { const d = rectDist(u.x, u.y, x); if (d < sd) { sd = d; site = x; } }
  if (site) { orderBuild(u, site); return; }
  const ref = b && b.d && b.d.drop ? b : u;
  let best = null, bd = 1e9;
  for (const t of (u.d.naval ? [4] : [1, 2, 3])) { const n = nearestRes(ref.x, ref.y, t, u.d.naval ? 24 : 14); if (n) { const d = Math.hypot(n[0] * TILE - ref.x, n[1] * TILE - ref.y) * (t === 1 ? 1 : 1.15); if (d < bd) { bd = d; best = n; } } }
  if (best) orderGather(u, best[0], best[1]);
}
function healStep(u, dt) {           // molla: en yaralı dosta şifa
  u.hcd = (u.hcd || 0) - dt; if (u.hcd > 0) return; u.hcd = .5;
  let best = null, bf = .999, near = null, nf = .999;
  unitsNear(u.x, u.y, 8 * TILE, e => { if (e.owner !== u.owner || e === u || e.d.cls === 'sie') return; const f = e.hp / e.maxhp, d = Math.hypot(e.x - u.x, e.y - u.y); if (f < bf && d < 4 * TILE) { bf = f; best = e; } if (f < nf) { nf = f; near = e; } });
  if (best) { const h = (u.heal || u.d.heal) * .5 * (hasTech(u.owner, 'tip') ? 2 : 1); best.hp = Math.min(best.maxhp, best.hp + h); u.atkT = u.atkD = .45; u.face = Math.atan2(best.y - u.y, best.x - u.x); G.fx.push({ k: 'heal', x: best.x, y: best.y, t: 0, life: .7 }); }
  else if (near && u.order.t === 'idle' && !u.hold) { orderMove(u, near.x - 40, near.y - 20); }
}
function updUnit(u, dt) {
  if (u.hit > 0) u.hit -= dt; u.cd -= dt; if (u.atkT > 0) u.atkT -= dt;
  if (u.d.healer) healStep(u, dt);
  if (u.breaker) { if (u.breaker.dead) { u.breaker = null; if (u.goal) setPath(u, u.goal.x, u.goal.y, u.soft); } else { u.tgt = u.breaker.id; attackStep(u, u.breaker, dt, true); return; } }
  const o = u.order;
  switch (o.t) {
    case 'idle': idleThink(u, dt); break;
    case 'move': if (stepMove(u, dt)) u.order = { t: 'idle' }; break;
    case 'attack': { const t = G.byId.get(o.tid); if (!t || t.dead || !isEnemy(u.owner, t.owner)) { u.order = { t: 'idle' }; u.path = null; u.scan = 0; break; } if (o.auto && Math.hypot(t.x - u.x, t.y - u.y) > u.vis * TILE * 2 && !(t.kind === 'b')) { u.order = { t: 'idle' }; break; } attackStep(u, t, dt, false); break; }
    case 'amove': updAmove(u, dt); break;
    case 'gather': updGather(u, dt); break;
    case 'build': updBuildOrder(u, dt); break;
  }
}

/* ---------- bina mantığı ---------- */
function popUsedOwner(o) { let n = 0; for (const e of G.ents) { if (e.dead || e.owner !== o) continue; if (e.kind === 'u') n += e.d.pop; else for (const q of e.queue) n += qPop(q); } return n; }
const afford = (p, c) => (p.f >= (c.f || 0)) && (p.w >= (c.w || 0)) && (p.g >= (c.g || 0));
const pay = (p, c, s) => { s = s || 1; p.f -= (c.f || 0) * s; p.w -= (c.w || 0) * s; p.g -= (c.g || 0) * s; };
function hasBuilt(owner, type) { return G.blds.some(b => b.owner === owner && b.type === type && b.built); }
function trade(o, res, buy) {     // 100 birim al/sat; fiyat 100 birimin altın değeri
  const p = G.players[o], M = G.market, price = Math.round(M[res]);
  if (buy) { if (p.g < price) { if (o === 0) msg('Yetersiz altın!', 'warn'); return false; } p.g -= price; p[res] += 100; M[res] = Math.min(300, M[res] + 6); }
  else { if (p[res] < 100) { if (o === 0) msg('Yetersiz ' + RESN[res].toLowerCase() + '!', 'warn'); return false; } p[res] -= 100; p.g += Math.round(price * .75); M[res] = Math.max(25, M[res] - 6); }
  return true;
}
function queueTech(b, id) {
  const p = G.players[b.owner], T = TECHS[id];
  if (hasTech(b.owner, id) || G.blds.some(x => x.owner === b.owner && x.queue.some(q => q.type === 'T:' + id))) { if (b.owner === 0) msg('Bu ilim zaten araştırılıyor.', 'warn'); return false; }
  if (!techReqOk(b.owner, id)) { if (b.owner === 0) msg('Önce ' + TECHS[T.req].name + ' gerekli.', 'warn'); return false; }
  if (b.queue.length >= 15) { msg('Sıra dolu.', 'warn'); return false; }
  if (!afford(p, T.cost)) { if (b.owner === 0) msg('Yetersiz kaynak!', 'warn'); return false; }
  pay(p, T.cost); b.queue.push({ type: 'T:' + id, t: 0 }); return true;
}
function applyTech(o, id) {
  G.players[o].tech[id] = true;
  for (const e of G.ents) if (e.kind === 'u' && e.owner === o && !e.dead) recalcUnit(e);
  const bhp = modOf(o, 'bhp', null); for (const b of G.blds) if (b.owner === o && !b.d.wall) { const mx = Math.round(b.d.hp * (1 + bhp)); if (mx !== b.maxhp) { b.hp = b.hp / b.maxhp * mx; b.maxhp = mx; } }
  if (o !== 0) return;
  msg('İlim tamamlandı: ' + TECHS[id].name + ' — ' + TECHS[id].desc, 'good');
  if (id === 'cografya') { G.exp.fill(1); G.fogDirty = true; G.dirtyMini = true; }
}
function queueTrain(b, type, silent) {
  const p = G.players[b.owner], d = UNITS[type];
  if (!b.built) return false;
  if (b.queue.length >= 15) { if (!silent) msg('Üretim sırası dolu (15).', 'warn'); return false; }
  if (!afford(p, d.cost)) { if (!silent) msg('Yetersiz kaynak!', 'warn'); return false; }
  if (popUsedOwner(b.owner) + d.pop > p.cap) { if (!silent) msg('Nüfus sınırı! Ev inşa et.', 'warn'); return false; }
  pay(p, d.cost); b.queue.push({ type, t: 0 }); return true;
}
function dockWater(b, ref) {        // tersanenin bitişiğindeki en yakın su karosu
  let best = null, bd = 1e12;
  for (let x = b.tx - 1; x <= b.tx + b.w; x++) for (let y = b.ty - 1; y <= b.ty + b.h; y++) { if (!inb(x, y) || G.terrain[idx(x, y)] !== 1) continue; const d = ref ? Math.hypot(x * TILE + 16 - ref.x, y * TILE + 16 - ref.y) : 0; if (d < bd) { bd = d; best = { x: x * TILE + 16, y: y * TILE + 16 }; } }
  return best;
}
function spawnSpot(b, naval) {
  const tx0 = b.tx - 1, ty0 = b.ty - 1, tx1 = b.tx + b.w, ty1 = b.ty + b.h; const c = [];
  for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) { if (x > tx0 && x < tx1 && y > ty0 && y < ty1) continue; if (!inb(x, y)) continue; const i = idx(x, y); if (naval ? G.terrain[i] === 1 : !G.blkT[i] && !G.occ[i]) c.push([x, y]); }
  if (!c.length) return { x: b.x, y: b.y + b.h * TILE / 2 + 20 };
  const tgt = b.rally || { x: b.x, y: b.y + 999 }; let best = c[0], bd = 1e12;
  for (const t of c) { const d = Math.hypot(t[0] * TILE + 16 - tgt.x, t[1] * TILE + 16 - tgt.y); if (d < bd) { bd = d; best = t; } }
  return { x: best[0] * TILE + 16 + (Math.random() - .5) * 8, y: best[1] * TILE + 16 + (Math.random() - .5) * 8 };
}
function updBuilding(b, dt) {
  if (b.hit > 0) b.hit -= dt;
  if (!b.built) {
    if (b.bw > 0) { const dp = dt / b.d.time * Math.pow(b.bw, .7) * (1 + modOf(b.owner, 'bspd', null)); b.prog = Math.min(1, b.prog + dp); b.hp = Math.min(b.maxhp, b.hp + b.maxhp * dp * .9); b.bw = 0; if (b.prog >= 1) { b.built = true; b.hp = Math.max(b.hp, b.maxhp * .95); if (b.owner === 0) msg(b.name + ' tamamlandı.', 'good'); G.dirtyMini = true; for (const u of G.ents) if (u.kind === 'u' && u.order.t === 'build' && u.order.bid === b.id) autoNext(u, b); } }
    return;
  }
  if (b.queue.length) {
    const q = b.queue[0]; q.t += dt;
    if (q.t >= qTime(q) && q.type.startsWith('T:')) { b.queue.shift(); applyTech(b.owner, q.type.slice(2)); }
    else if (q.t >= qTime(q)) {
      b.queue.shift(); const s = spawnSpot(b, !!UNITS[q.type].naval);
      const o = {}; if (b.owner !== 0) { o.ai = u_isWorker(q.type) ? null : 'army'; o.rally = b.rally || { x: b.x, y: b.y + b.h * TILE / 2 + 60 }; }
      const u = addUnit(q.type, b.owner, s.x, s.y, o);
      if (b.rally && b.owner === 0) { const rt = G.res[idx(clamp((b.rally.x / TILE) | 0, 0, G.W - 1), clamp((b.rally.y / TILE) | 0, 0, G.H - 1))]; if (u.d.worker && rt) orderGather(u, (b.rally.x / TILE) | 0, (b.rally.y / TILE) | 0); else orderMove(u, b.rally.x, b.rally.y); }
      if (b.owner === 0) { if (G.t - G.readyT > 2.5) { msg(u.d.name + ' hazır.', 'good'); G.readyT = G.t; } if (typeof uiBeep === 'function') uiBeep(); }
    }
  }
  if (b.d.healAura) { b.hcd = (b.hcd || 0) - dt; if (b.hcd <= 0) { b.hcd = 1; unitsNear(b.x, b.y, 6 * TILE, e => { if (e.owner === b.owner && e.hp < e.maxhp && e.d.cls !== 'sie') e.hp = Math.min(e.maxhp, e.hp + 2); }); } }
  if (b.d.atk) {
    b.cd -= dt;
    if (b.cd <= 0) {
      let best = null, bd = 1e9; unitsNear(b.x, b.y, b.d.range + modOf(b.owner, 'trng', null) + b.w * 16, e => { if (!isEnemy(b.owner, e.owner)) return; const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd) { bd = d; best = e; } });
      if (best) { G.proj.push({ x: b.x, y: b.y - 30, sx: b.x, sy: b.y, d0: bd || 1, tid: best.id, tx: best.x, ty: best.y, dmg: Math.max(1, b.d.atk + modOf(b.owner, 'tatk', null) - best.pa), owner: b.owner, kind: 'arrow', sp: 520, splash: 0, src: b.id }); b.cd = b.d.rate; } else b.cd = .3;
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
        unitsNear(p.tx, p.ty, p.splash, e => { if (isEnemy(p.owner, e.owner)) applyDmg(e, Math.max(1, p.srcAtk * .5 - e.pa * .3), src); });
        if (t && !t.dead && t.kind === 'b') applyDmg(t, p.dmg, src);
        else if (t && !t.dead && t.kind === 'u') { /* birim zaten sıçramadan etkilendi */ }
      } else if (t && !t.dead) applyDmg(t, p.dmg, src);
    } else { p.x += dx / d * s; p.y += dy / d * s; }
  }
  G.proj = G.proj.filter(p => !p.done);
}

/* ---------- görüş ---------- */
function updVis() {
  G.fogDirty = true; G.vis.fill(0); const W = G.W, H = G.H;
  if (G.m.noFog) { G.vis.fill(1); G.exp.fill(1); return; }
  for (const e of G.ents) {
    if (!ally(e.owner) || e.dead) continue; const r = e.vis || e.d.vision || 6, cx = (e.x / TILE) | 0, cy = (e.y / TILE) | 0, r2 = r * r;
    for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) { const i = y * W + x; G.vis[i] = 1; G.exp[i] = 1; }
  }
}
const visAt = (x, y) => G.vis[idx(clamp((x / TILE) | 0, 0, G.W - 1), clamp((y / TILE) | 0, 0, G.H - 1))] === 1;
const expAt = (x, y) => G.exp[idx(clamp((x / TILE) | 0, 0, G.W - 1), clamp((y / TILE) | 0, 0, G.H - 1))] === 1;

/* ---------- Yapay zekâ ---------- */
function aiTick(dt) { for (const ai of G.ais) aiPlayer(ai, dt); }
function aiPlayer(ai, dt) {
  const o = ai.owner, p = G.players[o], df = G.team[o] === G.team[0] ? DIFF[1] : DIFF[G.diff];
  if (!G.blds.some(b => b.owner === o) && !G.ents.some(u => u.owner === o && u.kind === 'u' && !u.dead)) return;
  p.f += ai.income.f * df.inc * dt; p.w += ai.income.w * df.inc * dt; p.g += ai.income.g * df.inc * dt;
  if (!ai.builder) p.cap = ai.popCap;
  if (!ai.techInit) { ai.techInit = 1; if (isEnemy(0, o) && G.diff >= 2) for (const id of ['zirh', 'kilic', 'temren']) applyTech(o, id); }
  if (ai.builder) { aiEconomy(ai, p); aiNavy(ai, p); }
  ai.techT = (ai.techT || 0) - dt;
  if (ai.builder && ai.techT <= 0) {   // ara sıra bir ilim araştır
    ai.techT = 25 / (G.team[o] === G.team[0] ? 1 : DIFF[G.diff].inc);
    const opts = []; for (const b of G.blds) if (b.owner === o && b.built && b.d.techs && !b.queue.length) for (const id of b.d.techs) if (!hasTech(o, id) && techReqOk(o, id) && id !== 'cografya') opts.push([b, id]);
    if (opts.length) { const [b, id] = opts[(G.rng() * opts.length) | 0]; const c = TECHS[id].cost; if ((p.f >= (c.f || 0) + 150) && (p.w >= (c.w || 0) + 100) && (p.g >= (c.g || 0) + 80)) queueTech(b, id); }
  }
  // üretim
  const keys = Object.keys(ai.comp);
  const mil = G.ents.filter(e => e.kind === 'u' && e.owner === o && !e.dead && !e.d.worker).length;
  for (const b of G.blds) {
    if (b.owner !== o || !b.built || !b.d.trains || b.queue.length >= 2) continue;
    if (ai.builder && mil >= (ai.maxArmy || 60)) break;
    const opts = keys.filter(k => b.d.trains.includes(k)); if (!opts.length) continue;
    let r = G.rng() * opts.reduce((a, k) => a + ai.comp[k], 0), pick = opts[0]; for (const k of opts) { r -= ai.comp[k]; if (r <= 0) { pick = k; break; } }
    queueTrain(b, pick, true);
  }
  const army = G.ents.filter(e => e.kind === 'u' && e.owner === o && !e.dead && e.ai === 'army');
  const idleArmy = army.filter(u => u.order.t === 'idle');
  const wave = ai.wave;
  if (wave && G.t >= ai.next) {
    const need = Math.max(3, Math.round((wave.size + wave.grow * ai.n) * df.wave));
    if (idleArmy.length >= need || (G.t >= ai.next + 90 && idleArmy.length >= 3)) {
      const tgt = aiTarget(null, o); if (tgt) { for (const u of idleArmy) { u.ai = 'wave'; orderAmove(u, tgt.x, tgt.y); } ai.n++; ai.next = G.t + wave.interval; if (isEnemy(0, o)) msg((ai.name ? ai.name + ' ' : 'Düşman ') + 'saldırıya geçti!', 'warn'); else msg((ai.name || 'Müttefik') + ' saldırıya geçti.', 'good'); }
    }
  }
  if (wave) for (const u of G.ents) if (u.kind === 'u' && u.owner === o && u.ai === 'wave' && u.order.t === 'idle' && !u.dead) { const t = aiTarget(u, o); if (t) orderAmove(u, t.x, t.y); }
  const al = G.alerts[o]; if (al && G.t - al.t < 6) { for (const u of idleArmy) if (Math.hypot(u.x - al.x, u.y - al.y) < 22 * TILE) orderAmove(u, al.x, al.y); }
  // müttefik: oyuncunun üssü saldırı altındaysa yardıma koş
  if (!isEnemy(0, o) && o !== 0) { const pa = G.alerts[0]; if (pa && G.t - pa.t < 6) for (const u of idleArmy) if (Math.hypot(u.x - pa.x, u.y - pa.y) < 40 * TILE) orderAmove(u, pa.x, pa.y); }
}
const AI_ORDER = ['ev', 'kisla', 'ambar', 'ev', 'tarla', 'ahir', 'ev', 'demirhane', 'kule', 'tarla', 'ocak', 'ev', 'cami', 'ev', 'dokum', 'ev', 'kisla', 'ev', 'tarla', 'kule', 'ev', 'ahir', 'ev', 'ev'];
function aiNavy(ai, p) {            // yakında su varsa tersane, balıkçı ve kadırga
  const o = ai.owner, base = G.blds.find(b => b.owner === o && b.type === 'saray');
  if (!base || !hasBuilt(o, 'kisla')) return;
  let dock = G.blds.find(b => b.owner === o && b.type === 'tersane');
  if (!dock) {
    if (ai.noWater || G.blds.some(b => b.owner === o && !b.built) || !afford(p, BUILDS.tersane.cost)) return;
    const sp = aiDockSpot(base); if (!sp) { ai.noWater = true; return; }
    pay(p, BUILDS.tersane.cost); dock = addBuilding('tersane', o, sp[0], sp[1], { built: false });
    G.ents.filter(u => u.kind === 'u' && u.owner === o && u.d.worker && !u.dead).slice(0, 3).forEach(u => orderBuild(u, dock)); return;
  }
  if (!dock.built) return;
  if (!ai.comp.kadirga) ai.comp.kadirga = 1;
  const fishers = G.ents.filter(u => u.kind === 'u' && u.owner === o && u.d.fisher && !u.dead);
  if (fishers.length < 4 && dock.queue.length < 2) queueTrain(dock, 'balikci', true);
  for (const f of fishers) if (f.order.t === 'idle') autoNext(f, dock);
}
function aiDockSpot(base) {
  for (let r = 3; r < 20; r++) for (let k = 0; k < 32; k++) {
    const a = k / 32 * Math.PI * 2, tx = Math.round(base.tx + 1 + Math.cos(a) * r - 1.5), ty = Math.round(base.ty + 1 + Math.sin(a) * r - 1.5); let ok = true, wet = 0;
    for (let y = ty; y < ty + 3 && ok; y++) for (let x = tx; x < tx + 3 && ok; x++) if (!inb(x, y) || G.blkT[idx(x, y)] || G.occ[idx(x, y)]) ok = false;
    if (!ok) continue;
    for (let x = tx - 1; x <= tx + 3; x++) for (let y = ty - 1; y <= ty + 3; y++) if (inb(x, y) && G.terrain[idx(x, y)] === 1) wet++;
    if (wet >= 3) return [tx, ty];
  }
  return null;
}
function aiEconomy(ai, p) {
  const o = ai.owner, base = G.blds.find(b => b.owner === o && b.type === 'saray' && b.built) || G.blds.find(b => b.owner === o && b.d.drop);
  let cap = 0; for (const b of G.blds) if (b.owner === o && b.built && b.d.pop) cap += b.d.pop; p.cap = Math.min(200, cap);
  const workers = G.ents.filter(u => u.kind === 'u' && u.owner === o && u.d.worker && !u.dead);
  if (base && workers.length < ai.workers && base.queue.length < 2) queueTrain(base, 'reaya', true);
  for (const u of workers) if (u.order.t === 'idle') autoNext(u, base);
  if (!base || G.t < (ai.buildT || 0)) return;
  const site = G.blds.find(b => b.owner === o && !b.built);
  if (site) { // inşaatta birkaç işçi olsun
    const on = workers.filter(u => u.order.t === 'build' && u.order.bid === site.id).length;
    if (on < 2) { const w = workers.find(u => u.order.t !== 'build'); if (w) orderBuild(w, site); }
    return;
  }
  let type = popUsedOwner(o) >= p.cap - 3 ? 'ev' : AI_ORDER[ai.bi || 0];
  if (!type) { ai.bi = 0; type = 'ev'; }
  const d = BUILDS[type]; if (!afford(p, d.cost)) return;
  const spot = aiSpot(base, d); if (!spot) { ai.bi = (ai.bi || 0) + 1; return; }
  pay(p, d.cost); const b = addBuilding(type, o, spot[0], spot[1], { built: false });
  if (type === AI_ORDER[ai.bi || 0]) ai.bi = (ai.bi || 0) + 1;
  workers.slice(0, 3).forEach(u => orderBuild(u, b)); ai.buildT = G.t + 3;
}
function aiSpot(base, d) {
  for (let r = 4; r < 18; r++) for (let k = 0; k < 24; k++) {
    const a = G.rng() * Math.PI * 2, tx = Math.round(base.tx + base.w / 2 + Math.cos(a) * r - d.w / 2), ty = Math.round(base.ty + base.h / 2 + Math.sin(a) * r - d.h / 2);
    let ok = true;
    for (let y = ty - 1; y <= ty + d.h && ok; y++) for (let x = tx - 1; x <= tx + d.w && ok; x++) if (!inb(x, y) || G.blkT[idx(x, y)] || G.occ[idx(x, y)] || G.terrain[idx(x, y)] === 1) ok = false;
    if (ok) return [tx, ty];
  }
  return null;
}
function aiTarget(from, o) {
  o = o == null ? 1 : o;
  let best = null, bd = 1e12; const ref = from || (G.blds.find(b => b.owner === o && b.d.trains) || { x: G.W * TILE / 2, y: G.H * TILE / 2 });
  for (const b of G.blds) if (isEnemy(o, b.owner) && !b.d.wall && !b.d.landmark) { const sc = Math.hypot(b.x - ref.x, b.y - ref.y) - (b.d.drop ? 200 : 0); if (sc < bd) { bd = sc; best = b; } }
  if (!best) for (const e of G.ents) if (e.kind === 'u' && !e.dead && isEnemy(o, e.owner)) { const d = Math.hypot(e.x - ref.x, e.y - ref.y); if (d < bd) { bd = d; best = e; } }
  return best;
}

/* ---------- ana adım ---------- */
function popAndCap() {
  const p0 = G.players[0]; p0.pop = popUsedOwner(0); let cap = 0;
  for (const b of G.blds) if (b.owner === 0 && b.built && b.d.pop) cap += b.d.pop; p0.cap = Math.min(200, cap + (G.m.popBonus || 0));
  for (let o = 1; o < G.players.length; o++) G.players[o].pop = popUsedOwner(o);
}
function step(dt) {
  if (G.done) return;
  G.t += dt;
  rebuildHash();
  // aura
  G.otick -= dt;
  if (G.otick <= 0) { G.otick = .5; const heroes = G.ents.filter(e => e.kind === 'u' && e.d.hero && !e.dead); for (const u of G.ents) if (u.kind === 'u') { u.aura = false; if (!u.d.hero) for (const h of heroes) if (h.owner === u.owner && Math.hypot(h.x - u.x, h.y - u.y) < 170) { u.aura = true; break; } } }
  for (const e of G.ents) { if (e.dead || e.kind !== 'u') continue; const lx = e.x, ly = e.y; updUnit(e, dt); const mv = Math.hypot(e.x - lx, e.y - ly); e.moving = mv > .15 && mv < 12; e.ph = (e.ph || 0) + mv / 3.4; }
  for (const b of G.blds) if (!b.dead) updBuilding(b, dt);
  // ayrışma
  for (const u of G.ents) {
    if (u.kind !== 'u' || u.dead) continue;
    unitsNear(u.x, u.y, u.r * 2, e => {
      if (e === u || e.id < u.id) return; const dx = e.x - u.x, dy = e.y - u.y, d = Math.hypot(dx, dy) || .01, ov = u.r + e.r - d; if (ov <= 0) return;
      const mu = !!(u.path && u.pi < u.path.length), me = !!(e.path && e.pi < e.path.length);
      const ku = mu && !me ? .08 : !mu && me ? .42 : .25, ke = .5 - ku;
      pushUnit(u, -dx / d * ov * ku, -dy / d * ov * ku); pushUnit(e, dx / d * ov * ke, dy / d * ov * ke);
    });
  }
  updProj(dt);
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.life);
  if (G.dirty) { G.ents = G.ents.filter(e => !e.dead); G.dirty = false; G.sel = G.sel.filter(e => !e.dead); }
  popAndCap();
  G.vtick -= dt; if (G.vtick <= 0) { G.vtick = .3; updVis(); G.dirtyMini = true; }
  G.atick -= dt; if (G.atick <= 0) { G.atick = 1; aiTick(1); }
  G.ctick -= dt; if (G.ctick <= 0) { G.ctick = .5; checkMission(.5); }
  G.ltick -= dt; if (G.ltick <= 0) { G.ltick = 1; lifeTick(); for (const k of ['f', 'w']) G.market[k] += (100 - G.market[k]) * .01; }
  for (const m of G.msgs) m.t += dt; G.msgs = G.msgs.filter(m => m.t < 9);
}
function lifeTick() {
  for (const o of [0, 1]) if (hasTech(o, 'tip')) for (const u of G.ents) if (u.kind === 'u' && u.owner === o && !u.dead && u.hp < u.maxhp && u.d.cls !== 'sie') u.hp = Math.min(u.maxhp, u.hp + .6);
  let idleW = 0, idleM = 0, newly = 0;
  for (const u of G.ents) {
    if (u.kind !== 'u' || u.owner !== 0 || u.dead) continue;
    const idle = u.order.t === 'idle';
    if (u.d.worker) { if (idle) { idleW++; if (u.wasBusy) newly++; } u.wasBusy = !idle; }
    else if (!u.d.hero && u.d.atk && idle && !u.hold) idleM++;
  }
  G.idleW = idleW; G.idleM = idleM;
  if (newly && G.t - G.idleT > 6) { G.idleT = G.t; msg(newly > 1 ? newly + ' reaya boşta kaldı! (B tuşu ile bul)' : 'Bir reaya işini bitirdi ve boşta bekliyor. (B tuşu ile bul)', 'warn'); }
}
function pushUnit(u, dx, dy) {
  if (u.order.t === 'gather' && u.order.ph === 'work') return;
  const nx = u.x + dx, ny = u.y + dy, i = idx(clamp((nx / TILE) | 0, 0, G.W - 1), clamp((ny / TILE) | 0, 0, G.H - 1));
  if (u.d.naval ? G.terrain[i] === 1 : !G.blkT[i] && !G.occ[i]) { u.x = nx; u.y = ny; }
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
