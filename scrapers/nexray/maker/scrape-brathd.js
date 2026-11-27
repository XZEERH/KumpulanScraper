#!/usr/bin/env node
'use strict';

/**
 * Name : Brat HD
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Brat HD Maker
 * Note : node scrapers/nexray/maker/scrape-brathd.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/brathd';
const { scrape: nexrayMakerBrathd, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerBrathd };
if (require.main === module) cli();
