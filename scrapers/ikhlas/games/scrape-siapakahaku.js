#!/usr/bin/env node
'use strict';

/**
 * Name : Siapakah Aku
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan teka-teki orang pertama ("Aku adalah...") yang menceritakan sifat dan karakteristik unik suatu benda, profesi, atau fenomena alam.
 * Note : node scrapers/ikhlas/games/scrape-siapakahaku.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/siapakahaku';
const { scrape: ikhlasGamesSiapakahaku, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesSiapakahaku };
if (require.main === module) cli();
