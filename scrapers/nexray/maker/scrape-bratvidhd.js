#!/usr/bin/env node
'use strict';

/**
 * Name : Bratvid HD
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Bratvid HD Maker
 * Note : node scrapers/nexray/maker/scrape-bratvidhd.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/bratvidhd';
const { scrape: nexrayMakerBratvidhd, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerBratvidhd };
if (require.main === module) cli();
