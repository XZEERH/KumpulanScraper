#!/usr/bin/env node
'use strict';

/**
 * Name : Wolf Galaxy
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat logo avatar wolf galaxy dengan dua teks
 * Note : node scrapers/nexray/textpro/scrape-wolf-galaxy.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/wolf-galaxy';
const { scrape: nexrayTextproWolfGalaxy, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true }
  }
});

module.exports = { nexrayTextproWolfGalaxy };
if (require.main === module) cli();
