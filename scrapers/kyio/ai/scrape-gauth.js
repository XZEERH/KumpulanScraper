#!/usr/bin/env node
'use strict';

/**
 * Name : Gauth AI Math & Science Solver
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pemecah soal matematika, sains, aljabar, dan kalkulus otomatis menggunakan Gauth AI dengan penjelasan langkah demi langkah dalam teks bersih.
 * Note : node scrapers/kyio/ai/scrape-gauth.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gauth';
const { scrape: aiGauth, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    q: {},
    url: {},
    file: {},
    image: {}
  }
});

module.exports = { aiGauth };
if (require.main === module) cli();
