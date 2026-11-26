#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian DuckDuckGo
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari halaman web serta mengambil judul, tautan, dan cuplikan hasil.
 * Note : node scrapers/siputzx/search/scrape-siputzx-s-duckduckgo.js --query "Node.js documentation"
 */

const { jsonEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/duckduckgo';
const { scrape: searchDuckDuckGo, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { query: { required: true }, kl: { pattern: /^[a-z]{2,3}-[a-z]{2}$/i }, df: { choices: ['d', 'w', 'm', 'y'] } },
  validateData: (data) => Array.isArray(data?.results) && data.results.some((item) => hasText(item?.title) && httpsUrl(item.url))
});

module.exports = { searchDuckDuckGo };
if (require.main === module) cli();
