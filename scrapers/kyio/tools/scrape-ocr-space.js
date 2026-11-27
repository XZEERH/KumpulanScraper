#!/usr/bin/env node
'use strict';

/**
 * Name : OCR Text Recognition
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Extract printed text from images in multiple languages using OCR Space cloud engine.
 * Note : node scrapers/kyio/tools/scrape-ocr-space.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/ocr-space';
const { scrape: toolsOcrSpace, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    lang: {},
    file: {}
  }
});

module.exports = { toolsOcrSpace };
if (require.main === module) cli();
