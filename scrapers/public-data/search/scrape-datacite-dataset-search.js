#!/usr/bin/env node
'use strict';

/**
 * Name : DataCite Dataset DOI Search
 * Creator : lmavour
 * Source : https://support.datacite.org/docs/api-queries
 * Base Web : https://api.datacite.org
 * Type : Scraper
 * Description : Search findable DataCite DOI records restricted to datasets.
 * Note : node scrapers/public-data/search/scrape-datacite-dataset-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.datacite.org/dois?resource-type-id=dataset';
const { scrape: dataciteDatasetSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'datacite', interval: 1500,
  params: {
    query: { required: true, maxLength: 180 },
    'page[size]': { type: 'number', min: 1, max: 25, default: 10 },
    'page[number]': { type: 'number', min: 1, max: 100, default: 1 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['data']) ? payload : null
});

module.exports = { dataciteDatasetSearch };
if (require.main === module) cli();
