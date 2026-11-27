#!/usr/bin/env node
'use strict';

/**
 * Name : MyInstants Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Cari ribuan klip suara pendek, meme sound, dan efek audio instan dari MyInstants untuk keperluan tombol suara dan hiburan.
 * Note : node scrapers/ikhlas/search/scrape-myinstants.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/myinstants';
const { scrape: ikhlasSearchMyinstants, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchMyinstants };
if (require.main === module) cli();
