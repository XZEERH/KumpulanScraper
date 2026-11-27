#!/usr/bin/env node
'use strict';

/**
 * Name : Rijksmuseum Collection Search
 * Creator : lmavour
 * Source : https://data.rijksmuseum.nl/docs/search
 * Base Web : https://data.rijksmuseum.nl
 * Type : Scraper
 * Description : Find Rijksmuseum collection objects by title and optional creator, returning linked-data identifiers.
 * Note : node scrapers/public-data/culture/scrape-rijksmuseum-collection-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://data.rijksmuseum.nl/search/collection';
const { scrape: rijksmuseumCollectionSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'rijksmuseum', interval: 1500,
  params: {
    title: { required: true, maxLength: 120 },
    creator: { maxLength: 100 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['orderedItems']) ? payload : null
});

module.exports = { rijksmuseumCollectionSearch };
if (require.main === module) cli();
