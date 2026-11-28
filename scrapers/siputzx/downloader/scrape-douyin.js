#!/usr/bin/env node
'use strict';

/**
 * Name : Douyin / TikTok Downloader
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tautan video dari endpoint Douyin yang juga menerima URL TikTok publik.
 * Note : node scrapers/siputzx/downloader/scrape-douyin.js --url "https://www.tiktok.com/@nasa/video/7699974130153590029"
 */

const { jsonEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/douyin';
const { scrape: downloadDouyin, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: {
      required: true, type: 'https-url',
      hosts: ['douyin.com', 'www.douyin.com', 'v.douyin.com', 'tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
      path: /^\/(?:(?:@[\w.-]+\/)?video\/\d+|(?:t\/)?[\w-]{4,})\/?$/,
      validateUrl: ({ hostname, pathname }) => /^\/(?:@|video\/|t\/)/.test(pathname) || ['v.douyin.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(hostname)
    }
  },
  validateData: (data) => Array.isArray(data?.downloads) && data.downloads.some((item) => httpsUrl(item?.url, ['dl.snapcdn.app']))
});

module.exports = { downloadDouyin };
if (require.main === module) cli();
