#!/usr/bin/env node
'use strict';

/**
 * Name : Jumlah Observasi GBIF per Negara
 * Creator : lmavour
 * Source : https://techdocs.gbif.org/en/openapi/v1/occurrence#/Occurrence%20metrics/getOccurrenceCount
 * Base Web : https://api.gbif.org
 * Type : Scraper
 * Description : Hitung rekaman observasi manusia berkoordinat per negara. Respons hanya jumlah agregat, bukan individu atau lokasi pengamatan.
 * Note : node scrapers/public-data/tools/scrape-jumlah-observasi-gbif.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.gbif.org/v1/occurrence/count?isGeoreferenced=true&basisOfRecord=HUMAN_OBSERVATION';
const { scrape: jumlahObservasiGbif, cli } = jsonEndpoint(ENDPOINT, {
  source: 'gbif', interval: 1500,
  params: {
    country: { required: true, maxLength: 2, pattern: new RegExp('^[A-Z]{2}$') }
  },
  validateData: (data) => data != null,
  selectData: (payload) => !payload?.error && payload?.status !== false && Number.isFinite(payload) ? payload : null
});

module.exports = { jumlahObservasiGbif };
if (require.main === module) cli();
