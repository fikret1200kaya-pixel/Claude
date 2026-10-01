# FATİH — Bir Sultanın Hikâyesi

Tarayıcıda çalışan, Age of Empires tarzı gerçek zamanlı strateji oyunu.
Fatih Sultan Mehmed'in tahta çıkışından (1451) vefatına (1481) uzanan 6 görevlik kampanya.

## Çalıştırma
`rts/index.html` dosyasını tarayıcıda açın (kurulum yok). Alternatif: `cd rts && python3 -m http.server`.

## Görevler
1. Tahta Çıkış (Edirne, 1451) — ekonomi + Karaman isyanı
2. Boğazkesen (1452) — Rumeli Hisarı'nı inşa et
3. İstanbul'un Fethi (1453) — surları top ile yık, Ayasofya'yı ele geçir
4. Belgrad Kuşatması (1456) — Hunyadi gelmeden kaleyi düşür
5. Otlukbeli (1473) — Uzun Hasan'ın Akkoyunlu ordusu
6. Otranto (1480) — İtalya'ya çıkarma; ardından epilog: Hünkârçayırı, 1481

## Kontroller
- Sol tık / kutu çizme: seç · Çift tık: ekrandaki aynı türleri seç
- Sağ tık: hareket, saldırı, kaynak toplama, bina yapımına yardım (binada: toplanma noktası)
- V: saldırarak ilerle · S: dur · G: mevzi · H: Sultan'a git · Boşluk: seçime git
- Ctrl+1..9: grup ata, 1..9: grubu seç · Ok tuşları / ekran kenarı: kaydır · Tekerlek: yakınlaş
- P / Esc: duraklat · `.` `,`: oyun hızı

## Oynanış notları
- Okçu ve piyade surlara neredeyse hasar vermez; surları **toplar** (Dökümhane) yıkar.
- Sultan'ın yakınındaki askerler +%20 saldırı gücü kazanır. Sultan ölürse görev kaybedilir.
- Azap atlılara, sipahi okçulara karşı güçlüdür.

## Test/Geliştirme
URL parametreleri: `?m=3` (görevi doğrudan başlat), `&nofog` (sis yok), `&cheat` (bol kaynak).

Dosyalar: `engine.js` (simülasyon, yol bulma, YZ), `gfx.js` (izometrik grafik: prosedürel 3B birim/bina sprite'ları, arazi), `ui.js` (çizim, girdi, HUD), `missions.js` (görev verileri), `main.js` (menü akışı).

## Grafik
Tüm görseller kodla üretilir (harici resim dosyası yok): 2:1 izometrik görünüm, 8 yönlü ve yürüme/saldırı animasyonlu birimler, gölgelendirilmiş binalar (kubbe, minare, sur, burç, çadır), yumuşak sahilli su, savaş sisi, ateş, duman ve patlama efektleri.
