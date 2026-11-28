#!/usr/bin/env node
'use strict';

/**
 * Name : Muslim
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan AI tentang Islam
 * Note : node scrapers/nexray/ai/scrape-muslim.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/muslim';
const { scrape: nexrayAiMuslim, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiMuslim };
if (require.main === module) cli();
