# KumpulanScraper

Kumpulan **949 skrip Node.js** untuk mencari data publik, menjelajahi katalog, mengambil tautan media, dan membuat konten. Lihat daftar file di [`scrapers/`](scrapers/).

## Kategori

Jumlah berikut menggabungkan semua penyedia. Setiap file `scrape-*.js` dihitung sekali; [helper](scrapers/lib/) tidak termasuk.

| Kategori | Skrip | Contoh fitur |
| --- | ---: | --- |
| AI & suara | 146 | Chat AI, transkripsi, text-to-speech |
| Hiburan & gim | 141 | Anime, manga, kuis, lirik, jadwal TV |
| Pencarian & katalog | 123 | Artikel, buku, aplikasi, profil publik |
| Gambar & desain | 122 | Canvas, stiker, poster, ilustrasi |
| Berita & data publik | 108 | Berita, cuaca, gempa, kurs, wilayah Indonesia |
| Utilitas | 107 | Konversi format, QR, PDF, arsip web |
| Media & unduhan | 103 | Metadata dan tautan audio, video, atau file |
| Islami & budaya | 52 | Al-Qur'an, hadis, jadwal salat, aksara Jawa |
| [Skrip lama](scrapers/legacy/) | 47 | Beragam fitur; sebagian perlu dependensi tambahan |
| **Total** | **949** | |

## Cara Pakai

Gunakan **Node.js 20.18.1 atau lebih baru**. Dari root proyek, pasang dependensi dan gunakan `--help` untuk melihat argumen skrip:

```sh
npm ci
node scrapers/wilayah/scrape-kecamatan.js --help
node scrapers/wilayah/scrape-kecamatan.js --kode 31.71
node scrapers/nexray/search/scrape-wikipedia.js --q Indonesia
node scrapers/ikhlas/info/scrape-bmkg.js
```

Modul yang mendukung CommonJS juga bisa diimpor dari file JavaScript di root proyek:

```js
const { daftarKecamatan } = require('./scrapers/wilayah/scrape-kecamatan');

daftarKecamatan({ kode: '31.71' }).then(console.log);
```

Semua skrip Kyio memakai satu `KYIO_API_KEY`. Atur di environment, atau isi di `.env` lokal sesuai [`.env.example`](.env.example) dan muat dengan `--env-file`:

```sh
node --env-file=.env scrapers/kyio/search/scrape-wikipedia.js --q Indonesia
```

## Pengujian

`npm test` menjalankan uji offline dengan respons tiruan. `npm run test:live` bersifat opsional dan menghubungi layanan pihak ketiga.

## Penggunaan & Lisensi

Gunakan data publik dan unduh hanya konten yang diizinkan. Hormati batas akses dan ketentuan penyedia.
Jangan menjual ulang akses Ikhlas API tanpa izin tertulis, sesuai [ketentuan penyedia](https://ikhlasapi.web.id/terms-of-service).

[Lisensi MIT](LICENSE) berlaku untuk kontribusi asli proyek. Kode dan konten pihak ketiga mengikuti lisensinya masing-masing; kredit pembuat, termasuk **Razeerh**, tercantum di header skrip.
