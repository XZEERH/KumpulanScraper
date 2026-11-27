#!/usr/bin/env node
'use strict';

/**
 * Name : To Ghibli AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Transform to Ghibli style (supports URL or direct upload).
 * Access : Kyio Premium
 * Note : node scrapers/kyio/image/scrape-toghibli.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai-editor/toghibli';
const { scrape: imageToghibli, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { imageToghibli };
if (require.main === module) cli();
