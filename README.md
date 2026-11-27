# KumpulanScraper

Kumpulan **673 skrip Node.js** untuk mencari data publik, menjelajahi katalog, mengambil tautan media, dan membuat konten. Lihat daftar file di [`scrapers/`](scrapers/).

## Kategori

Jumlah berikut menggabungkan semua penyedia. Setiap file `scrape-*.js` dihitung sekali; [helper](scrapers/lib/) tidak termasuk.

| Kategori | Skrip | Contoh fitur |
| --- | ---: | --- |
| AI & suara | 115 | Chat AI, transkripsi, text-to-speech |
| Hiburan & gim | 93 | Anime, manga, kuis, lirik, jadwal TV |
| Utilitas | 92 | Konversi format, QR, PDF, arsip web |
| Pencarian & katalog | 83 | Artikel, buku, aplikasi, profil publik |
| Berita & data publik | 81 | Berita, cuaca, gempa, kurs, wilayah Indonesia |
| Media & unduhan | 75 | Metadata dan tautan audio, video, atau file |
| Gambar & desain | 52 | Canvas, stiker, poster, ilustrasi |
| Islami & budaya | 35 | Al-Qur'an, hadis, jadwal salat, aksara Jawa |
| [Skrip lama](scrapers/legacy/) | 47 | Beragam fitur; sebagian perlu dependensi tambahan |
| **Total** | **673** | |

## Cara Pakai

Gunakan **Node.js 20.18.1 atau lebih baru**. Dari root proyek, pasang dependensi dan gunakan `--help` untuk melihat argumen skrip:

```sh
npm ci
node scrapers/wilayah/scrape-kecamatan.js --help
node scrapers/wilayah/scrape-kecamatan.js --kode 31.71
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

[Lisensi MIT](LICENSE) berlaku untuk kontribusi asli proyek. Kode dan konten pihak ketiga mengikuti lisensinya masing-masing; kredit pembuat, termasuk **Razeerh**, tercantum di header skrip.
