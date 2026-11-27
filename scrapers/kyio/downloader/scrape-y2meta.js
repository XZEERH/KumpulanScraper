#!/usr/bin/env node
'use strict';

/**
 * Name : Y2Meta YouTube Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download video MP4 dan audio MP3 YouTube kecepatan tinggi dengan PoW bypass otomatis.
 * Note : node scrapers/kyio/downloader/scrape-y2meta.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/y2meta';
const { scrape: downloaderY2meta, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true },
    format: {},
    quality: {}
  }
});

module.exports = { downloaderY2meta };
if (require.main === module) cli();
