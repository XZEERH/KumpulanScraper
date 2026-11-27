#!/usr/bin/env node
'use strict';

/**
 * Name : AI Dream Interpreter
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Interpret your dreams with AI - describe your dream and get meaningful insights
 * Note : node scrapers/prexzy/artificial-intelligence/scrape-dream.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/ai/dream';
const { scrape: prexzyArtificialIntelligenceDream, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'result',
  params: {
    dream: { required: true }
  }
});

module.exports = { prexzyArtificialIntelligenceDream };
if (require.main === module) cli();
