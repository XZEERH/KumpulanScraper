#!/usr/bin/env node
'use strict';

/**
 * Name : Modrinth Project Search
 * Creator : lmavour
 * Source : https://docs.modrinth.com/api/operations/searchprojects/
 * Base Web : https://api.modrinth.com
 * Type : Scraper
 * Description : Mencari mod, modpack, atau paket sumber daya Minecraft di Modrinth.
 * Note : node scrapers/public-data/games/scrape-modrinth-project-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.modrinth.com/v2/search';
const { scrape: modrinthProjectSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'modrinth', interval: 1500,
  params: {
    query: { required: true },
    limit: { min: 1, max: 25, default: 5 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['hits']) ? payload : null
});

module.exports = { modrinthProjectSearch };
if (require.main === module) cli();
