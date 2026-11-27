#!/usr/bin/env node
'use strict';

/**
 * Name : Temp Mail: Inbox
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cek daftar pesan masuk dari email sementara Anda. Wajib memasukkan parameter sid yang didapatkan dari endpoint Create.
 * Note : node scrapers/kyio/tools/scrape-temp-mail-inbox.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/temp-mail-inbox';
const { scrape: toolsTempMailInbox, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    sid: { required: true }
  }
});

module.exports = { toolsTempMailInbox };
if (require.main === module) cli();
