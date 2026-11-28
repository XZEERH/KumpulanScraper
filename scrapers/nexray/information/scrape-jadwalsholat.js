#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal Sholat
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get prayer schedule for specific city
 * Note : node scrapers/nexray/information/scrape-jadwalsholat.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/jadwalsholat';
const { scrape: nexrayInformationJadwalsholat, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    kota: { required: true }
  }
});

module.exports = { nexrayInformationJadwalsholat };
if (require.main === module) cli();
