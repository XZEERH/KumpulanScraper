#!/usr/bin/env node
'use strict';

/**
 * Name : Voratoon Manga
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ambil update komik terbaru, detail sinopsis, dan gambar chapter dari Voratoon (Komikcast Alternative).
 * Note : node scrapers/kyio/movie-anime/scrape-voratoon.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/voratoon';
const { scrape: movieAnimeVoratoon, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    slug: {},
    ch: {},
    page: {}
  }
});

module.exports = { movieAnimeVoratoon };
if (require.main === module) cli();
