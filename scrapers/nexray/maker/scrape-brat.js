#!/usr/bin/env node
'use strict';

/**
 * Name : Brat
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Brat Maker
 * Note : node scrapers/nexray/maker/scrape-brat.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/brat';
const { scrape: nexrayMakerBrat, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerBrat };
if (require.main === module) cli();
