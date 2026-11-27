#!/usr/bin/env node
'use strict';

/**
 * Name : Zona Waktu berdasarkan Koordinat
 * Creator : lmavour
 * Source : https://wheretheiss.at/w/developer
 * Base Web : https://api.wheretheiss.at
 * Type : Scraper
 * Description : Cari zona waktu IANA, offset UTC dalam jam, dan kode negara dari satu titik koordinat publik.
 * Note : node scrapers/public-data/tools/scrape-zona-koordinat-iana.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.wheretheiss.at/v1/coordinates/{latitude},{longitude}';
const { scrape: zonaKoordinatIana, cli } = jsonEndpoint(ENDPOINT, {
  source: 'where-the-iss-at', interval: 1500,
  params: {
    latitude: { required: true, type: 'number', min: -90, max: 90 },
    longitude: { required: true, type: 'number', min: -180, max: 180 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['timezone_id'] === 'string' && payload?.['timezone_id'].trim().length > 0 ? payload : null
});

module.exports = { zonaKoordinatIana };
if (require.main === module) cli();
