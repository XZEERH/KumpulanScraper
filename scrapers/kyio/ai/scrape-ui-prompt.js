#!/usr/bin/env node
'use strict';

/**
 * Name : UI Prompt AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Scraper & API untuk 750+ curated AI web design prompts & templates (MotionSite & MotionSites.ai): Full master markdown prompt specifications, direct source code .zip downloads, dan animated WebP previews.
 * Note : node scrapers/kyio/ai/scrape-ui-prompt.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/ui-prompt';
const { scrape: aiUiPrompt, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    q: {},
    id: {},
    source: {},
    category: {},
    type: {},
    is_free: {},
    sort: {},
    page: {},
    limit: {}
  }
});

module.exports = { aiUiPrompt };
if (require.main === module) cli();
