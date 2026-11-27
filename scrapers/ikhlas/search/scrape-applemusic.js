#!/usr/bin/env node
'use strict';

/**
 * Name : Apple Music Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Cari koleksi lagu, album, dan artis resmi di katalog Apple Music dengan dukungan filter wilayah negara (country code).
 * Note : node scrapers/ikhlas/search/scrape-applemusic.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/applemusic';
const { scrape: ikhlasSearchApplemusic, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true },
    region: {}
  }
});

module.exports = { ikhlasSearchApplemusic };
if (require.main === module) cli();
