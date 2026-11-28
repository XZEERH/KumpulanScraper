#!/usr/bin/env node
'use strict';

/**
 * Name : Webpilot
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search and get AI-generated answers with sources from the web
 * Note : node scrapers/nexray/ai/scrape-webpilot.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/webpilot';
const { scrape: nexrayAiWebpilot, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiWebpilot };
if (require.main === module) cli();
