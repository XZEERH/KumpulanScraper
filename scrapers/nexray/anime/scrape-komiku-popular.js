#!/usr/bin/env node
'use strict';

/**
 * Name : Komiku Popular
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/anime
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get list of popular manga from Komiku
 * Note : node scrapers/nexray/anime/scrape-komiku-popular.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/anime/komiku/popular';
const { scrape: nexrayAnimeKomikuPopular, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    page: {}
  }
});

module.exports = { nexrayAnimeKomikuPopular };
if (require.main === module) cli();
