#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok User Info
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : TikTok User Info
 * Note : node scrapers/kyio/information/scrape-tiktok.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/tiktok';
const { scrape: informationTiktok, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    username: { required: true }
  }
});

module.exports = { informationTiktok };
if (require.main === module) cli();
