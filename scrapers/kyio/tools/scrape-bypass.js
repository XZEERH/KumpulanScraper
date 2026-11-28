#!/usr/bin/env node
'use strict';

/**
 * Name : Shortlink & Locker Bypass
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Bypass dan buka kunci 40+ platform shortlink serta locker (Linkvertise, LootLabs, Work.ink, Sub4unlock, Bitly, dll) langsung ke URL tujuan.
 * Note : node scrapers/kyio/tools/scrape-bypass.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/bypass';
const { scrape: toolsBypass, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { toolsBypass };
if (require.main === module) cli();
