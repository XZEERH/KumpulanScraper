#!/usr/bin/env node
'use strict';

/**
 * Name : Manwhaku Chapter
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ambil daftar gambar halaman chapter dan navigasi reader dari Manwhaku.
 * Note : node scrapers/kyio/movie-anime/scrape-manwhaku-chapter.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/manwhaku/chapter';
const { scrape: movieAnimeManwhakuChapter, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    slug: { required: true }
  }
});

module.exports = { movieAnimeManwhakuChapter };
if (require.main === module) cli();
