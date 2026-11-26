#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil metadata dan tautan video atau foto dari unggahan publik TikTok.
 * Note : node scrape-siputzx-d-tiktok.js --url "https://www.tiktok.com/@nasa/video/7699974130153590029"
 */

const { jsonEndpoint, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/tiktok';
const { scrape: downloadTikTok, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: {
      required: true, type: 'https-url', hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
      path: /^\/(?:@[\w.-]+\/(?:video|photo)\/\d+|(?:t\/)?[\w-]{4,})\/?$/,
      validateUrl: ({ hostname, pathname }) => /^\/(?:@|t\/)/.test(pathname) || ['vm.tiktok.com', 'vt.tiktok.com'].includes(hostname)
    }
  },
  validateData: (data) => data?.success === true && (
    ['watermark', 'sd', 'hd'].some((quality) => httpsUrl(data.video?.[quality]?.url, ['fastdl.muscdn.app'])) ||
    (Array.isArray(data.images) && data.images.some((image) => httpsUrl(typeof image === 'string' ? image : image?.url, ['fastdl.muscdn.app'])))
  )
});

module.exports = { downloadTikTok };
if (require.main === module) cli();
