#!/usr/bin/env node
'use strict';

/**
 * Name : Cak Lontong
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan pertanyaan teka-teki komedi dengan logika tak terduga (twist) lengkap dengan penjelasan humoris ala Cak Lontong.
 * Note : node scrapers/ikhlas/games/scrape-caklontong.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/caklontong';
const { scrape: ikhlasGamesCaklontong, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesCaklontong };
if (require.main === module) cli();
