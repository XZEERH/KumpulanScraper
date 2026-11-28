#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Video
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for videos on Pinterest
 * Note : node scrapers/nexray/search/scrape-pinterestvideo.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/pinterestvideo';
const { scrape: nexraySearchPinterestvideo, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchPinterestvideo };
if (require.main === module) cli();
