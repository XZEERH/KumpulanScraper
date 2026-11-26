#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Downloader via Ummy
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tautan media unggahan Instagram publik via Ummy.
 * Note : node scrapers/siputzx/downloader/scrape-siputzx-d-ummy.js --url "https://www.instagram.com/reel/C7g8V7lKDLw/"
 */

const { jsonEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/ummy';
const { scrape: downloadUmmy, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: {
      required: true, type: 'https-url', hosts: ['instagram.com', 'www.instagram.com', 'm.instagram.com'],
      path: /^\/(?:p|reel|reels|tv)\/[\w-]+\/?$/
    }
  },
  validateData: (data) => Array.isArray(data?.url) && data.url.some((item) => httpsUrl(item?.url, ['media.ummy.net']))
});

module.exports = { downloadUmmy };
if (require.main === module) cli();
