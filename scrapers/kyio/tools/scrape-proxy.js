#!/usr/bin/env node
'use strict';

/**
 * Name : Free Proxy
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari proxy gratis (http, https, socks4, socks5)
 * Note : node scrapers/kyio/tools/scrape-proxy.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/proxy';
const { scrape: toolsProxy, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    protocol: {},
    limit: {}
  }
});

module.exports = { toolsProxy };
if (require.main === module) cli();
