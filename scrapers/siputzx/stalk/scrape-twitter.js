#!/usr/bin/env node
'use strict';

/**
 * Name : Profil Publik X / Twitter
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menampilkan ringkasan profil publik X dan jumlah pengikut.
 * Note : node scrapers/siputzx/stalk/scrape-twitter.js --user NASA
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/stalk/twitter';
const username = /^[a-z\d_]{1,15}$/i;
const { scrape: stalkTwitter, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { user: { required: true, pattern: /^@?[a-z\d_]{1,15}$/i, normalize: (value) => value.replace(/^@/, '') } },
  mapData(data) {
    if (typeof data?.username !== 'string' || !username.test(data.username) || data.protected === true || data.private === true) return null;
    return {
      username: data.username, name: data.name, bio: data.description, avatar: data.profile?.image,
      url: `https://x.com/${data.username}`, verified: data.verified === true,
      followers: data.stats?.followers, following: data.stats?.following, posts: data.stats?.tweets
    };
  }
});

module.exports = { stalkTwitter };
if (require.main === module) cli();
