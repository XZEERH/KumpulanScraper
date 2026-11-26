#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader V2
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media TikTok publik dari endpoint V2.
 * Note : node scrape-siputzx-d-tiktok-v2.js --url "https://www.tiktok.com/@nasa/video/7699974130153590029"
 */

const { jsonEndpoint, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/tiktok/v2';
const { scrape: downloadTikTokV2, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: {
      required: true, type: 'https-url', hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
      path: /^\/(?:@[\w.-]+\/(?:video|photo)\/\d+|(?:t\/)?[\w-]{4,})\/?$/,
      validateUrl: ({ hostname, pathname }) => /^\/(?:@|t\/)/.test(pathname) || ['vm.tiktok.com', 'vt.tiktok.com'].includes(hostname)
    }
  },
  validateData: (data) => [data?.no_watermark_link, data?.no_watermark_link_hd, data?.watermark_link,
    ...(Array.isArray(data?.slides) ? data.slides : [])]
    .some((link) => httpsUrl(link, ['tikcdn.io']))
});

module.exports = { downloadTikTokV2 };
if (require.main === module) cli();
