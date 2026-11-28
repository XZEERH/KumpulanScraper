#!/usr/bin/env node
'use strict';

/**
 * Name : Cartoon Graffiti
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks cartoon graffiti style
 * Note : node scrapers/nexray/textpro/scrape-cartoon-graffiti.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/cartoon-graffiti';
const { scrape: nexrayTextproCartoonGraffiti, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproCartoonGraffiti };
if (require.main === module) cli();
