#!/usr/bin/env node
'use strict';

/**
 * Name : Fluks Radio Matahari F10.7
 * Creator : lmavour
 * Source : https://www.weather.gov/media/notification/pdf_2026/scn26-21_Data_Format_Changes_Impacting_SWPC_Products.pdf
 * Base Web : https://services.swpc.noaa.gov
 * Type : Scraper
 * Description : Baca observasi fluks radio Matahari pada panjang gelombang 10,7 cm selama 30 hari dari NOAA SWPC.
 * Note : node scrapers/public-data/data/scrape-fluks-radio-matahari.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://services.swpc.noaa.gov/products/10cm-flux-30-day.json';
const { scrape: fluksRadioMatahari, cli } = jsonEndpoint(ENDPOINT, {
  source: 'noaa-swpc', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { fluksRadioMatahari };
if (require.main === module) cli();
