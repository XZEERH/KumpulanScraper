#!/usr/bin/env node
'use strict';

/**
 * Name : Prakiraan Gelombang Laut
 * Creator : lmavour
 * Source : https://open-meteo.com/en/docs/marine-weather-api
 * Base Web : https://marine-api.open-meteo.com
 * Type : Scraper
 * Description : Prakiraan tinggi dan periode gelombang per jam selama dua hari. Open-Meteo nonkomersial dengan atribusi; bukan untuk navigasi.
 * Note : node scrapers/public-data/data/scrape-prakiraan-gelombang.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://marine-api.open-meteo.com/v1/marine?hourly=wave_height,wave_period&forecast_days=2';
const { scrape: prakiraanGelombang, cli } = jsonEndpoint(ENDPOINT, {
  source: 'open-meteo', interval: 1500,
  params: {
    latitude: { required: true, type: 'number', min: -90, max: 90 },
    longitude: { required: true, type: 'number', min: -180, max: 180 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['hourly']?.['wave_height']) ? payload : null
});

module.exports = { prakiraanGelombang };
if (require.main === module) cli();
