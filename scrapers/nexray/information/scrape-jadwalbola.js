#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal-Sepakbola
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan jadwal pertandingan sepakbola terkini
 * Note : node scrapers/nexray/information/scrape-jadwalbola.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/jadwalbola';
const { scrape: nexrayInformationJadwalbola, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayInformationJadwalbola };
if (require.main === module) cli();
