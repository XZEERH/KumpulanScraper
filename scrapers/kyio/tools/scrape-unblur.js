#!/usr/bin/env node
'use strict';

/**
 * Name : Unblur & Upscale Image AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Tingkatkan kualitas, tajamkan, dan perbesar gambar menggunakan AI.
 * Access : Kyio Premium
 * Note : node scrapers/kyio/tools/scrape-unblur.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/unblur';
const { scrape: toolsUnblur, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    file: { required: true },
    quality: {},
    model: {}
  }
});

module.exports = { toolsUnblur };
if (require.main === module) cli();
