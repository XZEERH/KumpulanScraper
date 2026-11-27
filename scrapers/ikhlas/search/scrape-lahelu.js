#!/usr/bin/env node
'use strict';

/**
 * Name : Lahelu Meme Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Cari konten meme viral, video lucu, dan gambar hiburan komunitas nusantara di platform Lahelu.
 * Note : node scrapers/ikhlas/search/scrape-lahelu.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/lahelu';
const { scrape: ikhlasSearchLahelu, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchLahelu };
if (require.main === module) cli();
