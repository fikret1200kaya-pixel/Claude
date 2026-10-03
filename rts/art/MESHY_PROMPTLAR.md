# Meshy için tüm metinler — Fatih oyunu

Her satır için iki adım:

1. Metni **ChatGPT**'ye ver ve resmi üret.
2. O resmi **Meshy → Görüntü → 3D**'ye yükle.

Meshy'den **GLB** indir ve şu klasöre yükle (dosya adları önemli değil, ben tanırım):
https://github.com/fikret1200kaya-pixel/Claude/upload/claude/dreamy-wright-9koks7/rts/assets/models

## Meshy ayarları

| Ayar | Askerler | Atlılar / toplar / gemiler | Binalar |
|---|---|---|---|
| Model | Meshy 7.1 – Yüksek Detay | aynı | aynı |
| Çözünürlük | Standart | Standart | Standart |
| Poz | **A-Poz** | Hiçbiri | Hiçbiri |
| Görüntü iyileştirme | Açık | Açık | Açık |
| Canlandırmak | **Evet**: bekleme, yürüme, saldırı, ölüm | Hayır (hareketi ben eklerim) | Hayır |

- Askerleri ve binaları **ayrı partilerde** üret, çünkü poz ayarı bütün partiye uygulanıyor.
- **Takım rengi:** bayrak, kuşak, sancak, yelken ve tente gibi takım rengi olacak yerler resimlerde **kırmızı** kalsın. Ben kırmızı alanları oyunda takım rengine çeviririm.
- **Önce deneme:** 1 numara (Yeniçeri) ile 22 numarayı (Ev) yap. Beğenirsen devam ederiz.

---

## A) Askerler — ortak kalıp

Her metnin sonuna şunu ekle:

> …, standing in a relaxed A-pose, front view, entire body from head to feet visible, plain white background, even soft lighting, no shadows, realistic proportions, detailed costume and textures, 3D game asset reference. No text.

| # | Birim | ChatGPT metni (kalıbın başı) |
|---|---|---|
| 1 | **Yeniçeri** | Full body character reference of a 15th-century Ottoman janissary, tall white börk felt hat with a golden front band, long blue robe, red sash, red leather boots, thick moustache, holding a matchlock musket |
| 2 | Azap | Full body character reference of an Ottoman azap infantryman, white turban with a red cap, red padded tunic, white trousers, round wooden shield with an iron boss on the left arm, long spear |
| 3 | Okçu | Full body character reference of an Ottoman archer, red cloth cap wrapped with a cream turban, green kaftan, brown leather belts, composite recurve bow in hand, quiver of arrows on the back |
| 4 | Reaya | Full body character reference of an Ottoman peasant worker, wide straw hat, cream linen shirt, brown wool vest, red sash, simple leather shoes, holding a wooden-handled axe |
| 5 | Molla | Full body character reference of an elderly Ottoman mullah scholar, large white kavuk turban with a green band, long white robe with a green vest, white beard, holding a red book and a wooden staff |
| 6 | Topçu (top mürettebatı) | Full body character reference of an Ottoman cannoneer, red turban, red and white work clothes, soot-stained face, holding a long cannon ramrod |
| 7 | Fatih (yaya, portre için) | Full body character reference of Sultan Mehmed II at 21, slim, short dark beard, large white turban with a red top and a golden aigrette with a ruby, crimson kaftan with gold embroidery, ermine-lined cape, jeweled belt and curved sword |
| 8 | Avrupalı piyade (düşman) | Full body character reference of a 15th-century European infantryman, steel kettle helmet, red and white quilted gambeson, long pike |
| 9 | Avrupalı okçu (düşman) | Full body character reference of a 15th-century European crossbowman, steel sallet helmet, red tabard over mail, crossbow |

## B) Atlılar — ortak kalıp (Poz: Hiçbiri)

Her metnin sonuna şunu ekle:

> …, riding a horse, the horse standing still, three-quarter side view, entire horse and rider visible, plain white background, even soft lighting, no shadows, realistic proportions, 3D game asset reference. No text.

| # | Birim | ChatGPT metni |
|---|---|---|
| 10 | **Fatih (atlı)** | Sultan Mehmed II in a crimson gold-embroidered kaftan and large white turban with a golden aigrette, on a white Arabian horse with a red and gold caparison and gold tassels |
| 11 | Sipahi | An Ottoman sipahi cavalryman with a pointed steel helmet with mail aventail, mail shirt, red kaftan, round shield, long lance with a red pennant, on a brown horse with a red patterned saddle cloth |
| 12 | Akıncı | An Ottoman akıncı light raider with a fur kalpak hat, fur-trimmed red coat, curved sword and quiver, on a dark brown steppe horse with a red saddle cloth |
| 13 | Şövalye (düşman) | A 15th-century European knight in full plate armor with a red plume, red heraldic surcoat, lance with a red pennant, on a grey horse with full mail barding and a red cloth caparison |
| 14 | Komutan (düşman) | A 15th-century European commander in steel plate armor and red cloak, short beard, longsword, on a black horse with red barding |

## C) Toplar ve gemiler (Poz: Hiçbiri)

Her metnin sonuna şunu ekle:

> …, three-quarter view from slightly above, entire object visible, plain white background, even soft lighting, no shadows, realistic detail, 3D game asset reference. No text.

| # | Birim | ChatGPT metni |
|---|---|---|
| 15 | Balyemez topu | A 15th-century Ottoman bronze siege cannon on a heavy wooden carriage with two large spoked wheels |
| 16 | Şahi topu | Orban's giant 15th-century Ottoman bronze bombard on a massive low wooden sled |
| 17 | Kadırga | A 15th-century Ottoman war galley with rows of oars on both sides, a red lateen sail, a bronze bow cannon, a small stern cabin with a red canopy and a red flag |
| 18 | Baştarda | A large 15th-century Ottoman flagship galley with a gilded stern castle, three bronze bow cannons, a big red lateen sail, many oars and red flags |
| 19 | Balıkçı kayığı | A small wooden Ottoman fishing rowboat with a short mast, fishing nets and a basket of fish |

## D) Binalar — ortak kalıp (Poz: Hiçbiri)

Her metnin sonuna şunu ekle:

> …, isometric three-quarter view from above, single standalone building on a small square stone or earth base, entire building visible, plain white background, even soft lighting, no ground shadow, realistic 15th-century detail, warm colors, 3D game asset reference. No text.

| # | Bina | ChatGPT metni |
|---|---|---|
| 20 | Saray | A 15th-century Ottoman palace complex: white stone main hall with a large lead dome, two slender minaret-like towers, arcaded portico, red flags |
| 21 | Ambar | A 15th-century Ottoman stone granary and storehouse with a wooden loft, red tile roof, sacks and barrels at the door |
| 22 | **Ev** | A 15th-century Ottoman house with a stone ground floor, an overhanging half-timbered upper floor (cumba) with shuttered windows, red clay tile hip roof and a chimney |
| 23 | Tarla | A small square farm field with rows of golden wheat, a wooden fence and a scarecrow |
| 24 | Kışla | A 15th-century Ottoman military barracks of stone with a timber upper floor, dormer windows, red tile roof, spear racks and red banners |
| 25 | Ahır | A 15th-century Ottoman wooden stable with a thatched roof, open stalls with horses, hay bales and a fence |
| 26 | Demirhane | A 15th-century Ottoman blacksmith workshop of stone and timber with a big brick chimney, glowing forge, anvil, weapon racks and armor stand |
| 27 | Yeniçeri Ocağı | A 15th-century Ottoman janissary barracks: white plastered stone building with arched windows, red pyramid roof, a large copper cauldron at the door, red flags |
| 28 | Dökümhane | A 15th-century Ottoman cannon foundry with a tall stone furnace chimney, glowing furnace door, a bronze cannon barrel lying outside |
| 29 | Tersane | A 15th-century Ottoman shipyard on a wooden quay: a galley hull under construction on a slipway with scaffolding, a stone storehouse and a red flag |
| 30 | Gözcü kulesi | A 15th-century Ottoman stone watchtower with a wooden fighting platform and a conical red tile roof, red flag |
| 31 | Cami | A 15th-century Ottoman mosque with a central lead dome, small corner domes, one slender minaret and an arcaded courtyard |
| 32 | Medrese | A 15th-century Ottoman madrasa: arcaded courtyard surrounded by domed student cells, a larger classroom dome |
| 33 | Pazar | A 15th-century Ottoman covered bazaar (bedesten) with small domes, and open market stalls with red and white striped awnings |
| 34 | Ordugâh / otağ | A large 15th-century Ottoman imperial campaign tent (otağ), red and gold embroidered, with smaller tents around it |
| 35 | Rumeli Hisarı | The Rumeli Fortress (1452): three massive round stone towers connected by crenellated walls on a slope, red flags |
| 36 | Avrupa kalesi (düşman) | A 15th-century European stone castle keep with round corner towers, conical slate roofs, crenellations and red banners |
| 37 | Burç (düşman) | A single 15th-century round stone defensive tower with crenellations and a red banner |
| 38 | Sur parçası | A single straight section of a thick medieval stone city wall with crenellations, short and square |
| 39 | Kapı | A medieval stone city gate with a heavy wooden door between two short towers |
| 40 | Ayasofya | The Hagia Sophia in 1453 as a Byzantine church: huge central dome with buttresses and half domes, no minarets |
