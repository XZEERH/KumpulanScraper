#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Ayat Al-Qur'an
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mencari kata dalam terjemahan Indonesia dan menampilkan teks Arab serta nomor ayat.
 * Note : node scrapers/apiku/quran/scrape-search.js --q sabar --size 2
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/quran/search';
const { scrape: quranSearch, cli } = apikuEndpoint(ENDPOINT, {
  params: { q: { required: true, maxLength: 120 }, page: { min: 1, max: 1000 }, size: { min: 1, max: 50, default: 10 } },
  mapData: ({ data, total, page, total_pages }, { q, size }) => Array.isArray(data)
    ? { query: q, total, page, totalPages: total_pages, results: data.slice(0, size) } : null,
  validateData: ({ results }) => results.every((ayat) => /^\d{1,3}:\d{1,3}$/.test(ayat?.ayat_key) && hasText(ayat.arab) && hasText(ayat.terjemahan))
});

module.exports = { quranSearch };
if (require.main === module) cli();
