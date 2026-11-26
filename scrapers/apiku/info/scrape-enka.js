#!/usr/bin/env node
'use strict';

/**
 * Name : Enka Showcase Publik
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan ringkasan profil permainan yang dipublikasikan lewat Enka Network.
 * Note : node scrapers/apiku/info/scrape-enka.js --uid 1810139094
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/enka/profile/{uid}';
const { scrape: enkaProfile, cli } = apikuEndpoint(ENDPOINT, {
  params: { uid: { required: true, pattern: /^[1-9]\d{8,9}$/ } },
  mapData: (payload, { uid }) => {
    const data = payload.data ?? payload;
    if (String(data?.uid) !== uid || !hasText(data.nickname) || !Number.isSafeInteger(data.level)) return null;
    return {
      uid, nickname: data.nickname, level: data.level, worldLevel: data.worldLevel ?? null,
      achievements: data.finishAchievementNum ?? null,
      showcaseCount: Array.isArray(data.showAvatarInfoList) ? data.showAvatarInfoList.length : 0
    };
  }
});

module.exports = { enkaProfile };
if (require.main === module) cli();
