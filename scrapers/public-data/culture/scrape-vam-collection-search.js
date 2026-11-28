#!/usr/bin/env node
'use strict';

/**
 * Name : Victoria and Albert Museum Collection Search
 * Creator : lmavour
 * Source : https://developers.vam.ac.uk/guide/v2/quick-start.html
 * Base Web : https://api.vam.ac.uk
 * Type : Scraper
 * Description : Search V&A collection metadata for decorative arts, design, textiles, and other museum objects.
 * Note : node scrapers/public-data/culture/scrape-vam-collection-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.vam.ac.uk/v2/objects/search?response_format=json';
const { scrape: vamCollectionSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'v-a', interval: 1500,
  params: {
    q: { required: true, maxLength: 120 },
    page_size: { type: 'number', min: 1, max: 25, default: 10 },
    page: { type: 'number', min: 1, max: 40, default: 1 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['records']) ? payload : null
});

module.exports = { vamCollectionSearch };
if (require.main === module) cli();
