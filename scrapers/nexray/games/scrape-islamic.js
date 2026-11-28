#!/usr/bin/env node
'use strict';

/**
 * Name : Islamic
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random Islamic question
 * Note : node scrapers/nexray/games/scrape-islamic.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/islamic';
const { scrape: nexrayGamesIslamic, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesIslamic };
if (require.main === module) cli();
