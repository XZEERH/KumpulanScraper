#!/usr/bin/env node
'use strict';

/**
 * Name : Bing Edge AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Asisten AI cerdas Microsoft Edge / Bing dengan jawaban percakapan komprehensif serta kemampuan membuat gambar (Image Creator).
 * Note : node scrapers/kyio/ai/scrape-bing.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/bing';
const { scrape: aiBing, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    mode: {},
    lang: {}
  }
});

module.exports = { aiBing };
if (require.main === module) cli();
