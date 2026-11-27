#!/usr/bin/env node
'use strict';

/**
 * Name : Harvard Dataverse Dataset Search
 * Creator : lmavour
 * Source : https://guides.dataverse.org/en/latest/api/search.html
 * Base Web : https://dataverse.harvard.edu
 * Type : Scraper
 * Description : Search Harvard Dataverse for public datasets and their citation metadata.
 * Note : node scrapers/public-data/search/scrape-harvard-dataverse-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://dataverse.harvard.edu/api/search?type=dataset';
const { scrape: harvardDataverseSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'harvard-dataverse', interval: 1500,
  params: {
    q: { required: true, maxLength: 180 },
    per_page: { type: 'number', min: 1, max: 25, default: 10 },
    start: { type: 'number', min: 0, max: 1000, default: 0 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['data']?.['items']) ? payload : null
});

module.exports = { harvardDataverseSearch };
if (require.main === module) cli();
