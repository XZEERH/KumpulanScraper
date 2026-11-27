#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Game
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan potongan gambar visual game PC, konsol, maupun mobile untuk ditebak judul permainan resminya.
 * Note : node scrapers/ikhlas/games/scrape-tebakgame.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakgame';
const { scrape: ikhlasGamesTebakgame, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakgame };
if (require.main === module) cli();
