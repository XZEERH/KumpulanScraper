#!/usr/bin/env node
'use strict';

/**
 * Name : Resep Koki
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for recipes on ResepKoki.id
 * Note : node scrapers/nexray/search/scrape-resep.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/resep';
const { scrape: nexraySearchResep, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchResep };
if (require.main === module) cli();
