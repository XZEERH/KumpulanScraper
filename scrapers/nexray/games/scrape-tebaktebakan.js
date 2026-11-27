#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Tebakan
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random riddle/question guessing game
 * Note : node scrapers/nexray/games/scrape-tebaktebakan.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/tebaktebakan';
const { scrape: nexrayGamesTebaktebakan, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesTebaktebakan };
if (require.main === module) cli();
