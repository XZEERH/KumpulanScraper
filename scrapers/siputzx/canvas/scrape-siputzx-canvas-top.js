#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Top Leaderboard
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat gambar leaderboard dari maksimal 10 data peringkat dan avatar publik.
 * Note : node scrapers/siputzx/canvas/scrape-siputzx-canvas-top.js --background "https://placehold.co/400x300.png" --usersData '<JSON array berisi top, avatar, tag, score>'
 */

const { imageEndpoint, publicImageUrl, integer, text } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/top';

function normalizeUsers(input) {
  let users;
  try { users = JSON.parse(input); }
  catch { throw new Error('usersData harus berupa array JSON'); }
  if (!Array.isArray(users) || !users.length || users.length > 10) throw new Error('usersData harus berisi 1-10 peringkat');
  return JSON.stringify(users.map((item) => {
    const avatar = publicImageUrl(item?.avatar);
    if (!avatar) throw new Error('Avatar usersData harus URL gambar publik yang didukung');
    avatar.search = '';
    avatar.hash = '';
    return {
      top: integer(item.top, NaN, 1, 10000, 'top'), avatar: avatar.href,
      tag: text(item.tag, 'tag', 80), score: integer(item.score, NaN, 0, 100000000, 'score')
    };
  }));
}

const { scrape: canvasTop, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    background: { required: true, type: 'image-url' }, usersData: { required: true, maxLength: 5000, normalize: normalizeUsers },
    scoreMessage: { maxLength: 80 }, opacity: { type: 'number', min: 0, max: 1 }
  }
});

module.exports = { canvasTop };
if (require.main === module) cli();
