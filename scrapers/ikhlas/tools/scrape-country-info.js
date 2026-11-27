#!/usr/bin/env node
'use strict';

/**
 * Name : Info Negara
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mendapatkan data rinci suatu negara mencakup nama resmi, ibu kota, benua, mata uang, kode telepon, bendera, bahasa resmi, serta jumlah populasi.
 * Note : node scrapers/ikhlas/tools/scrape-country-info.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/tools/countryInfo';
const { scrape: ikhlasToolsCountryInfo, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    name: { required: true }
  }
});

module.exports = { ikhlasToolsCountryInfo };
if (require.main === module) cli();
