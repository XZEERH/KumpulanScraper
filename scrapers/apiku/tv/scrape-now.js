#!/usr/bin/env node
'use strict';

/**
 * Name : Acara TV Sedang Tayang
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil daftar acara yang sedang tayang pada stasiun TV nasional.
 * Note : node scrapers/apiku/tv/scrape-now.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tv/now';
const { scrape: tvNow, cli } = apikuEndpoint(ENDPOINT, {
  cache: false,
  validateData: (data) => Array.isArray(data) && data.every((item) => hasText(item?.channel) && hasText(item.event) && hasText(item.time))
});

module.exports = { tvNow };
if (require.main === module) cli();
