#!/usr/bin/env node
'use strict';

/**
 * Name : Gempa
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan informasi gempa terkini dari BMKG
 * Note : node scrapers/nexray/information/scrape-gempa.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/gempa';
const { scrape: nexrayInformationGempa, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayInformationGempa };
if (require.main === module) cli();
