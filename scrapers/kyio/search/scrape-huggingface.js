#!/usr/bin/env node
'use strict';

/**
 * Name : Hugging Face Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search and explore models, datasets, and spaces on the Hugging Face Hub.
 * Note : node scrapers/kyio/search/scrape-huggingface.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/huggingface';
const { scrape: searchHuggingface, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    type: {}
  }
});

module.exports = { searchHuggingface };
if (require.main === module) cli();
