#!/usr/bin/env node
'use strict';

/**
 * Name : FLUX 2 Pro Image Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate gambar ultra-realistis berkualitas tinggi dengan FLUX 2 Pro.
 * Note : node scrapers/kyio/ai/scrape-flux-2-pro.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/flux-2-pro';
const { scrape: aiFlux2Pro, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    size: {}
  }
});

module.exports = { aiFlux2Pro };
if (require.main === module) cli();
