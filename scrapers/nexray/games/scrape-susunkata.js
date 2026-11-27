#!/usr/bin/env node
'use strict';

/**
 * Name : Susun Kata
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random susun kata question
 * Note : node scrapers/nexray/games/scrape-susunkata.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/susunkata';
const { scrape: nexrayGamesSusunkata, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesSusunkata };
if (require.main === module) cli();
