#!/usr/bin/env node
'use strict';

/**
 * Name : Naruto
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks naruto style
 * Note : node scrapers/nexray/textpro/scrape-naruto.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/naruto';
const { scrape: nexrayTextproNaruto, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproNaruto };
if (require.main === module) cli();
