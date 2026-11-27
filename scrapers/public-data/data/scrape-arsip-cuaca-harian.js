#!/usr/bin/env node
'use strict';

/**
 * Name : Arsip Cuaca Harian
 * Creator : lmavour
 * Source : https://open-meteo.com/en/docs/historical-weather-api
 * Base Web : https://archive-api.open-meteo.com
 * Type : Scraper
 * Description : Reanalisis suhu dan presipitasi harian untuk satu lokasi dan rentang pendek. Open-Meteo nonkomersial dengan atribusi.
 * Note : node scrapers/public-data/data/scrape-arsip-cuaca-harian.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive?daily=temperature_2m_mean,precipitation_sum&models=era5&timezone=UTC';
const { scrape: arsipCuacaHarian, cli } = jsonEndpoint(ENDPOINT, {
  source: 'open-meteo', interval: 1500,
  params: {
    latitude: { required: true, type: 'number', min: -90, max: 90 },
    longitude: { required: true, type: 'number', min: -180, max: 180 },
    start_date: { required: true, maxLength: 10, pattern: new RegExp('^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$') },
    end_date: { required: true, maxLength: 10, pattern: new RegExp('^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['daily']?.['temperature_2m_mean']) ? payload : null
});

module.exports = { arsipCuacaHarian };
if (require.main === module) cli();
