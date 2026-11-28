#!/usr/bin/env node
'use strict';

/**
 * Name : Teka Teki
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random puzzle/riddle question
 * Note : node scrapers/nexray/games/scrape-tekateki.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/tekateki';
const { scrape: nexrayGamesTekateki, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesTekateki };
if (require.main === module) cli();
