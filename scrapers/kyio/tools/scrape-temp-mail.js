#!/usr/bin/env node
'use strict';

/**
 * Name : Temp Mail: Create
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Buat alamat email sementara secara acak. Endpoint ini mengembalikan alamat email dan sid_token yang diperlukan untuk Cek Inbox dan Baca Email.
 * Note : node scrapers/kyio/tools/scrape-temp-mail.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/temp-mail';
const { scrape: toolsTempMail, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { toolsTempMail };
if (require.main === module) cli();
