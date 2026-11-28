#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kimia
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan lambang rumus senyawa atau unsur kimia acak dari tabel periodik dan ilmu kimia untuk ditebak nama senyawanya.
 * Note : node scrapers/ikhlas/games/scrape-tebakkimia.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakkimia';
const { scrape: ikhlasGamesTebakkimia, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakkimia };
if (require.main === module) cli();
