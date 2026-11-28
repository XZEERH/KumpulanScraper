#!/usr/bin/env node
'use strict';

/**
 * Name : Nomor Hoki
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Cek keberuntungan nomor telepon berdasarkan metode Bagua Shuzi
 * Note : node scrapers/nexray/primbon/scrape-nomerhoki.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/nomerhoki';
const { scrape: nexrayPrimbonNomerhoki, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    phone_number: { required: true }
  }
});

module.exports = { nexrayPrimbonNomerhoki };
if (require.main === module) cli();
