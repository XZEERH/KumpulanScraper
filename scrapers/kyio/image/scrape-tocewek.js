#!/usr/bin/env node
'use strict';

/**
 * Name : To Cewek AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Gender swap to woman (supports URL or direct upload).
 * Access : Kyio Premium
 * Note : node scrapers/kyio/image/scrape-tocewek.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai-editor/tocewek';
const { scrape: imageTocewek, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { imageTocewek };
if (require.main === module) cli();
