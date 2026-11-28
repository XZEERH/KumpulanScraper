#!/usr/bin/env node
'use strict';

/**
 * Name : BlackPink
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks blackpink style
 * Note : node scrapers/nexray/textpro/scrape-blackpink.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/blackpink';
const { scrape: nexrayTextproBlackpink, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproBlackpink };
if (require.main === module) cli();
