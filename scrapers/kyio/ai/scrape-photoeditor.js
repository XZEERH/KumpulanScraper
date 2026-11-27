#!/usr/bin/env node
'use strict';

/**
 * Name : Photo Editor AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Edit gambar secara cerdas menggunakan AI berdasarkan instruksi teks (Mendukung URL atau Unggah File langsung).
 * Note : node scrapers/kyio/ai/scrape-photoeditor.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai-editor/photoeditor';
const { scrape: aiPhotoeditor, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    prompt: { required: true },
    url: {},
    file: {},
    resolution: {}
  }
});

module.exports = { aiPhotoeditor };
if (require.main === module) cli();
