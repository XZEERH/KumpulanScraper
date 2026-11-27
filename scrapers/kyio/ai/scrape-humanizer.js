#!/usr/bin/env node
'use strict';

/**
 * Name : AI Humanizer
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ubah teks kaku buatan AI menjadi tulisan bergaya manusia yang natural dan lolos deteksi AI.
 * Note : node scrapers/kyio/ai/scrape-humanizer.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/humanizer';
const { scrape: aiHumanizer, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    intensity: {}
  }
});

module.exports = { aiHumanizer };
if (require.main === module) cli();
