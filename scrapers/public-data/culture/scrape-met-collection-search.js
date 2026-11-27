#!/usr/bin/env node
'use strict';

/**
 * Name : Met Collection Search
 * Creator : lmavour
 * Source : https://metmuseum.github.io/
 * Base Web : https://collectionapi.metmuseum.org
 * Type : Scraper
 * Description : Search the Metropolitan Museum of Art collection for object IDs, with pagination.
 * Note : node scrapers/public-data/culture/scrape-met-collection-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
const { scrape: metCollectionSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'met', interval: 1500,
  params: {
    q: { required: true, maxLength: 120 },
    limit: { type: 'number', min: 1, max: 100, default: 10 },
    offset: { type: 'number', min: 0, max: 9900, default: 0 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['objectIDs']) ? payload : null
});

module.exports = { metCollectionSearch };
if (require.main === module) cli();
