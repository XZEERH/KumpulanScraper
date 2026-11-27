#!/usr/bin/env node
'use strict';

/**
 * Name : Alkitab
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Layanan pembacaan Alkitab Terjemahan Baru (TB), BIS, AYT, TL, dan multibahasa lengkap per pasal maupun ayat.
 * Note : node scrapers/kyio/information/scrape-alkitab.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/alkitab';
const { scrape: informationAlkitab, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    passage: {},
    book: {},
    chapter: {},
    verse: {},
    version: {}
  }
});

module.exports = { informationAlkitab };
if (require.main === module) cli();
