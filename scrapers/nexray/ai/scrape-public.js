#!/usr/bin/env node
'use strict';

/**
 * Name : Public
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Public AI
 * Note : node scrapers/nexray/ai/scrape-public.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/public';
const { scrape: nexrayAiPublic, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiPublic };
if (require.main === module) cli();
