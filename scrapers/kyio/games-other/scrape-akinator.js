#!/usr/bin/env node
'use strict';

/**
 * Name : Akinator The Web Genie
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Tebak karakter, hewan, atau benda nyata maupun fiksi menggunakan AI Akinator secara interaktif.
 * Note : node scrapers/kyio/games-other/scrape-akinator.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/game/akinator';
const { scrape: gamesOtherAkinator, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    session: {},
    answer: {},
    action: {},
    theme: {}
  }
});

module.exports = { gamesOtherAkinator };
if (require.main === module) cli();
