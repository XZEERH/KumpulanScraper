#!/usr/bin/env node
'use strict';

/**
 * Name : HSR Stalk
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mendapatkan informasi profil dan karakter Honkai: Star Rail (HSR) berdasarkan UID.
 * Note : node scrapers/kyio/games-other/scrape-hsr.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/stalk/hsr';
const { scrape: gamesOtherHsr, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    uid: { required: true }
  }
});

module.exports = { gamesOtherHsr };
if (require.main === module) cli();
