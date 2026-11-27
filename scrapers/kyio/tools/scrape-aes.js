#!/usr/bin/env node
'use strict';

/**
 * Name : AES Encrypt / Decrypt
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Enkripsi dan dekripsi teks dengan standar militer AES-256-CBC menggunakan custom key.
 * Note : node scrapers/kyio/tools/scrape-aes.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/aes';
const { scrape: toolsAes, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    text: { required: true },
    key: { required: true }
  }
});

module.exports = { toolsAes };
if (require.main === module) cli();
