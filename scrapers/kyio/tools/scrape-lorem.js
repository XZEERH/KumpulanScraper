#!/usr/bin/env node
'use strict';

/**
 * Name : Lorem Ipsum Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate dummy text
 * Note : node scrapers/kyio/tools/scrape-lorem.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/lorem';
const { scrape: toolsLorem, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    paragraphs: {}
  }
});

module.exports = { toolsLorem };
if (require.main === module) cli();
