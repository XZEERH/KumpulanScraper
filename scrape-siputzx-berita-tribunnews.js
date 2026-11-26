#!/usr/bin/env node
'use strict';

/**
 * Name : Berita Tribunnews
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil daftar berita, waktu, kanal, dan tautan dari Tribunnews.
 * Note : node scrape-siputzx-berita-tribunnews.js
 */

const { jsonEndpoint, hasText, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/berita/tribunnews';
const { scrape: beritaTribunnews, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  validateData: (data) => Array.isArray(data) && data.some((item) => hasText(item?.title) && httpsUrl(item.link))
});

module.exports = { beritaTribunnews };
if (require.main === module) cli();
