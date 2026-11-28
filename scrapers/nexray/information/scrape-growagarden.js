#!/usr/bin/env node
'use strict';

/**
 * Name : Grow A Garden Stock
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan informasi stok dari Grow A Garden
 * Note : node scrapers/nexray/information/scrape-growagarden.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/growagarden';
const { scrape: nexrayInformationGrowagarden, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayInformationGrowagarden };
if (require.main === module) cli();
