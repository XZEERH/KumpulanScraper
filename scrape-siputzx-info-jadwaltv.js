#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal TV
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil jam tayang dan nama acara TV Indonesia.
 * Note : node scrape-siputzx-info-jadwaltv.js --channel sctv
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/info/jadwaltv';
const { scrape: infoJadwalTV, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { channel: {} }
});

module.exports = { infoJadwalTV };
if (require.main === module) cli();
