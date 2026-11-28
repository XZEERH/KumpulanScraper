#!/usr/bin/env node
'use strict';

/**
 * Name : PowerBrain
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan PowerBrain AI
 * Note : node scrapers/nexray/ai/scrape-powerbrain.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/powerbrain';
const { scrape: nexrayAiPowerbrain, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiPowerbrain };
if (require.main === module) cli();
