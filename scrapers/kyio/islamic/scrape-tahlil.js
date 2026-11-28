#!/usr/bin/env node
'use strict';

/**
 * Name : Tahlil & Yasin
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan susunan bacaan Tahlil lengkap beserta teks Arab, latin, dan terjemahan.
 * Note : node scrapers/kyio/islamic/scrape-tahlil.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/islamic/tahlil';
const { scrape: islamicTahlil, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { islamicTahlil };
if (require.main === module) cli();
