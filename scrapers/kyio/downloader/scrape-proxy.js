#!/usr/bin/env node
'use strict';

/**
 * Name : Media Proxy
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mengunduh berkas media (googlevideo dan iamworker) lewat server KyioAPI agar tidak terikat IP pengambil.
 * Note : node scrapers/kyio/downloader/scrape-proxy.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/proxy';
const { scrape: downloaderProxy, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderProxy };
if (require.main === module) cli();
