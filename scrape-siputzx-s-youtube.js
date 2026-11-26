#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian YouTube Siputzx
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari video YouTube publik dan mengembalikan metadata, bukan file video.
 * Note : node scrape-siputzx-s-youtube.js --query "Big Buck Bunny Blender Foundation"
 */

const { jsonEndpoint, hasText, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/youtube';
const { scrape: searchYoutube, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { query: { required: true } },
  validateData: (data) => Array.isArray(data) && data.some((item) =>
    hasText(item?.title) && httpsUrl(item.url, ['youtube.com', 'www.youtube.com', 'youtu.be']))
});

module.exports = { searchYoutube };
if (require.main === module) cli();
