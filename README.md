# Kumpulan Scraper v2

Koleksi skrip Node.js untuk mencari data publik, membaca katalog, mengambil metadata dan tautan media, serta membuat gambar. Semua file `scrape-*.js` ada di [`scrapers/`](scrapers/). Modul baru dapat dipanggil lewat CLI atau diimpor sebagai fungsi CommonJS.

Per 26 November 2026, koleksi berisi **178 skrip**: 114 modul Siputzx, 18 integrasi lain, dan 46 skrip lama. Modul Siputzx menggunakan endpoint publik yang lolos pengujian tanpa API key atau cookie. Skrip lama memiliki dependensi, format keluaran, dan syarat akses masing-masing.

## Struktur Folder

```text
scrapers/
  siputzx/        # Satu file per endpoint, dipisah menurut kategori
  integrations/   # Integrasi lain, seperti EQuran, Frankfurter, dan AniList
  legacy/         # Koleksi scraper lama
  lib/            # Helper HTTP, validasi, dan CLI
tests/            # Uji offline dan live
```

## Instalasi

Gunakan Node.js **20.18.1 atau lebih baru** dan npm.

```sh
git clone https://github.com/Lmavour/KumpulanScraperv2.git
cd KumpulanScraperv2
npm ci
```

Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd ci` dan `npm.cmd test`. `npm ci` memasang dependensi yang tercatat untuk modul dan pengujian baru; beberapa scraper lama membutuhkan paket tambahan. Periksa header, `require`, atau `import` di file lama sebelum menjalankannya.

## Cara Pakai

Jalankan contoh berikut dari root repo. Modul baru menyediakan `--help` untuk melihat argumen yang didukung. Brave tidak diperlukan untuk menjalankan modul Siputzx.

```sh
node scrapers/siputzx/ai/scrape-siputzx-ai-glm47flash.js --help
node scrapers/siputzx/ai/scrape-siputzx-ai-glm47flash.js --prompt "Jelaskan apa itu RSS."
node scrapers/siputzx/info/scrape-siputzx-info-cuaca.js --q "pasiran jaya"
node scrapers/siputzx/sticker/scrape-siputzx-sticker-combot-search.js --q cat --page 1
node scrapers/siputzx/downloader/scrape-siputzx-d-github.js --url "https://github.com/sindresorhus/is-png"
node scrapers/siputzx/canvas/scrape-siputzx-canvas-blur.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
```

Contoh integrasi di luar Siputzx:

```sh
node scrapers/integrations/scrape-equran.js surat 112
node scrapers/integrations/scrape-frankfurter.js USD IDR 100
node scrapers/integrations/scrape-anilist.js "One Piece" --type manga --limit 3
```

Untuk scraper lama, tambahkan awalan `scrapers/legacy/` ke nama file saat menjalankannya dari root.

Contoh pemakaian sebagai modul dari file JavaScript di root:

```js
const { infoCuaca } = require('./scrapers/siputzx/info/scrape-siputzx-info-cuaca');

async function main() {
  const hasil = await infoCuaca({ q: 'pasiran jaya' });
  if (!hasil.status) {
    console.error(hasil.message);
    process.exitCode = 1;
    return;
  }

  console.log(hasil.data.wilayah);
}

main();
```

Modul Siputzx tidak otomatis mengirim permintaan saat diimpor. CLI mengeluarkan JSON, dan keluar dengan kode `1` jika permintaan gagal. Downloader mengembalikan metadata dan tautan, bukan menyimpan file otomatis. Hasil Canvas berisi `data.mimeType` dan `data.base64`; input gambar harus berasal dari host publik yang didukung.

## Cakupan Siputzx

Setiap file `scrape-siputzx-*.js` menangani satu endpoint. URL, parameter, dan contoh penggunaan ada di file masing-masing. [`scraper-utils.js`](scrapers/lib/scraper-utils.js) menangani permintaan HTTP, validasi, dan CLI, tanpa menyimpan daftar endpoint.

| Kategori | Modul | Kategori | Modul |
| --- | ---: | --- | ---: |
| Canvas | 29 | AI | 8 |
| Games | 24 | Berita | 5 |
| Search | 13 | Stalker (profil publik) | 4 |
| Downloader | 10 | Tools | 4 |
| Primbon | 8 | Info | 3 |
| Anime (metadata) | 2 | Maker | 1 |
| Random | 2 | Sticker | 1 |

## Pengujian

```sh
npm test
```

Uji offline memakai respons tiruan dan tidak membutuhkan akses internet. Uji live di bawah ini sengaja dijalankan terpisah karena menghubungi layanan publik dan bisa gagal akibat perubahan layanan atau gangguan jaringan.

```sh
npm run test:live
node --test --test-name-pattern="^Siputzx Tambahan " tests/scrapers.live.test.js
```

## Ketentuan Penggunaan

- Gunakan data publik dan unduh hanya konten yang kamu miliki atau berizin untuk diunduh.
- Hormati atribusi, rate limit, serta ketentuan penyedia. Tidak perlu mengakali login, CAPTCHA, atau penolakan akses.
- Jangan kirim kata sandi, cookie sesi, atau data pribadi ke endpoint pihak ketiga. Hasil Primbon hanya untuk hiburan.

## Kredit dan Lisensi

Kontribusi asli yang hak ciptanya dimiliki **lmavour** dilisensikan di bawah [MIT](LICENSE). Lisensi tersebut tidak mencakup kode pihak ketiga, API, data, atau media yang diambil melalui scraper. Kredit pembuat skrip lama, termasuk **Razeerh**, tetap ada di header masing-masing. Jika suatu skrip pihak ketiga tidak menyebutkan lisensinya, jangan mengasumsikan izin untuk mendistribusikan ulang skrip tersebut.
