#!/usr/bin/env node
'use strict';

/**
 * Name : Zodiak
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Informasi lengkap zodiak berdasarkan primbon
 * Note : node scrapers/nexray/primbon/scrape-zodiak.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/zodiak';
const { scrape: nexrayPrimbonZodiak, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    zodiak: { required: true, choices: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces'] }
  }
});

module.exports = { nexrayPrimbonZodiak };
if (require.main === module) cli();
