#!/usr/bin/env node
'use strict';

/**
 * Name : Dapodik
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari sekolah (q, min. 5 karakter) lalu ambil profil detail via NPSN (action=detail&id=NPSN) langsung dari DAPODIK.
 * Note : node scrapers/kyio/information/scrape-dapodik.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/dapodik';
const { scrape: informationDapodik, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    action: {},
    id: {}
  }
});

module.exports = { informationDapodik };
if (require.main === module) cli();
