#!/usr/bin/env node
'use strict';

/**
 * Name : Terbit dan Terbenam Matahari
 * Creator : lmavour
 * Source : https://sunrise-sunset.org/api
 * Base Web : https://api.sunrise-sunset.org
 * Type : Scraper
 * Description : Hitung waktu terbit, terbenam, dan senja setempat pada satu tanggal. Cantumkan tautan sunrise-sunset.org saat menampilkan data.
 * Note : node scrapers/public-data/tools/scrape-terbit-terbenam-matahari.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.sunrise-sunset.org/v2?time_format=iso8601';
const { scrape: terbitTerbenamMatahari, cli } = jsonEndpoint(ENDPOINT, {
  source: 'sunrise-sunset', interval: 1500,
  params: {
    lat: { required: true, type: 'number', min: -90, max: 90 },
    lng: { required: true, type: 'number', min: -180, max: 180 },
    date: { maxLength: 10, pattern: new RegExp('^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['sunrise'] === 'string' && payload?.['sunrise'].trim().length > 0 ? payload : null
});

module.exports = { terbitTerbenamMatahari };
if (require.main === module) cli();
