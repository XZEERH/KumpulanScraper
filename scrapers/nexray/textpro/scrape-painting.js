#!/usr/bin/env node
'use strict';

/**
 * Name : Painting
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat text gambar painting dengan dua teks
 * Note : node scrapers/nexray/textpro/scrape-painting.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/painting';
const { scrape: nexrayTextproPainting, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true }
  }
});

module.exports = { nexrayTextproPainting };
if (require.main === module) cli();
