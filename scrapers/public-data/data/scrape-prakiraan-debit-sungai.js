#!/usr/bin/env node
'use strict';

/**
 * Name : Prakiraan Debit Sungai
 * Creator : lmavour
 * Source : https://open-meteo.com/en/docs/flood-api
 * Base Web : https://flood-api.open-meteo.com
 * Type : Scraper
 * Description : Prakiraan model GloFAS untuk debit sungai terdekat selama tujuh hari. Open-Meteo nonkomersial dengan atribusi; bukan peringatan banjir resmi.
 * Note : node scrapers/public-data/data/scrape-prakiraan-debit-sungai.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://flood-api.open-meteo.com/v1/flood?daily=river_discharge&forecast_days=7&timezone=GMT';
const { scrape: prakiraanDebitSungai, cli } = jsonEndpoint(ENDPOINT, {
  source: 'open-meteo', interval: 1500,
  params: {
    latitude: { required: true, type: 'number', min: -90, max: 90 },
    longitude: { required: true, type: 'number', min: -180, max: 180 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['daily']?.['river_discharge']) ? payload : null
});

module.exports = { prakiraanDebitSungai };
if (require.main === module) cli();
