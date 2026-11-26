#!/usr/bin/env node
'use strict';

/**
 * Name : Profil Publik Pinterest
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil nama, avatar, tautan, serta statistik publik profil Pinterest.
 * Note : node scrape-siputzx-stalk-pinterest.js --q nasa
 */

const { jsonEndpoint, hasText, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/stalk/pinterest';
const { scrape: stalkPinterest, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { q: { required: true, pattern: /^@?[a-z\d_]{1,30}$/i, normalize: (value) => value.replace(/^@/, '') } },
  mapData(data) {
    if (!hasText(data?.username) || !httpsUrl(data.profile_url, ['pinterest.com', 'www.pinterest.com'])) return null;
    return {
      username: data.username, name: data.full_name, bio: data.bio, url: data.profile_url,
      avatar: data.image?.large, pins: data.stats?.pins, boards: data.stats?.boards,
      followers: data.stats?.followers, following: data.stats?.following
    };
  }
});

module.exports = { stalkPinterest };
if (require.main === module) cli();
