#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Surah Al-Qur'an
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil nomor, nama, dan jumlah ayat 114 surah lewat ApiKu.
 * Note : node scrapers/apiku/quran/scrape-surat-list.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/quran/surat';
const { scrape: quranSuratList, cli } = apikuEndpoint(ENDPOINT, {
  validateData: (data) => Array.isArray(data) && data.length === 114 &&
    data.every((surat) => Number.isSafeInteger(surat?.nomor) && hasText(surat.namaLatin) && Number.isSafeInteger(surat.jumlahAyat))
});

module.exports = { quranSuratList };
if (require.main === module) cli();
