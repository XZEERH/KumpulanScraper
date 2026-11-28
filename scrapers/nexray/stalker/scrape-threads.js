#!/usr/bin/env node
'use strict';

/**
 * Name : Threads
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get Threads user profile information
 * Note : node scrapers/nexray/stalker/scrape-threads.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/threads';
const { scrape: nexrayStalkerThreads, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerThreads };
if (require.main === module) cli();
