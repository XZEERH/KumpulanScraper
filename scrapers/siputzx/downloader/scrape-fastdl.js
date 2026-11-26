#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Downloader via FastDL
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tautan media unggahan Instagram publik via FastDL.
 * Note : node scrapers/siputzx/downloader/scrape-fastdl.js --url "https://www.instagram.com/reel/C7g8V7lKDLw/"
 */

const { jsonEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/fastdl';
const { scrape: downloadFastDL, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: {
      required: true, type: 'https-url', hosts: ['instagram.com', 'www.instagram.com', 'm.instagram.com'],
      path: /^\/(?:p|reel|reels|tv)\/[\w-]+\/?$/
    }
  },
  validateData: (data) => Array.isArray(data?.media) && data.media.some((item) => httpsUrl(item?.url, ['media.fastdl.app']))
});

module.exports = { downloadFastDL };
if (require.main === module) cli();
