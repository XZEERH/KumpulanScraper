#!/usr/bin/env node
'use strict';

/**
 * Name : Hugging Face Model Search
 * Creator : lmavour
 * Source : https://huggingface.co/docs/hub/api
 * Base Web : https://huggingface.co
 * Type : Scraper
 * Description : Mencari metadata model publik tanpa menjalankan atau mengunduh model.
 * Note : node scrapers/public-data/search/scrape-huggingface-model-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://huggingface.co/api/models';
const { scrape: huggingfaceModelSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'huggingface', interval: 1500,
  params: {
    search: { required: true },
    limit: { min: 1, max: 25, default: 5 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { huggingfaceModelSearch };
if (require.main === module) cli();
