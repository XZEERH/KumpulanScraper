#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Downloader v2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download Pinterest photos, multi-image carousels, and videos via pintsave engine.
 * Note : node scrapers/kyio/downloader/scrape-pinterest-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/pinterest-v2';
const { scrape: downloaderPinterestV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderPinterestV2 };
if (require.main === module) cli();
