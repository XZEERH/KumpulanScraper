#!/usr/bin/env node
'use strict';

/**
 * Name : Sticker.ly
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for sticker packs or fetch details from a Sticker.ly URL
 * Note : node scrapers/kyio/fun/scrape-stickerly.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/stickerly';
const { scrape: funStickerly, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { funStickerly };
if (require.main === module) cli();
