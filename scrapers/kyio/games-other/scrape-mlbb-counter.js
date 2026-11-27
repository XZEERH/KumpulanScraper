#!/usr/bin/env node
'use strict';

/**
 * Name : MLBB Counter Finder
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari hero counter, hero yang dicounter, vote, role, gambar hero, dan alasan counter berdasarkan data komunitas Mobile Legends.
 * Note : node scrapers/kyio/games-other/scrape-mlbb-counter.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/games/mlbb-counter';
const { scrape: gamesOtherMlbbCounter, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    hero: { required: true }
  }
});

module.exports = { gamesOtherMlbbCounter };
if (require.main === module) cli();
