#!/usr/bin/env node
'use strict';

/**
 * Name : ShadowDragon Google Dork Assistant
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : ShadowDragon Google Dork & OSINT query builder with NLP prompt parser, presets, and OSINT packs.
 * Note : node scrapers/kyio/tools/scrape-dork.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/dork';
const { scrape: toolsDork, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: {},
    target: {},
    preset: {},
    pack: {}
  }
});

module.exports = { toolsDork };
if (require.main === module) cli();
