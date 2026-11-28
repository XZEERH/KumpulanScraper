#!/usr/bin/env node
'use strict';

/**
 * Name : Comic
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks comic style
 * Note : node scrapers/nexray/textpro/scrape-comic.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/comic';
const { scrape: nexrayTextproComic, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproComic };
if (require.main === module) cli();
