#!/usr/bin/env node
'use strict';

/**
 * Name : Simi Simi
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Simi Simi
 * Note : node scrapers/nexray/ai/scrape-simisimi.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/simisimi';
const { scrape: nexrayAiSimisimi, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiSimisimi };
if (require.main === module) cli();
