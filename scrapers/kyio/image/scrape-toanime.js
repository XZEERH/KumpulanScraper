#!/usr/bin/env node
'use strict';

/**
 * Name : To Anime AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Convert photo to anime style (supports URL or direct upload).
 * Note : node scrapers/kyio/image/scrape-toanime.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai-editor/toanime';
const { scrape: imageToanime, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { imageToanime };
if (require.main === module) cli();
