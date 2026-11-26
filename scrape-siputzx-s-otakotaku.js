#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Otakotaku
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari metadata anime, karakter, dan artikel di Otakotaku.
 * Note : node scrape-siputzx-s-otakotaku.js --query mahiru
 */

const { jsonEndpoint, hasText, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/otakotaku';
const { scrape: searchOtakotaku, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { query: { required: true } },
  validateData: (data) => ['anime', 'karakter', 'artikel'].some((key) =>
    Array.isArray(data?.[key]) && data[key].some((item) => hasText(item?.title) && httpsUrl(item.url)))
});

module.exports = { searchOtakotaku };
if (require.main === module) cli();
