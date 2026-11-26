#!/usr/bin/env node
'use strict';

/**
 * Name : Profil Publik GitHub
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menampilkan profil publik GitHub dan jumlah repositori serta pengikut.
 * Note : node scrape-siputzx-stalk-github.js --user nodejs
 */

const { jsonEndpoint, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/stalk/github';
const username = /^@?[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const { scrape: stalkGithub, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { user: { required: true, pattern: username, normalize: (value) => value.replace(/^@/, '') } },
  mapData(data) {
    if (typeof data?.username !== 'string' || !username.test(data.username) || !httpsUrl(data.url, ['github.com'])) return null;
    return {
      username: data.username, name: data.nickname, bio: data.bio, url: data.url, avatar: data.profile_pic,
      type: data.type, repositories: data.public_repo, followers: data.followers, following: data.following
    };
  }
});

module.exports = { stalkGithub };
if (require.main === module) cli();
