#!/usr/bin/env node
'use strict';

/**
 * Name : Sologo
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate logo
 * Note : node scrapers/nexray/ai/scrape-sologo.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/sologo';
const { scrape: nexrayAiSologo, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    prompt: { required: true }
  }
});

module.exports = { nexrayAiSologo };
if (require.main === module) cli();
