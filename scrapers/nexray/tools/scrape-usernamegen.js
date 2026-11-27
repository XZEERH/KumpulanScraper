#!/usr/bin/env node
'use strict';

/**
 * Name : Username Generator
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate usernames based on keywords
 * Note : node scrapers/nexray/tools/scrape-usernamegen.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/usernamegen';
const { scrape: nexrayToolsUsernamegen, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    name: { required: true },
    mode: { choices: ['instans', 'ai'] },
    theme: { choices: ['action', 'adventure', 'fantasy', 'historical', 'horror', 'mythology', 'nature', 'sci-fi', 'strategy'] }
  }
});

module.exports = { nexrayToolsUsernamegen };
if (require.main === module) cli();
