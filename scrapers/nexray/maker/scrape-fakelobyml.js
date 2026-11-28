#!/usr/bin/env node
'use strict';

/**
 * Name : Kartu Lobi Mobile Legends
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat ilustrasi lobi fiktif Mobile Legends.
 * Note : node scrapers/nexray/maker/scrape-fakelobyml.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/fakelobyml';
const { scrape: nexrayMakerFakelobyml, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    avatar: { required: true, url: true },
    nickname: { required: true }
  }
});

module.exports = { nexrayMakerFakelobyml };
if (require.main === module) cli();
