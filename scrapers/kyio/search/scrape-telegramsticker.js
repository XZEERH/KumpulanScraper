#!/usr/bin/env node
'use strict';

/**
 * Name : Telegram Sticker Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search Telegram sticker packs and extract all sticker webp/png CDN assets without needing a bot token.
 * Note : node scrapers/kyio/search/scrape-telegramsticker.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/telegramsticker';
const { scrape: searchTelegramsticker, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: {},
    id: {},
    url: {},
    action: {}
  }
});

module.exports = { searchTelegramsticker };
if (require.main === module) cli();
