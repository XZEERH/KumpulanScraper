#!/usr/bin/env node
'use strict';

/**
 * Name : Devil Wings
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks devil wings style
 * Note : node scrapers/nexray/textpro/scrape-devil-wings.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/devil-wings';
const { scrape: nexrayTextproDevilWings, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproDevilWings };
if (require.main === module) cli();
