#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download videos, photos, or carousels from Instagram (Primary Engine). Use v2/v3/v4 for alternatives.
 * Note : node scrapers/kyio/downloader/scrape-ig.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ig';
const { scrape: downloaderIg, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderIg };
if (require.main === module) cli();
