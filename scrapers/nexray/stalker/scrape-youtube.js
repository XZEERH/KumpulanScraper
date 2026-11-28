#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Stalker youtube untuk mencari akun youtube
 * Note : node scrapers/nexray/stalker/scrape-youtube.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/youtube';
const { scrape: nexrayStalkerYoutube, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerYoutube };
if (require.main === module) cli();
