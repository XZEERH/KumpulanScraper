#!/usr/bin/env node
'use strict';

/**
 * Name : DuckDuckGo Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Pencarian web instan, komprehensif, dan menjaga privasi pengguna melalui jaringan mesin pencari DuckDuckGo.
 * Note : node scrapers/ikhlas/search/scrape-duckduckgo.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/duckduckgo';
const { scrape: ikhlasSearchDuckduckgo, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchDuckduckgo };
if (require.main === module) cli();
