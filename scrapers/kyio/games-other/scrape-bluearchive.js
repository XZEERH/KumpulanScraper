#!/usr/bin/env node
'use strict';

/**
 * Name : Blue Archive Wiki
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get Blue Archive character details or list all characters.
 * Note : node scrapers/kyio/games-other/scrape-bluearchive.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/bluearchive';
const { scrape: gamesOtherBluearchive, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { gamesOtherBluearchive };
if (require.main === module) cli();
