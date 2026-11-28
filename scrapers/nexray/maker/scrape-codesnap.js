#!/usr/bin/env node
'use strict';

/**
 * Name : Code Snap
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Create code snippet image
 * Note : node scrapers/nexray/maker/scrape-codesnap.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/codesnap';
const { scrape: nexrayMakerCodesnap, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    code: { required: true }
  }
});

module.exports = { nexrayMakerCodesnap };
if (require.main === module) cli();
