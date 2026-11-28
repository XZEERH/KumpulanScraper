#!/usr/bin/env node
'use strict';

/**
 * Name : Halodoc AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : AI chatbot dari Halodoc (Hilda) untuk menjawab pertanyaan seputar kesehatan dan rekomendasi obat.
 * Note : node scrapers/kyio/ai/scrape-halodoc.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/halodoc';
const { scrape: aiHalodoc, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiHalodoc };
if (require.main === module) cli();
