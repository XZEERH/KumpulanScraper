#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Summary
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Summarize YouTube video content from transcript.
 * Note : node scrapers/kyio/tools/scrape-youtube-summary.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/youtube-summary';
const { scrape: toolsYoutubeSummary, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { toolsYoutubeSummary };
if (require.main === module) cli();
