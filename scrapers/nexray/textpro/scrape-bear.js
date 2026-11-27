#!/usr/bin/env node
'use strict';

/**
 * Name : Bear
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks bear style
 * Note : node scrapers/nexray/textpro/scrape-bear.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/bear';
const { scrape: nexrayTextproBear, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproBear };
if (require.main === module) cli();
