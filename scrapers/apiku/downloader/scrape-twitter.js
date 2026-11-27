#!/usr/bin/env node
'use strict';

/**
 * Name : Media X / Twitter via ApiKu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil tautan media CDN resmi dari unggahan X/Twitter publik dan berizin.
 * Note : node scrapers/apiku/downloader/scrape-twitter.js --url "https://twitter.com/NASAPersevere/status/1363929492138254340"
 */

const { apikuEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/twitter';
const { scrape: twitter, cli } = apikuEndpoint(ENDPOINT, {
  cache: false,
  params: { url: {
    required: true, type: 'https-url', hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
    path: /^\/[a-z\d_]{1,15}\/status\/\d+\/?$/i
  } },
  mapData: (payload, { url }) => {
    if (!Array.isArray(payload.medias)) return null;
    const media = payload.medias.flatMap((item) => {
      const link = httpsUrl(item?.url, ['video.twimg.com', 'pbs.twimg.com']);
      if (!link || !/^(?:mp4|jpe?g|png|webp)$/i.test(item.extension)) return [];
      return [{ url: link.href, type: item.type, quality: item.quality ?? null, extension: item.extension }];
    });
    return media.length ? { url, title: payload.title ?? null, media } : null;
  }
});

module.exports = { twitter };
if (require.main === module) cli();
