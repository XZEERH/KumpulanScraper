#!/usr/bin/env node
'use strict';

/**
 * Name : Wet Glass
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks wet glass style
 * Note : node scrapers/nexray/textpro/scrape-wetglass.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/wetglass';
const { scrape: nexrayTextproWetglass, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproWetglass };
if (require.main === module) cli();
