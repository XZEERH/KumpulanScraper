#!/usr/bin/env node
'use strict';

/**
 * Name : Hari Libur Nasional
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan informasi hari libur nasional dan event penting di Indonesia
 * Note : node scrapers/nexray/information/scrape-hari-libur.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/hari-libur';
const { scrape: nexrayInformationHariLibur, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayInformationHariLibur };
if (require.main === module) cli();
