#!/usr/bin/env node
'use strict';

/**
 * Name : Elevasi Medan
 * Creator : lmavour
 * Source : https://open-meteo.com/en/docs/elevation-api
 * Base Web : https://api.open-meteo.com
 * Type : Scraper
 * Description : Cari elevasi permukaan dalam meter dari Copernicus DEM. Layanan publik Open-Meteo untuk penggunaan nonkomersial dengan atribusi.
 * Note : node scrapers/public-data/data/scrape-elevasi-medan.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.open-meteo.com/v1/elevation';
const { scrape: elevasiMedan, cli } = jsonEndpoint(ENDPOINT, {
  source: 'open-meteo', interval: 1500,
  params: {
    latitude: { required: true, type: 'number', min: -90, max: 90 },
    longitude: { required: true, type: 'number', min: -180, max: 180 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['elevation']) ? payload : null
});

module.exports = { elevasiMedan };
if (require.main === module) cli();
