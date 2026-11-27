#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Lirik
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random song lyric guessing question
 * Note : node scrapers/nexray/games/scrape-tebaklirik.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/tebaklirik';
const { scrape: nexrayGamesTebaklirik, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesTebaklirik };
if (require.main === module) cli();
