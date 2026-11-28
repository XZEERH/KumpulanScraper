#!/usr/bin/env node
'use strict';

/**
 * Name : Emoji-Gif
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengubah emoji menjadi Gif
 * Note : node scrapers/nexray/tools/scrape-emojigif.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/emojigif';
const { scrape: nexrayToolsEmojigif, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    emoji: { required: true }
  }
});

module.exports = { nexrayToolsEmojigif };
if (require.main === module) cli();
