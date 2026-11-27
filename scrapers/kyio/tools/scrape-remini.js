#!/usr/bin/env node
'use strict';

/**
 * Name : Remini Image Enhancer
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Enhance and upscale your images using Remini API (Upload image file directly).
 * Access : Kyio Premium
 * Note : node scrapers/kyio/tools/scrape-remini.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/remini';
const { scrape: toolsRemini, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { toolsRemini };
if (require.main === module) cli();
