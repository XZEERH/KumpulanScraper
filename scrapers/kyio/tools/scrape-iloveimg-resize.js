#!/usr/bin/env node
'use strict';

/**
 * Name : ILoveImg Resize
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ubah ukuran dimensi gambar via URL atau unggah file langsung.
 * Note : node scrapers/kyio/tools/scrape-iloveimg-resize.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/iloveimg-resize';
const { scrape: toolsIloveimgResize, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    width: { required: true },
    height: { required: true }
  }
});

module.exports = { toolsIloveimgResize };
if (require.main === module) cli();
