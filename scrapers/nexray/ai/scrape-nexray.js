#!/usr/bin/env node
'use strict';

/**
 * Name : NexRay
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan NexRay AI
 * Note : node scrapers/nexray/ai/scrape-nexray.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/nexray';
const { scrape: nexrayAiNexray, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiNexray };
if (require.main === module) cli();
