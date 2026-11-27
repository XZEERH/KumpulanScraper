#!/usr/bin/env node
'use strict';

/**
 * Name : Rejeki Hoki Weton
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Ramalan rejeki dan hoki berdasarkan weton kelahiran Jawa
 * Note : node scrapers/nexray/primbon/scrape-rejekihoki-weton.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/rejekihoki-weton';
const { scrape: nexrayPrimbonRejekihokiWeton, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    tanggal: { required: true },
    bulan: { required: true },
    tahun: { required: true }
  }
});

module.exports = { nexrayPrimbonRejekihokiWeton };
if (require.main === module) cli();
