#!/usr/bin/env node
'use strict';

/**
 * Name : BMKG Gempa Terkini
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan informasi gempa bumi terkini, gempa berkekuatan di atas M 5.0, serta gempa dirasakan di seluruh wilayah Indonesia langsung dari sensor seismik BMKG (Badan Meteorologi, Klimatologi, dan Geofisika), lengkap dengan titik koordinat episentrum, kedalaman, magnitudo, dan potensi tsunami.
 * Note : node scrapers/ikhlas/info/scrape-bmkg.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/info/bmkg';
const { scrape: ikhlasInfoBmkg, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasInfoBmkg };
if (require.main === module) cli();
