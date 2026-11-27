#!/usr/bin/env node
'use strict';

/**
 * Name : YTConvert
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Unduh video (MP4) atau audio (MP3) dari YouTube dengan berbagai pilihan kualitas. Mendukung resolusi tinggi hingga 1080p.
 * Note : node scrapers/kyio/downloader/scrape-ytconvert.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/ytconvert';
const { scrape: downloaderYtconvert, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    type: { required: true },
    quality: {}
  }
});

module.exports = { downloaderYtconvert };
if (require.main === module) cli();
