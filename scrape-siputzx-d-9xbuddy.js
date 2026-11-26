#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader via 9xbuddy
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tautan video langsung dari format YouTube yang didukung 9xbuddy.
 * Note : node scrape-siputzx-d-9xbuddy.js --url "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
 */

const { jsonEndpoint, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/9xbuddy';
const { scrape: download9xBuddy, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, timeout: 35000, cache: false,
  params: {
    url: {
      required: true, type: 'https-url', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'], queryKeys: ['v'],
      validateUrl: ({ hostname, pathname, searchParams }) => {
        if (hostname === 'youtu.be') return /^\/[\w-]{11}\/?$/.test(pathname);
        if (/^\/shorts\/[\w-]{11}\/?$/.test(pathname)) return true;
        const ids = searchParams.getAll('v');
        return pathname === '/watch' && ids.length === 1 && /^[\w-]{11}$/.test(ids[0]);
      }
    }
  },
  mapData(data) {
    if (data?.ok !== true || !Array.isArray(data.formats)) return null;
    const formats = data.formats.filter((item) => {
      if (item?.external !== false || item.type !== 'video') return false;
      const link = httpsUrl(item.url);
      return link && /^[\w-]+\.googlevideo\.com$/.test(link.hostname) && link.pathname === '/videoplayback';
    }).map(({ ext, quality, size, url }) => ({ ext, quality, size, url }));
    return formats.length ? { title: data.title, duration: data.duration, formats } : null;
  }
});

module.exports = { download9xBuddy };
if (require.main === module) cli();
