#!/usr/bin/env node
'use strict';

/**
 * Name : Typography
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat efek teks typography style
 * Note : node scrapers/nexray/textpro/scrape-typography.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/typography';
const { scrape: nexrayTextproTypography, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayTextproTypography };
if (require.main === module) cli();
