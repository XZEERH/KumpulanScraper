#!/usr/bin/env node
'use strict';

/**
 * Name : Lyrics
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Cari lirik lagu berdasarkan judul
 * Note : node scrapers/nexray/search/scrape-lyrics.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/lyrics';
const { scrape: nexraySearchLyrics, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchLyrics };
if (require.main === module) cli();
