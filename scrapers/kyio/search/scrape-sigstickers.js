#!/usr/bin/env node
'use strict';

/**
 * Name : Sticker Telegram & WhatsApp
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search Telegram and WhatsApp sticker packs, and retrieve full sticker webp/png CDN assets via sigstick.com.
 * Note : node scrapers/kyio/search/scrape-sigstickers.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/sigstickers';
const { scrape: searchSigstickers, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: {},
    id: {},
    url: {},
    action: {}
  }
});

module.exports = { searchSigstickers };
if (require.main === module) cli();
