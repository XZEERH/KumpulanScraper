#!/usr/bin/env node
'use strict';

/**
 * Name : Avengers
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat text gambar avengers dengan dua teks
 * Note : node scrapers/nexray/textpro/scrape-avengers.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/avengers';
const { scrape: nexrayTextproAvengers, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true }
  }
});

module.exports = { nexrayTextproAvengers };
if (require.main === module) cli();
