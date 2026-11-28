#!/usr/bin/env node
'use strict';

/**
 * Name : Prediksi Pasang Surut NOAA
 * Creator : lmavour
 * Source : https://api.tidesandcurrents.noaa.gov/api/prod/
 * Base Web : https://api.tidesandcurrents.noaa.gov
 * Type : Scraper
 * Description : Lihat waktu UTC dan tinggi pasang atau surut selama 24 jam dari stasiun prediksi NOAA. Tinggi dalam meter terhadap MLLW.
 * Note : node scrapers/public-data/data/scrape-prediksi-pasang-surut.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MLLW&units=metric&time_zone=gmt&interval=hilo&range=24&format=json&application=KumpulanScraperv2';
const { scrape: prediksiPasangSurut, cli } = jsonEndpoint(ENDPOINT, {
  source: 'noaa-coops', interval: 1500,
  params: {
    station: { required: true, maxLength: 10, pattern: new RegExp('^[A-Za-z0-9]{4,10}$') },
    begin_date: { required: true, maxLength: 8, pattern: new RegExp('^\\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])$') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['predictions']) ? payload : null
});

module.exports = { prediksiPasangSurut };
if (require.main === module) cli();
