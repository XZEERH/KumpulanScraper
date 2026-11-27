#!/usr/bin/env node
'use strict';

/**
 * Name : Graffiti v5
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks graffiti v5 style
 * Note : node scrapers/nexray/textpro/scrape-v5-graffiti.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/v5/graffiti';
const { scrape: nexrayTextproV5Graffiti, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproV5Graffiti };
if (require.main === module) cli();
