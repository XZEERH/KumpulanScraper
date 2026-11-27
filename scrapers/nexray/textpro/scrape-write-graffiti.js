#!/usr/bin/env node
'use strict';

/**
 * Name : Write Graffiti
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks write graffiti style
 * Note : node scrapers/nexray/textpro/scrape-write-graffiti.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/write-graffiti';
const { scrape: nexrayTextproWriteGraffiti, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproWriteGraffiti };
if (require.main === module) cli();
