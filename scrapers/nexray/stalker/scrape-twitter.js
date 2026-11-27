#!/usr/bin/env node
'use strict';

/**
 * Name : Twitter X
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get Twitter / X user profile information
 * Note : node scrapers/nexray/stalker/scrape-twitter.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/twitter';
const { scrape: nexrayStalkerTwitter, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerTwitter };
if (require.main === module) cli();
