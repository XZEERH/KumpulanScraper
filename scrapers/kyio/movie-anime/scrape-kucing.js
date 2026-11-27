#!/usr/bin/env node
'use strict';

/**
 * Name : Kucing
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search, fetch latest updates, and get streaming & download links (Kucingpeduli engine).
 * Access : Kyio Premium
 * Note : node scrapers/kyio/movie-anime/scrape-kucing.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/kucing';
const { scrape: movieAnimeKucing, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    q: {},
    id: {},
    slug: {},
    page: {}
  }
});

module.exports = { movieAnimeKucing };
if (require.main === module) cli();
