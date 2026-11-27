#!/usr/bin/env node
'use strict';

/**
 * Name : Hitung Winrate MLBB
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Menghitung berapa win streak tanpa kalah untuk mencapai target winrate
 * Note : node scrapers/nexray/tools/scrape-winrate-mlbb.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/winrate-mlbb';
const { scrape: nexrayToolsWinrateMlbb, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    total_match: { required: true },
    wr_now: { required: true },
    wr_target: { required: true }
  }
});

module.exports = { nexrayToolsWinrateMlbb };
if (require.main === module) cli();
