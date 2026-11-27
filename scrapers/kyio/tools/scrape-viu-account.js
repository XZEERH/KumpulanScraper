#!/usr/bin/env node
'use strict';

/**
 * Name : Viu Account Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate akun Viu Premium secara otomatis atau periksa akun tersimpan berdasarkan device ID.
 * Note : node scrapers/kyio/tools/scrape-viu-account.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/viu-account';
const { scrape: toolsViuAccount, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    device_id: {}
  }
});

module.exports = { toolsViuAccount };
if (require.main === module) cli();
