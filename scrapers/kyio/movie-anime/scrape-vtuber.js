#!/usr/bin/env node
'use strict';

/**
 * Name : VTuber Directory & News
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Direktori komprehensif 1080+ Virtual YouTuber, pencarian profil, jadwal debut, direktori agensi, dan berita terkini.
 * Note : node scrapers/kyio/movie-anime/scrape-vtuber.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/vtuber';
const { scrape: movieAnimeVtuber, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    q: {},
    id: {},
    slug: {},
    page: {},
    pageSize: {},
    year: {},
    month: {},
    gender: {},
    agencyType: {},
    sort: {},
    category: {},
    tag: {},
    url: {}
  }
});

module.exports = { movieAnimeVtuber };
if (require.main === module) cli();
