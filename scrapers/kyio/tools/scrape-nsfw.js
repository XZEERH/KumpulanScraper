#!/usr/bin/env node
'use strict';

/**
 * Name : Anti-NSFW / NSFW Image Content Moderation
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Deteksi dan moderasi konten dewasa, pornografi, dan gambar eksplisit secara instan melalui URL, base64, atau upload file.
 * Note : node scrapers/kyio/tools/scrape-nsfw.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/nsfw';
const { scrape: toolsNsfw, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    image: {},
    file: {},
    q: {}
  }
});

module.exports = { toolsNsfw };
if (require.main === module) cli();
