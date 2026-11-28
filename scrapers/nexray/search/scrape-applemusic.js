#!/usr/bin/env node
'use strict';

/**
 * Name : Apple Music
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mencari lagu di Apple Music
 * Note : node scrapers/nexray/search/scrape-applemusic.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/applemusic';
const { scrape: nexraySearchApplemusic, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchApplemusic };
if (require.main === module) cli();
