#!/usr/bin/env node
'use strict';

/**
 * Name : Balogo
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate Blue Archive style logo
 * Note : node scrapers/nexray/maker/scrape-balogo.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/balogo';
const { scrape: nexrayMakerBalogo, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerBalogo };
if (require.main === module) cli();
