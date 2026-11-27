#!/usr/bin/env node
'use strict';

/**
 * Name : Siapakah Aku
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random siapakah aku question
 * Note : node scrapers/nexray/games/scrape-siapakahaku.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/siapakahaku';
const { scrape: nexrayGamesSiapakahaku, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesSiapakahaku };
if (require.main === module) cli();
