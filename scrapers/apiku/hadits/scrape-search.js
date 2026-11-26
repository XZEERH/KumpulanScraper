#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Hadits
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mencari kata dalam terjemahan hadits dan menampilkan hasil per halaman.
 * Note : node scrapers/apiku/hadits/scrape-search.js --q sabar --limit 2
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/hadits/search';
const { scrape: haditsSearch, cli } = apikuEndpoint(ENDPOINT, {
  params: { q: { required: true, maxLength: 120 }, page: { min: 1, max: 1000 }, limit: { min: 1, max: 50, default: 10 } },
  mapData: ({ data, pagination, query }, { limit }) => Array.isArray(data) ? { query, pagination, results: data.slice(0, limit) } : null,
  validateData: ({ results }) => results.every((row) => hasText(row?.imam) && Number.isSafeInteger(row.number) && hasText(row.terjemahan))
});

module.exports = { haditsSearch };
if (require.main === module) cli();
