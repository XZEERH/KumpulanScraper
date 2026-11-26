#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Metadata Anime Oploverz
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari metadata judul anime tanpa tautan streaming atau download.
 * Note : node scrapers/siputzx/anime/scrape-siputzx-anime-oploverz-search.js --query "One Piece"
 */

const { jsonEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/anime/oploverz-search';
const { scrape: animeOploverzSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { query: { required: true } },
  mapData(data) {
    if (!Array.isArray(data)) return null;
    const rows = data.filter((item) => hasText(item?.title)).map(({ title, episodes, rating }) => ({ title, episodes, rating }));
    return rows.length ? rows : null;
  }
});

module.exports = { animeOploverzSearch };
if (require.main === module) cli();
