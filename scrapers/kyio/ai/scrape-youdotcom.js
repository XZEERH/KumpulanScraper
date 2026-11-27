#!/usr/bin/env node
'use strict';

/**
 * Name : You.com Search & YouChat
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pencarian web, berita, gambar, dan jawaban YouChat lewat backend web You.com (butuh cookie akun yang sudah login via YOU_COOKIE).
 * Note : node scrapers/kyio/ai/scrape-youdotcom.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/youdotcom';
const { scrape: aiYoudotcom, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true, aliases: ['query', 'prompt', 'text'] },
    mode: {},
    count: {},
    page: {},
    mkt: {},
    safeSearch: {},
    debug: {}
  }
});

module.exports = { aiYoudotcom };
if (require.main === module) cli();
