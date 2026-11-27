#!/usr/bin/env node
'use strict';

/**
 * Name : Alay
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/fun
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Convert text to alay style (Indonesian slang)
 * Note : node scrapers/nexray/fun/scrape-alay.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/fun/alay';
const { scrape: nexrayFunAlay, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayFunAlay };
if (require.main === module) cli();
