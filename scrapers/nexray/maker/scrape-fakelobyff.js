#!/usr/bin/env node
'use strict';

/**
 * Name : Kartu Lobi Free Fire
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat ilustrasi lobi fiktif Free Fire.
 * Note : node scrapers/nexray/maker/scrape-fakelobyff.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/fakelobyff';
const { scrape: nexrayMakerFakelobyff, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    nickname: { required: true }
  }
});

module.exports = { nexrayMakerFakelobyff };
if (require.main === module) cli();
