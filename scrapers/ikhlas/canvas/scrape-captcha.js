#!/usr/bin/env node
'use strict';

/**
 * Name : Captcha Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar captcha interaktif dengan latar kustom, teks captcha, warna border, dan tingkat opasitas overlay.
 * Note : node scrapers/ikhlas/canvas/scrape-captcha.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/captcha';
const { scrape: ikhlasCanvasCaptcha, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    background: { required: true, url: true },
    captchaKey: {},
    border: {},
    overlayOpacity: {}
  }
});

module.exports = { ikhlasCanvasCaptcha };
if (require.main === module) cli();
