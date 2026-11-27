#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get Pinterest user profile information
 * Note : node scrapers/nexray/stalker/scrape-pinterest.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/pinterest';
const { scrape: nexrayStalkerPinterest, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerPinterest };
if (require.main === module) cli();
