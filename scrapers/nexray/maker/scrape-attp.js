#!/usr/bin/env node
'use strict';

/**
 * Name : Attp
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Attp Maker
 * Note : node scrapers/nexray/maker/scrape-attp.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/attp';
const { scrape: nexrayMakerAttp, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerAttp };
if (require.main === module) cli();
