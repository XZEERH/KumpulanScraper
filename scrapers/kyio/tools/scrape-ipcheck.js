#!/usr/bin/env node
'use strict';

/**
 * Name : IP Check
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cek status keamanan IP (Whitelist/Blacklist/Netral) di jaringan KyioAPI beserta catatan moderasinya.
 * Note : node scrapers/kyio/tools/scrape-ipcheck.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/ipcheck';
const { scrape: toolsIpcheck, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    ip: {}
  }
});

module.exports = { toolsIpcheck };
if (require.main === module) cli();
