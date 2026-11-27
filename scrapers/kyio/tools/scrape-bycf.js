#!/usr/bin/env node
'use strict';

/**
 * Name : Cloudflare Bypass Suite
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Bypass Cloudflare WAF, Turnstile & JS Challenge secara otomatis (Powered by Hybrid Fast TLS, Scrapling & Puppeteer Real Browser).
 * Note : node scrapers/kyio/tools/scrape-bycf.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/bycf';
const { scrape: toolsBycf, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true },
    engine: {},
    proxy: {}
  }
});

module.exports = { toolsBycf };
if (require.main === module) cli();
