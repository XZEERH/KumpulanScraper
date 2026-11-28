#!/usr/bin/env node
'use strict';

/**
 * Name : ImgBB Uploader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Upload images directly to ImgBB guest storage.
 * Note : node scrapers/kyio/tools/scrape-imgbb.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/imgbb';
const { scrape: toolsImgbb, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    file: { required: true }
  }
});

module.exports = { toolsImgbb };
if (require.main === module) cli();
