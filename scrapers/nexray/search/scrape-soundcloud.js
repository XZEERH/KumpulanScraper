#!/usr/bin/env node
'use strict';

/**
 * Name : SoundCloud
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mencari lagu di SoundCloud
 * Note : node scrapers/nexray/search/scrape-soundcloud.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/soundcloud';
const { scrape: nexraySearchSoundcloud, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchSoundcloud };
if (require.main === module) cli();
