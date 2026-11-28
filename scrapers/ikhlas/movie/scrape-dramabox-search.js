#!/usr/bin/env node
'use strict';

/**
 * Name : DramaBox Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mencari koleksi drama pendek di DramaBox berdasarkan kata kunci judul dengan dukungan filter bahasa.
 * Note : node scrapers/ikhlas/movie/scrape-dramabox-search.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/movie/dramabox/search';
const { scrape: ikhlasMovieDramaboxSearch, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  params: {
    query: { required: true },
    locale: { choices: ['in', 'en', 'zhHans', 'ko', 'zh', 'es', 'ja', 'fr', 'th', 'vi'] },
    page: {}
  }
});

module.exports = { ikhlasMovieDramaboxSearch };
if (require.main === module) cli();
