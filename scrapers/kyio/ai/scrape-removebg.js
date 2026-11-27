#!/usr/bin/env node
'use strict';

/**
 * Name : Remove Background AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Hapus background gambar secara otomatis dengan AI (Mendukung URL atau Unggah File).
 * Note : node scrapers/kyio/ai/scrape-removebg.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/removebg';
const { scrape: aiRemovebg, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { aiRemovebg };
if (require.main === module) cli();
