#!/usr/bin/env node
'use strict';

/**
 * Name : Markdown to HTML
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ubah teks Markdown menjadi elemen HTML statis.
 * Note : node scrapers/kyio/tools/scrape-markdown.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/markdown';
const { scrape: toolsMarkdown, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true }
  }
});

module.exports = { toolsMarkdown };
if (require.main === module) cli();
