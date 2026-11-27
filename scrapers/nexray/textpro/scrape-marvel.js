#!/usr/bin/env node
'use strict';

/**
 * Name : Marvel
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat logo gaya Marvel dengan dua teks dan pilihan background
 * Note : node scrapers/nexray/textpro/scrape-marvel.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/marvel';
const { scrape: nexrayTextproMarvel, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true },
    background: { choices: ['logo-1', 'logo-2'] }
  }
});

module.exports = { nexrayTextproMarvel };
if (require.main === module) cli();
