#!/usr/bin/env node
'use strict';

/**
 * Name : Asah Otak
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/games
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get random asah otak question
 * Note : node scrapers/nexray/games/scrape-asahotak.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/games/asahotak';
const { scrape: nexrayGamesAsahotak, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayGamesAsahotak };
if (require.main === module) cli();
