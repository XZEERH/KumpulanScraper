#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Kitab Hadits
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan daftar imam perawi dan jumlah hadits dalam katalog ApiKu.
 * Note : node scrapers/apiku/hadits/scrape-books.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/hadits/books';
const { scrape: haditsBooks, cli } = apikuEndpoint(ENDPOINT, {
  validateData: (data) => Array.isArray(data) && data.length > 0 &&
    data.every((row) => hasText(row?.imam) && Number.isSafeInteger(row.total_hadits) && row.total_hadits > 0)
});

module.exports = { haditsBooks };
if (require.main === module) cli();
