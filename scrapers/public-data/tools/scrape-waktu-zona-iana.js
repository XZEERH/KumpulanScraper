#!/usr/bin/env node
'use strict';

/**
 * Name : Waktu Kini Zona IANA
 * Creator : lmavour
 * Source : https://timeapi.io/swagger/v1/swagger.json
 * Base Web : https://timeapi.io
 * Type : Scraper
 * Description : Baca waktu lokal kini untuk nama zona waktu IANA, misalnya Asia/Jakarta.
 * Note : node scrapers/public-data/tools/scrape-waktu-zona-iana.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://timeapi.io/api/v1/time/current/zone';
const { scrape: waktuZonaIana, cli } = jsonEndpoint(ENDPOINT, {
  source: 'timeapi', interval: 1500,
  params: {
    timezone: { required: true, maxLength: 64, pattern: new RegExp('^[A-Za-z][A-Za-z_+-]*(?:/[A-Za-z0-9_+-]+){0,2}$') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['date_time'] === 'string' && payload?.['date_time'].trim().length > 0 ? payload : null
});

module.exports = { waktuZonaIana };
if (require.main === module) cli();
