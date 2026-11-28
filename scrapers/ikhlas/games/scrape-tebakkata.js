#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kata
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan petunjuk definisi, ciri-ciri objek, atau sinonim untuk ditebak kata yang dimaksud.
 * Note : node scrapers/ikhlas/games/scrape-tebakkata.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakkata';
const { scrape: ikhlasGamesTebakkata, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakkata };
if (require.main === module) cli();
