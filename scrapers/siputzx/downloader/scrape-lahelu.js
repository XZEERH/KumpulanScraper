#!/usr/bin/env node
'use strict';

/**
 * Name : Lahelu Downloader
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tautan media utama dan metadata ringkas posting publik Lahelu.
 * Note : node scrapers/siputzx/downloader/scrape-lahelu.js --url "https://lahelu.com/post/PhuP6LKpL"
 */

const { jsonEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/lahelu';
const { scrape: downloadLahelu, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: { required: true, type: 'https-url', hosts: ['lahelu.com', 'www.lahelu.com'], path: /^\/post\/P[a-zA-Z\d]+\/?$/ }
  },
  mapData(data) {
    if (data?.status !== true || data.sensitive !== false || !httpsUrl(data.media, ['cache.lahelu.com'])) return null;
    return { postId: data.post_id, title: data.title, media: data.media, createdAt: data.create_time };
  }
});

module.exports = { downloadLahelu };
if (require.main === module) cli();
