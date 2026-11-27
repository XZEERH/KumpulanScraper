#!/usr/bin/env node
'use strict';

/**
 * Name : ChatGPT
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan ChatGPT
 * Note : node scrapers/nexray/ai/scrape-chatgpt.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/chatgpt';
const { scrape: nexrayAiChatgpt, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiChatgpt };
if (require.main === module) cli();
