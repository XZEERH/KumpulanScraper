#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kimia
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random tebak kimia question with chemical element and its symbol
 * Note : node scrapers/nexray/games/scrape-tebakkimia.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/tebakkimia';
const { scrape: nexrayGamesTebakkimia, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesTebakkimia };
if (require.main === module) cli();
