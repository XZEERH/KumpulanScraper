#!/usr/bin/env node
'use strict';

/**
 * Name : Detail Surah Al-Qur'an
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil ayat, terjemahan, dan tautan audio untuk satu surah.
 * Note : node scrapers/apiku/quran/scrape-surat.js --nomor 112
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/quran/surat/{nomor}';
const { scrape: quranSurat, cli } = apikuEndpoint(ENDPOINT, {
  params: { nomor: { required: true, min: 1, max: 114 } },
  validateData: (data, { nomor }) => data?.nomor === nomor && hasText(data.namaLatin) && Array.isArray(data.ayat) &&
    data.ayat.length > 0 && data.ayat.every((ayat) => Number.isSafeInteger(ayat?.nomorAyat) && hasText(ayat.teksArab) && hasText(ayat.teksIndonesia))
});

module.exports = { quranSurat };
if (require.main === module) cli();
