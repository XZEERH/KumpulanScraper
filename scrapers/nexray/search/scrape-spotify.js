#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for tracks on Spotify
 * Note : node scrapers/nexray/search/scrape-spotify.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/spotify';
const { scrape: nexraySearchSpotify, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchSpotify };
if (require.main === module) cli();
