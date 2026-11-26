#!/usr/bin/env node
'use strict';

/**
 * Name : Berita CNBC Indonesia
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil judul, tautan sumber, dan thumbnail berita CNBC Indonesia.
 * Note : node scrapers/siputzx/berita/scrape-siputzx-berita-cnbcindonesia.js
 */

const { jsonEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/berita/cnbcindonesia';
const { scrape: beritaCnbcIndonesia, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  validateData: (data) => Array.isArray(data) && data.some((item) =>
    hasText(item?.title) && httpsUrl(item.link, ['www.cnbcindonesia.com', 'cnbcindonesia.com']))
});

module.exports = { beritaCnbcIndonesia };
if (require.main === module) cli();
