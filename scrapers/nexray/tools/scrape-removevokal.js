#!/usr/bin/env node
'use strict';

/**
 * Name : Remove Vocal
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Remove vocal from audio
 * Note : node scrapers/nexray/tools/scrape-removevokal.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/removevokal';
const { scrape: nexrayToolsRemovevokal, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayToolsRemovevokal };
if (require.main === module) cli();
