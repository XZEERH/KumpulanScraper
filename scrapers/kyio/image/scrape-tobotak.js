#!/usr/bin/env node
'use strict';

/**
 * Name : To Botak AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Make anyone bald (supports URL or direct upload).
 * Access : Kyio Premium
 * Note : node scrapers/kyio/image/scrape-tobotak.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai-editor/tobotak';
const { scrape: imageTobotak, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { imageTobotak };
if (require.main === module) cli();
