#!/usr/bin/env node
'use strict';

/**
 * Name : Cleveland Art Open Access Search
 * Creator : lmavour
 * Source : https://openaccess-api.clevelandart.org/
 * Base Web : https://openaccess-api.clevelandart.org
 * Type : Scraper
 * Description : Search the Cleveland Museum of Art collection for CC0 artworks and catalog metadata.
 * Note : node scrapers/public-data/culture/scrape-cleveland-art-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://openaccess-api.clevelandart.org/api/artworks/?cc0=1&fields=id%2Ctitle%2Caccession_number%2Ccreation_date%2Ctechnique%2Cshare_license_status';
const { scrape: clevelandArtSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'cleveland-museum-of-art', interval: 1500,
  params: {
    q: { required: true, maxLength: 120 },
    limit: { type: 'number', min: 1, max: 25, default: 10 },
    skip: { type: 'number', min: 0, max: 10000, default: 0 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['data']) ? payload : null
});

module.exports = { clevelandArtSearch };
if (require.main === module) cli();
