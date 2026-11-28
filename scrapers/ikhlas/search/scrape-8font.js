#!/usr/bin/env node
'use strict';

/**
 * Name : 8font Font Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Cari font tipografi, jenis typeface (serif, sans, display, handwriting), lisensi, dan file unduh font di direktori 8font.
 * Note : node scrapers/ikhlas/search/scrape-8font.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/8font';
const { scrape: ikhlasSearch8font, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearch8font };
if (require.main === module) cli();
