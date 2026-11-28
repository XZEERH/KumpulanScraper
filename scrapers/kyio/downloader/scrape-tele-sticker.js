#!/usr/bin/env node
'use strict';

/**
 * Name : Telegram Sticker Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Extract and download all stickers from a Telegram sticker pack.
 * Note : node scrapers/kyio/downloader/scrape-tele-sticker.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/tele-sticker';
const { scrape: downloaderTeleSticker, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    bot_token: {}
  }
});

module.exports = { downloaderTeleSticker };
if (require.main === module) cli();
