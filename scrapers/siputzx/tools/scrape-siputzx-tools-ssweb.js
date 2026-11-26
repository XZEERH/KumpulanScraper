#!/usr/bin/env node
'use strict';

/**
 * Name : Screenshot Halaman Demo
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil screenshot halaman utama domain demo publik yang diizinkan, bukan URL sembarang.
 * Note : node scrapers/siputzx/tools/scrape-siputzx-tools-ssweb.js --url "https://example.com/" --device desktop --theme light
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/tools/ssweb';
const { scrape: toolsScreenshot, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    url: { required: true, type: 'https-url', hosts: ['example.com', 'example.net', 'example.org'], path: /^\/$/ },
    device: { choices: ['desktop', 'mobile', 'tablet'] }, theme: { choices: ['light', 'dark'] }, fullPage: { choices: ['true', 'false'] }
  }
});

module.exports = { toolsScreenshot };
if (require.main === module) cli();
