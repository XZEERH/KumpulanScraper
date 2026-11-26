#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Stiker Combot
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari paket stiker Telegram yang terindeks di Combot; tidak mengunduh stiker otomatis.
 * Note : node scrape-siputzx-sticker-combot-search.js --q cat --page 1
 */

const { jsonEndpoint, hasText, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/sticker/combot-search';
const { scrape: searchCombotSticker, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { q: { required: true }, page: { min: 1, max: 100 } },
  validateData: (data) => Array.isArray(data?.results) && data.results.some((pack) =>
    hasText(pack?.title) && Array.isArray(pack.sticker_urls) && pack.sticker_urls.some((url) => httpsUrl(url, ['cdn.combot.online'])))
});

module.exports = { searchCombotSticker };
if (require.main === module) cli();
