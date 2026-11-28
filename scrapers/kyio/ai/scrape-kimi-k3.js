#!/usr/bin/env node
'use strict';

/**
 * Name : Moonshot Kimi K3
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model reasoning dan long-context mutakhir dari Moonshot AI Kimi K3.
 * Note : node scrapers/kyio/ai/scrape-kimi-k3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/kimi-k3';
const { scrape: aiKimiK3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiKimiK3 };
if (require.main === module) cli();
