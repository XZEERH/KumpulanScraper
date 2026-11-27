#!/usr/bin/env node
'use strict';

/**
 * Name : Photo Editor AI v2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Edit gambar atau hapus watermark/teks secara cerdas menggunakan AI Flux Kontext (Mendukung URL atau Unggah File langsung).
 * Note : node scrapers/kyio/ai/scrape-photoeditor-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai-editor/photoeditor-v2';
const { scrape: aiPhotoeditorV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    prompt: {},
    url: {},
    file: {},
    ratio: {}
  }
});

module.exports = { aiPhotoeditorV2 };
if (require.main === module) cli();
