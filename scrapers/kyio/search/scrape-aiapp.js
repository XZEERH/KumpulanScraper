#!/usr/bin/env node
'use strict';

/**
 * Name : AIApp Web Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Endpoint primer AI Web Search via api.aiapp.ai lengkap dengan ringkasan jawaban dan daftar sumber sitasi.
 * Note : node scrapers/kyio/search/scrape-aiapp.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/aiapp';
const { scrape: searchAiapp, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true, aliases: ['query', 'text'] },
    sessionId: {}
  }
});

module.exports = { searchAiapp };
if (require.main === module) cli();
