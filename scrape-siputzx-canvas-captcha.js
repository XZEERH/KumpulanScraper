#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas CAPTCHA Image
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Merender gambar CAPTCHA untuk demo, bukan menyelesaikan CAPTCHA atau memverifikasi pengguna.
 * Note : node scrape-siputzx-canvas-captcha.js --background "https://placehold.co/400x300.png" --captchaKey DEMO12
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/captcha';
const { scrape: canvasCaptcha, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    background: { required: true, type: 'image-url' }, captchaKey: { pattern: /^[A-Za-z\d]{1,12}$/ },
    border: { pattern: /^#[\da-f]{6}$/i }, overlayOpacity: { type: 'number', min: 0, max: 1 }
  }
});

module.exports = { canvasCaptcha };
if (require.main === module) cli();
