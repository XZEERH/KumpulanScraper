#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal Siaran Sepak Bola
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan waktu, pertandingan, dan kompetisi tanpa membuka siaran.
 * Note : node scrapers/apiku/tv/scrape-football.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tv/football';
const { scrape: tvFootball, cli } = apikuEndpoint(ENDPOINT, {
  validateData: (data) => Array.isArray(data) && data.every((item) => hasText(item?.match) && hasText(item.time))
});

module.exports = { tvFootball };
if (require.main === module) cli();
