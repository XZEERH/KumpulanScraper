#!/usr/bin/env node
'use strict';

/**
 * Name : Komiku Search
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/anime
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search komiku by keyword
 * Note : node scrapers/nexray/anime/scrape-komiku-search.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/anime/komiku/search';
const { scrape: nexrayAnimeKomikuSearch, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexrayAnimeKomikuSearch };
if (require.main === module) cli();
