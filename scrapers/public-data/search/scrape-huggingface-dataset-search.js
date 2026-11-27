#!/usr/bin/env node
'use strict';

/**
 * Name : Hugging Face Dataset Search
 * Creator : lmavour
 * Source : https://huggingface.co/docs/hub/api
 * Base Web : https://huggingface.co
 * Type : Scraper
 * Description : Mencari katalog dataset publik dan informasi ketersediaannya.
 * Note : node scrapers/public-data/search/scrape-huggingface-dataset-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://huggingface.co/api/datasets';
const { scrape: huggingfaceDatasetSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'huggingface', interval: 1500,
  params: {
    search: { required: true },
    limit: { min: 1, max: 25, default: 5 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { huggingfaceDatasetSearch };
if (require.main === module) cli();
