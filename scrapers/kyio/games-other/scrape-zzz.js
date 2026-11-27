#!/usr/bin/env node
'use strict';

/**
 * Name : ZZZ Stalk
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mendapatkan informasi profil dan agent Zenless Zone Zero (ZZZ) berdasarkan UID.
 * Note : node scrapers/kyio/games-other/scrape-zzz.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/stalk/zzz';
const { scrape: gamesOtherZzz, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    uid: { required: true }
  }
});

module.exports = { gamesOtherZzz };
if (require.main === module) cli();
