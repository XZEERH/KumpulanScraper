#!/usr/bin/env node
'use strict';

/**
 * Name : Info Zodiak
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil informasi detail elemen, angka keberuntungan, pasangan ideal, dan ramalan horoskop bulanan berdasarkan nama zodiak.
 * Note : node scrapers/ikhlas/primbon/scrape-zodiak.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/zodiak';
const { scrape: ikhlasPrimbonZodiak, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    zodiak: { required: true, choices: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces'] }
  }
});

module.exports = { ikhlasPrimbonZodiak };
if (require.main === module) cli();
