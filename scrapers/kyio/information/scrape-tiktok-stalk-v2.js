#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Stalk V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch detailed profile information and recent videos of a TikTok user.
 * Note : node scrapers/kyio/information/scrape-tiktok-stalk-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/tiktok-stalk-v2';
const { scrape: informationTiktokStalkV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    username: { required: true }
  }
});

module.exports = { informationTiktokStalkV2 };
if (require.main === module) cli();
