#!/usr/bin/env node
'use strict';

/**
 * Name : ILoveImg Compress
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Kompres ukuran file gambar via URL atau unggah file langsung.
 * Note : node scrapers/kyio/tools/scrape-iloveimg-compress.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/iloveimg-compress';
const { scrape: toolsIloveimgCompress, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { toolsIloveimgCompress };
if (require.main === module) cli();
