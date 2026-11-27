#!/usr/bin/env node
'use strict';

/**
 * Name : Pornhub
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat text gambar pornhub dengan dua teks
 * Note : node scrapers/nexray/textpro/scrape-pornhub.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/pornhub';
const { scrape: nexrayTextproPornhub, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true }
  }
});

module.exports = { nexrayTextproPornhub };
if (require.main === module) cli();
