#!/usr/bin/env node
'use strict';

/**
 * Name : Scryfall Card Search
 * Creator : lmavour
 * Source : https://scryfall.com/docs/api/cards/search
 * Base Web : https://api.scryfall.com
 * Type : Scraper
 * Description : Mencari kartu Magic: The Gathering berdasarkan sintaks kueri Scryfall.
 * Note : node scrapers/public-data/games/scrape-scryfall-card-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.scryfall.com/cards/search';
const { scrape: scryfallCardSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'scryfall', interval: 1500,
  params: {
    q: { required: true },
    page: { min: 1, max: 100, default: 1 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['data']) ? payload : null
});

module.exports = { scryfallCardSearch };
if (require.main === module) cli();
