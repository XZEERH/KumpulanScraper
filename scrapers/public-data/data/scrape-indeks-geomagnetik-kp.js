#!/usr/bin/env node
'use strict';

/**
 * Name : Indeks Geomagnetik Kp
 * Creator : lmavour
 * Source : https://www.spaceweather.gov/products/planetary-k-index
 * Base Web : https://services.swpc.noaa.gov
 * Type : Scraper
 * Description : Baca deret observasi indeks geomagnetik Kp tiga jam dari NOAA SWPC.
 * Note : node scrapers/public-data/data/scrape-indeks-geomagnetik-kp.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
const { scrape: indeksGeomagnetikKp, cli } = jsonEndpoint(ENDPOINT, {
  source: 'noaa-swpc', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { indeksGeomagnetikKp };
if (require.main === module) cli();
