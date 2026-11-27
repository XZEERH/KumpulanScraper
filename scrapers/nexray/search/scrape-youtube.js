#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search video dari YouTube
 * Note : node scrapers/nexray/search/scrape-youtube.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/youtube';
const { scrape: nexraySearchYoutube, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchYoutube };
if (require.main === module) cli();
