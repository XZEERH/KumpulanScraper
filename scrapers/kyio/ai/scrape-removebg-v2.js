#!/usr/bin/env node
'use strict';

/**
 * Name : Remove Background AI V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Hapus background gambar menggunakan Slazzer Engine (Mendukung URL atau Unggah File).
 * Note : node scrapers/kyio/ai/scrape-removebg-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/removebg-v2';
const { scrape: aiRemovebgV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { aiRemovebgV2 };
if (require.main === module) cli();
