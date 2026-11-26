#!/usr/bin/env node
'use strict';

/**
 * Name : Oploverz Ongoing Metadata
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil judul, info episode, dan rating anime ongoing tanpa tautan unduhan.
 * Note : node scrape-siputzx-anime-oploverz-ongoing.js
 */

const { jsonEndpoint, hasText } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/anime/oploverz-ongoing';
const { scrape: animeOploverzOngoing, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  mapData(data) {
    if (!Array.isArray(data)) return null;
    const rows = data.filter((item) => hasText(item?.title)).map(({ title, episodes, rating }) => ({ title, episodes, rating }));
    return rows.length ? rows : null;
  }
});

module.exports = { animeOploverzOngoing };
if (require.main === module) cli();
