#!/usr/bin/env node
'use strict';

/**
 * Name : Bacaan Tahlil
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil satu halaman bacaan tahlil dalam teks Arab, latin, dan terjemahan.
 * Note : node scrapers/apiku/islami/scrape-tahlil.js --page 1 --limit 2
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tahlil';
const { scrape: tahlil, cli } = apikuEndpoint(ENDPOINT, {
  params: { page: { min: 1, max: 56 }, limit: { min: 1, max: 56, default: 10 } },
  validateData: (data) => Number.isSafeInteger(data?.total_verses) && Array.isArray(data.data) &&
    data.data.every((row) => Number.isSafeInteger(row?.number) && hasText(row.arabic))
});

module.exports = { tahlil };
if (require.main === module) cli();
