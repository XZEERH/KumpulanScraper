#!/usr/bin/env node
'use strict';

/**
 * Name : Ttp
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Convert text to centered PNG image
 * Note : node scrapers/nexray/maker/scrape-ttp.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/ttp';
const { scrape: nexrayMakerTtp, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerTtp };
if (require.main === module) cli();
