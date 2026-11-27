#!/usr/bin/env node
'use strict';

/**
 * Name : Komiku Detail
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/anime
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get detailed information about a manga including chapters, genres, and metadata
 * Note : node scrapers/nexray/anime/scrape-komiku-detail.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/anime/komiku/detail';
const { scrape: nexrayAnimeKomikuDetail, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayAnimeKomikuDetail };
if (require.main === module) cli();
