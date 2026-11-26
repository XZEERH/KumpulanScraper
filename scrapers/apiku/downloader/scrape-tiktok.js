#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Media via ApiKu
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil tautan video ber-watermark dari unggahan TikTok publik dan berizin.
 * Note : node scrapers/apiku/downloader/scrape-tiktok.js --url "https://www.tiktok.com/@nasa/video/7699974130153590029"
 */

const { apikuEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tiktok';
const { scrape: tiktok, cli } = apikuEndpoint(ENDPOINT, {
  cache: false,
  params: {
    url: { required: true, type: 'https-url', hosts: ['www.tiktok.com', 'tiktok.com', 'm.tiktok.com'], path: /^\/@[\w.-]+\/video\/\d+\/?$/ }
  },
  mapData: (payload, { url }) => {
    const video = httpsUrl(payload.watermarkUrl);
    return video && /^[\w-]+\.tiktokcdn(?:-us|-eu)?\.com$/.test(video.hostname)
      ? { url, title: payload.title ?? null, videoUrl: video.href, duration: payload.duration ?? null } : null;
  }
});

module.exports = { tiktok };
if (require.main === module) cli();
