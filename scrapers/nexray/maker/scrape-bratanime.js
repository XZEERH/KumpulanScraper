#!/usr/bin/env node
'use strict';

/**
 * Name : Brat Anime
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Brat Anime Maker
 * Note : node scrapers/nexray/maker/scrape-bratanime.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/bratanime';
const { scrape: nexrayMakerBratanime, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayMakerBratanime };
if (require.main === module) cli();
