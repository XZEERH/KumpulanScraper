# KumpulanScraperv2

Kumpulan **249 skrip Node.js terdokumentasi** untuk mencari data publik, membaca katalog, mengambil metadata dan tautan media, serta membuat gambar. Modul baru bisa dijalankan lewat CLI atau diimpor sebagai fungsi CommonJS.

Modul Siputzx, FreeAPI.pro, Kangwifi, dan ApiKu memakai endpoint publik tanpa API key atau cookie. Alternatif untuk fitur yang sama, seperti cuaca, tersedia di folder penyedia masing-masing.

## Struktur Folder

| Folder | Skrip | Isi |
| --- | ---: | --- |
| [`scrapers/siputzx/`](scrapers/siputzx/) | 114 | Canvas, kuis, AI, pencarian, berita, dan media |
| [`scrapers/apiku/`](scrapers/apiku/) | 41 | Hadits, Al-Qur'an, jadwal salat, aksara Jawa, BMKG, dan jadwal TV |
| [`scrapers/kangwifi/`](scrapers/kangwifi/) | 24 | API sumber publik dari katalog Kangwifi, seperti Wikipedia, arXiv, dan App Store |
| [`scrapers/integrations/`](scrapers/integrations/) | 18 | Integrasi lain, seperti EQuran, Frankfurter, dan AniList |
| [`scrapers/freeapi/`](scrapers/freeapi/) | 6 | Text-to-speech, tulisan tangan, Wikipedia ke PDF, dan gambar AI |
| [`scrapers/legacy/`](scrapers/legacy/) | 46 | Koleksi lama dengan dependensi dan format keluaran masing-masing |

Helper bersama ada di [`scrapers/lib/`](scrapers/lib/), sedangkan uji offline dan live ada di [`tests/`](tests/). Nama file memakai `scrape-<fitur>.js`; penyedia dan kategori dibedakan lewat jalur folder.

## Instalasi

Gunakan Node.js **20.18.1 atau lebih baru** dan npm. Clone repositori ini atau unduh ZIP lewat menu **Code** di GitHub, lalu jalankan dari folder proyek:

```sh
npm ci
```

Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd ci` dan `npm.cmd test`. `npm ci` memasang dependensi yang tercatat untuk modul dan pengujian baru; beberapa scraper lama membutuhkan paket tambahan. Periksa header, `require`, atau `import` di file lama sebelum menjalankannya.

## Cara Pakai

Jalankan contoh berikut dari root repo. Gunakan `--help` untuk melihat argumen modul. Contoh di bawah berjalan langsung di Node.js tanpa Brave.

```sh
node scrapers/siputzx/ai/scrape-glm47flash.js --help
node scrapers/siputzx/ai/scrape-glm47flash.js --prompt "Jelaskan apa itu RSS."
node scrapers/siputzx/info/scrape-cuaca.js --q "pasiran jaya"
node scrapers/siputzx/sticker/scrape-combot-search.js --q cat --page 1
node scrapers/siputzx/downloader/scrape-github.js --url "https://github.com/sindresorhus/is-png"
node scrapers/siputzx/canvas/scrape-blur.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
```

Contoh integrasi di luar Siputzx:

```sh
node scrapers/integrations/scrape-equran.js surat 112
node scrapers/integrations/scrape-frankfurter.js USD IDR 100
node scrapers/integrations/scrape-anilist.js "One Piece" --type manga --limit 3
```

Untuk scraper lama, tambahkan awalan `scrapers/legacy/` ke nama file saat menjalankannya dari root.

### Impor CommonJS

Contoh dari file JavaScript di root proyek:

```js
const { quranSurat } = require('./scrapers/apiku/quran/scrape-surat');

async function main() {
  const hasil = await quranSurat({ nomor: 112, timeout: 10000 });
  if (!hasil.status) {
    console.error(hasil.message);
    process.exitCode = 1;
    return;
  }

  console.log(hasil.data.namaLatin, hasil.data.ayat.length);
}

main();
```

Modul baru tidak otomatis mengirim permintaan saat diimpor. Untuk pemanggilan di atas, `status: true` menandakan hasil tersedia di `data`; jika gagal, baca `message`. CLI menampilkan hasil dalam JSON dan memakai kode keluar `1` saat gagal. Gunakan `--timeout <ms>` untuk membatasi waktu tunggu atau `--no-cache` untuk menonaktifkan penggunaan cache lokal.

## Cakupan Siputzx

Setiap file `scrapers/siputzx/<kategori>/scrape-*.js` menangani satu endpoint. URL, parameter, dan contoh penggunaan ada di file masing-masing. [`scraper-utils.js`](scrapers/lib/scraper-utils.js) menangani permintaan HTTP, validasi, dan CLI, tanpa menyimpan daftar endpoint.

Downloader mengembalikan metadata dan tautan, bukan menyimpan file otomatis. Hasil Canvas berisi `data.mimeType` dan `data.base64`; input gambar harus berasal dari host publik yang didukung.

| Kategori | Modul | Kategori | Modul |
| --- | ---: | --- | ---: |
| Canvas | 29 | AI | 8 |
| Games | 24 | Berita | 5 |
| Search | 13 | Stalker (profil publik) | 4 |
| Downloader | 10 | Tools | 4 |
| Primbon | 8 | Info | 3 |
| Anime (metadata) | 2 | Maker | 1 |
| Random | 2 | Sticker | 1 |

## FreeAPI.pro

[`scrapers/freeapi/`](scrapers/freeapi/) memuat modul untuk enam endpoint dari [dokumentasi FreeAPI.pro](https://freeapi.pro/docs): `voices` (katalog suara), `tts` (MP3), `hand` (tulisan tangan PNG), `wikipdf` (Wikipedia bahasa Inggris ke PDF), `tti` (tautan gambar AI), dan `search` (katalog MedSter, bukan saran medis).

```sh
node scrapers/freeapi/scrape-voices.js --language id-ID --limit 5
node scrapers/freeapi/scrape-tts.js --text "Hello, world!" --voiceIndex 1
node scrapers/freeapi/scrape-hand.js --text "Hello world" --paper ruled
node scrapers/freeapi/scrape-wikipdf.js --query "Example.com"
```

MP3, PNG, dan PDF dikembalikan sebagai `data.base64` beserta `data.mimeType`, tanpa menyimpan file otomatis. Respons biner dibatasi 2 MiB. SpeechSter ditujukan untuk penggunaan nonkomersial; hormati [ketentuan penyedia](https://freeapi.pro/terms) dan lisensi konten Wikipedia.

## Katalog Kangwifi

[`scrapers/kangwifi/`](scrapers/kangwifi/) berisi modul yang ditulis untuk API sumber publik yang tercantum di atau dirujuk dari [katalog `Yz776/apis`](https://github.com/Yz776/apis). Modul tidak menjalankan server Bun dari repo tersebut. Alternatif dapat hidup berdampingan dengan scraper yang sudah ada, misalnya prakiraan BMKG langsung berdasarkan kode `adm4` dan pencarian cuaca Siputzx berdasarkan nama wilayah.

```sh
node scrapers/kangwifi/search/scrape-wikipedia.js --q Indonesia --lang id --limit 3
node scrapers/kangwifi/search/scrape-appstore.js --query Keynote --country ID
node scrapers/kangwifi/tools/scrape-bmkg-cuaca.js --adm4 31.71.03.1001
node scrapers/kangwifi/info/scrape-crossref.js --q "machine learning" --limit 3
```

Modul lain mencakup jurnal arXiv, kamus Inggris, kalender libur, kurs harian, QR PNG, data ISS, serta katalog Pokemon dan seri TV. Ikuti batas akses dan atribusi penyedia; untuk ExchangeRate-API, gunakan hasil untuk konversi, bukan mendistribusikan ulang kurs.

## IrengCloud ApiKu

Satu file di [`scrapers/apiku/`](scrapers/apiku/) menangani satu rute dari [Swagger ApiKu](https://apiku.irengcloud.com/docs/).

| Folder | Modul | Fitur |
| --- | ---: | --- |
| [`hadits/`](scrapers/apiku/hadits/) | 4 | Daftar kitab, hadits per imam, detail, dan pencarian |
| [`quran/`](scrapers/apiku/quran/) | 4 | Daftar surah, ayat dan audio, tafsir, dan pencarian terjemahan |
| [`sholat/`](scrapers/apiku/sholat/) | 2 | Daftar kota dan jadwal salat bulanan |
| [`islami/`](scrapers/apiku/islami/) | 6 | Naskah khutbah MUI, katalog kitab maulid, bacaan tahlil, dan arsip NU |
| [`aksara/`](scrapers/apiku/aksara/) | 2 | Transliterasi Latin ke aksara Jawa dan sebaliknya |
| [`lirik/`](scrapers/apiku/lirik/) | 2 | Pencarian lagu dan lirik biasa atau sinkron (LRC) jika tersedia |
| [`bmkg/`](scrapers/apiku/bmkg/) | 3 | Gempa terbaru, gempa dirasakan, dan cuaca per desa atau kelurahan |
| [`tv/`](scrapers/apiku/tv/) | 4 | Daftar channel, jadwal, acara sedang tayang, dan siaran sepak bola |
| [`anime/`](scrapers/apiku/anime/) | 7 | Metadata katalog Animasu dan Otakudesu, tanpa pemutar |
| [`manga/`](scrapers/apiku/manga/) | 2 | Metadata Komiku, tanpa tautan halaman baca |
| [`downloader/`](scrapers/apiku/downloader/) | 3 | Tautan media dari unggahan publik TikTok dan X/Twitter, tanpa menyimpan file |
| [`info/`](scrapers/apiku/info/) | 2 | Ringkasan profil publik Enka dan uptime ApiKu |

```sh
node scrapers/apiku/hadits/scrape-search.js --q sabar --limit 3
node scrapers/apiku/quran/scrape-surat.js --nomor 112
node scrapers/apiku/aksara/scrape-latin-to-jawa.js --text "Sugeng enjing"
node scrapers/apiku/bmkg/scrape-cuaca.js --adm4 31.71.03.1001
node scrapers/apiku/tv/scrape-schedule.js --channel sctv
```

## Pengujian

```sh
npm test
```

Uji offline memakai respons tiruan dan tidak membutuhkan akses internet setelah dependensi terpasang. Uji live bersifat opsional: jalankan semuanya atau pilih penyedia tertentu. Hasilnya bergantung pada kondisi layanan pihak ketiga.

```sh
npm run test:live
node --test --test-name-pattern="^Siputzx " tests/scrapers.live.test.js
node --test --test-name-pattern="^FreeAPI " tests/scrapers.live.test.js
node --test --test-name-pattern="^Kangwifi " tests/scrapers.live.test.js
node --test --test-name-pattern="^ApiKu " tests/scrapers.live.test.js
```

## Ketentuan Penggunaan

- Gunakan data publik dan unduh hanya konten yang kamu miliki atau berizin untuk diunduh.
- Hormati atribusi, rate limit, serta ketentuan penyedia. Tidak perlu mengakali login, CAPTCHA, atau penolakan akses.
- Jangan kirim kata sandi, cookie sesi, atau data pribadi ke endpoint pihak ketiga. Hasil Primbon hanya untuk hiburan.

## Kredit dan Lisensi

[Lisensi MIT](LICENSE) berlaku untuk kontribusi asli yang dirilis di **KumpulanScraperv2** dengan izin pemegang hak cipta. Proyek ini tidak mengklaim kepemilikan atas kode pihak ketiga, API, data, atau media yang diakses melalui scraper.

Kredit pembuat asli, termasuk **Razeerh**, tetap tercantum di header skrip masing-masing. Jika suatu skrip pihak ketiga tidak menyebutkan lisensinya, jangan mengasumsikan izin untuk mendistribusikannya ulang.
