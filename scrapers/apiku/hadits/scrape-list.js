#!/usr/bin/env node
'use strict';

/**
 * Name : Hadits Per Imam
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan satu halaman daftar hadits dari imam yang dipilih.
 * Note : node scrapers/apiku/hadits/scrape-list.js --imam bukhari --page 1 --limit 2
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/hadits/{imam}';
const { scrape: haditsList, cli } = apikuEndpoint(ENDPOINT, {
  params: {
    imam: { required: true, choices: ['bukhari', 'muslim', 'tirmidzi', 'abudaud', 'nasai', 'ibnumajah', 'ahmad', 'malik', 'darimi'] },
    page: { min: 1, max: 1000 }, limit: { min: 1, max: 50, default: 10 }
  },
  mapData: ({ data, pagination }, { limit }) => Array.isArray(data) ? { pagination, results: data.slice(0, limit) } : null,
  validateData: ({ results }, { imam }) => results.every((row) => row?.imam === imam && Number.isSafeInteger(row.number) && hasText(row.terjemahan))
});

module.exports = { haditsList };
if (require.main === module) cli();
