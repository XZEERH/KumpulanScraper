#!/usr/bin/env node
'use strict';

/**
 * Name : Gitagram Chord Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Dapatkan lembar kunci gitar (chord) beserta lirik lagu Indonesia dan mancanegara secara lengkap dari situs Gitagram.
 * Note : node scrapers/ikhlas/search/scrape-gitagram.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/gitagram';
const { scrape: ikhlasSearchGitagram, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    search: { required: true }
  }
});

module.exports = { ikhlasSearchGitagram };
if (require.main === module) cli();
