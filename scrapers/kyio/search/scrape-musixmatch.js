#!/usr/bin/env node
'use strict';

/**
 * Name : Musixmatch Lyrics & Synced LRC
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari lagu, lirik lengkap, lirik sinkron (LRC), richsync, dan top chart Musixmatch.
 * Note : node scrapers/kyio/search/scrape-musixmatch.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/musixmatch';
const { scrape: searchMusixmatch, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { aliases: ['query', 'track', 'title'] },
    artist: {},
    mode: {},
    lyrics: {},
    language: {},
    preferOriginal: {},
    richsync: {},
    trackId: {},
    country: {},
    limit: {}
  }
});

module.exports = { searchMusixmatch };
if (require.main === module) cli();
