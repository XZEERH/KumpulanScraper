#!/usr/bin/env node
'use strict';

/**
 * Name : IPv4 Subnet Calculator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Hitung subnet mask, network address, broadcast, dan range IP host.
 * Note : node scrapers/kyio/tools/scrape-ipv4-subnet.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/ipv4-subnet';
const { scrape: toolsIpv4Subnet, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    address: { required: true },
    mask: { required: true }
  }
});

module.exports = { toolsIpv4Subnet };
if (require.main === module) cli();
