#!/usr/bin/env node
'use strict';

/**
 * Name : Kecepatan Angin Matahari
 * Creator : lmavour
 * Source : https://www.weather.gov/media/notification/pdf_2026/scn26-21_Data_Format_Changes_Impacting_SWPC_Products.pdf
 * Base Web : https://services.swpc.noaa.gov
 * Type : Scraper
 * Description : Baca ringkasan pengukuran kecepatan angin Matahari terbaru dari NOAA SWPC.
 * Note : node scrapers/public-data/data/scrape-kecepatan-angin-matahari.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json';
const { scrape: kecepatanAnginMatahari, cli } = jsonEndpoint(ENDPOINT, {
  source: 'noaa-swpc', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { kecepatanAnginMatahari };
if (require.main === module) cli();
