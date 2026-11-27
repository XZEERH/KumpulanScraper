#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal TV
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get TV schedule for specific channel
 * Note : node scrapers/nexray/information/scrape-jadwaltv.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/jadwaltv';
const { scrape: nexrayInformationJadwaltv, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    channel: { required: true }
  }
});

module.exports = { nexrayInformationJadwaltv };
if (require.main === module) cli();
