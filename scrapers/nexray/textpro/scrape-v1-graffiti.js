#!/usr/bin/env node
'use strict';

/**
 * Name : Graffiti v1
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat text gambar graffiti v1 dengan dua teks
 * Note : node scrapers/nexray/textpro/scrape-v1-graffiti.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/v1/graffiti';
const { scrape: nexrayTextproV1Graffiti, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true }
  }
});

module.exports = { nexrayTextproV1Graffiti };
if (require.main === module) cli();
