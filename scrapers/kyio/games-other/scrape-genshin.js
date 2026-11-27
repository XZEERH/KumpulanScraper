#!/usr/bin/env node
'use strict';

/**
 * Name : Genshin Impact Stalk
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mendapatkan informasi profil dan karakter Genshin Impact berdasarkan UID.
 * Note : node scrapers/kyio/games-other/scrape-genshin.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/stalk/genshin';
const { scrape: gamesOtherGenshin, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    uid: { required: true }
  }
});

module.exports = { gamesOtherGenshin };
if (require.main === module) cli();
