#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Stalk
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Stalk akun Instagram publik secara lengkap: data profil (bio, followers, following, centang biru, avatar HD) dan daftar 12 postingan / reels terbaru.
 * Note : node scrapers/kyio/information/scrape-igstalk.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/igstalk';
const { scrape: informationIgstalk, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    username: { required: true }
  }
});

module.exports = { informationIgstalk };
if (require.main === module) cli();
