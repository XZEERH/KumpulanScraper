#!/usr/bin/env node
'use strict';

/**
 * Name : Bing Image Creator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Endpoint pembuatan gambar AI resmi bertenaga DALL-E 3 dari Bing Image Creator dengan output gambar beresolusi tinggi.
 * Note : node scrapers/kyio/ai/scrape-bing-image.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/bing-image';
const { scrape: aiBingImage, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    prompt: { required: true },
    cookie_u: {}
  }
});

module.exports = { aiBingImage };
if (require.main === module) cli();
