#!/usr/bin/env node
'use strict';

/**
 * Name : AI Background Remover V3
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Hapus background gambar dengan deteksi tepi presisi dan transparansi alpha.
 * Note : node scrapers/kyio/tools/scrape-removebg-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/removebg-v3';
const { scrape: toolsRemovebgV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    mode: {},
    json: {}
  }
});

module.exports = { toolsRemovebgV3 };
if (require.main === module) cli();
