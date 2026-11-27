#!/usr/bin/env node
'use strict';

/**
 * Name : Emojipedia
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil emoji dari emojipedia
 * Note : node scrapers/nexray/tools/scrape-emojipedia.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/emojipedia';
const { scrape: nexrayToolsEmojipedia, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    emoji: { required: true }
  }
});

module.exports = { nexrayToolsEmojipedia };
if (require.main === module) cli();
