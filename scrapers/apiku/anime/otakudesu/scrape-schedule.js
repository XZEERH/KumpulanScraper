#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal Rilis Otakudesu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil daftar judul yang dijadwalkan per hari, tanpa tautan siaran.
 * Note : node scrapers/apiku/anime/otakudesu/scrape-schedule.js
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/otakudesu/schedule';
const { scrape: otakudesuSchedule, cli } = apikuEndpoint(ENDPOINT, {
  mapData: ({ data }) => Array.isArray(data) ? data.filter((row) => hasText(row?.day) && Array.isArray(row.animeList)).map((row) => ({
    day: row.day, titles: row.animeList.filter((anime) => hasText(anime?.title) && hasText(anime.slug)).map(({ title, slug }) => ({ title, slug }))
  })) : null,
  validateData: (data) => data.some(({ titles }) => titles.length > 0)
});

module.exports = { otakudesuSchedule };
if (require.main === module) cli();
