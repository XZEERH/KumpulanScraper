#!/usr/bin/env node
'use strict';

/**
 * Name : Tafsir Surah
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil teks tafsir per ayat berdasarkan nomor surah.
 * Note : node scrapers/apiku/quran/scrape-tafsir.js --nomor 112
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/quran/tafsir/{nomor}';
const { scrape: quranTafsir, cli } = apikuEndpoint(ENDPOINT, {
  params: { nomor: { required: true, min: 1, max: 114 } },
  validateData: (data, { nomor }) => data?.nomor === nomor && Array.isArray(data.tafsir) &&
    data.tafsir.length > 0 && data.tafsir.every((ayat) => Number.isSafeInteger(ayat?.ayat) && hasText(ayat.teks))
});

module.exports = { quranTafsir };
if (require.main === module) cli();
