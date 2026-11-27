#!/usr/bin/env node
'use strict';

/**
 * Name : Temp Mail: Read
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Baca isi penuh dari email masuk. Membutuhkan parameter sid dan id pesan (didapatkan dari daftar Inbox).
 * Note : node scrapers/kyio/tools/scrape-temp-mail-read.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/temp-mail-read';
const { scrape: toolsTempMailRead, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    sid: { required: true },
    id: { required: true }
  }
});

module.exports = { toolsTempMailRead };
if (require.main === module) cli();
