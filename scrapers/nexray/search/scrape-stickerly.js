#!/usr/bin/env node
'use strict';

/**
 * Name : Stickerly
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search sticker dari stickerly
 * Note : node scrapers/nexray/search/scrape-stickerly.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/stickerly';
const { scrape: nexraySearchStickerly, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchStickerly };
if (require.main === module) cli();
