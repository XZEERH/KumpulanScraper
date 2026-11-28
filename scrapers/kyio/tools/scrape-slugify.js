#!/usr/bin/env node
'use strict';

/**
 * Name : Slugify String
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ubah teks judul menjadi URL slug yang valid.
 * Note : node scrapers/kyio/tools/scrape-slugify.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/slugify';
const { scrape: toolsSlugify, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true }
  }
});

module.exports = { toolsSlugify };
if (require.main === module) cli();
