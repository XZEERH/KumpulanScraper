#!/usr/bin/env node
'use strict';

/**
 * Name : Rejeki Hoki Weton
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Memberikan ramalan rizki, neptu weton, siklus kejayaan hoki, dan hari keberuntungan berdasarkan perhitungan weton Jawa.
 * Note : node scrapers/ikhlas/primbon/scrape-rejeki-hoki-weton.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/rejeki_hoki_weton';
const { scrape: ikhlasPrimbonRejekiHokiWeton, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    tgl: { required: true },
    bln: { required: true },
    thn: { required: true }
  }
});

module.exports = { ikhlasPrimbonRejekiHokiWeton };
if (require.main === module) cli();
