#!/usr/bin/env node
'use strict';

/**
 * Name : Profil Publik TikTok Siputzx
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil ringkasan profil dan statistik TikTok; akun privat ditolak.
 * Note : node scrapers/siputzx/stalk/scrape-siputzx-stalk-tiktok.js --username nasa
 */

const { jsonEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/stalk/tiktok';
const { scrape: stalkTikTok, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { username: { required: true, pattern: /^@?[a-z\d_.]{1,24}$/i, normalize: (value) => value.replace(/^@/, '') } },
  mapData(data) {
    if (data?.found !== true || data.user?.privateAccount !== false || !hasText(data.handle) ||
      !httpsUrl(data.url, ['tiktok.com', 'www.tiktok.com'])) return null;
    return {
      username: data.handle, name: data.user.nickname, bio: data.user.signature, avatar: data.user.avatar, url: data.url,
      verified: data.user.verified === true, followers: data.stats?.followers, following: data.stats?.following,
      likes: data.stats?.likes, videos: data.stats?.videos
    };
  }
});

module.exports = { stalkTikTok };
if (require.main === module) cli();
