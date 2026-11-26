#!/usr/bin/env node
'use strict';

/**
 * Name : Posting Acak Lahelu
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil posting acak yang tidak ditandai sensitif, tanpa data akun mentah.
 * Note : node scrape-siputzx-r-lahelu.js
 */

const { jsonEndpoint, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/r/lahelu';
const { scrape: randomLahelu, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, cache: false,
  mapData(data) {
    if (!Array.isArray(data)) return null;
    const posts = data.filter((item) => item?.isSensitive === false && typeof item.postId === 'string' &&
      /^P\w{1,30}$/.test(item.postId) && httpsUrl(item.media, ['cache.lahelu.com'])).map((item) => ({
      id: item.postId, title: item.title, url: `https://lahelu.com/post/${item.postId}`, media: item.media, createdAt: item.createTime
    }));
    return posts.length ? posts : null;
  }
});

module.exports = { randomLahelu };
if (require.main === module) cli();
