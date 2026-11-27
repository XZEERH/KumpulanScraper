#!/usr/bin/env node
'use strict';

/**
 * Name : Kota Jadwal Salat
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mencari nama dan ID kota yang tercakup dalam jadwal salat ApiKu.
 * Note : node scrapers/apiku/sholat/scrape-kota.js --q Bogor
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/sholat/kota';
const { scrape: kotaSholat, cli } = apikuEndpoint(ENDPOINT, {
  params: { q: { maxLength: 100 } },
  validateData: (data) => Array.isArray(data) && data.every((row) => hasText(row?.id) && hasText(row.kota))
});

module.exports = { kotaSholat };
if (require.main === module) cli();
