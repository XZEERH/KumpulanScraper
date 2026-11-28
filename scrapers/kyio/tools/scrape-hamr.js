#!/usr/bin/env node
'use strict';

/**
 * Name : ha.mr Link Compressor
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Stateless, database-free URL compression and decompression using Huffman bit-packing algorithm (ha.mr).
 * Note : node scrapers/kyio/tools/scrape-hamr.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/hamr';
const { scrape: toolsHamr, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    action: {}
  }
});

module.exports = { toolsHamr };
if (require.main === module) cli();
