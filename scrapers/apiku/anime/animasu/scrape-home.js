#!/usr/bin/env node
'use strict';

/**
 * Name : Katalog Animasu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil metadata judul ongoing dan baru diperbarui, tanpa tautan streaming.
 * Note : node scrapers/apiku/anime/animasu/scrape-home.js --page 1
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/animasu/home';
const { scrape: animasuHome, cli } = apikuEndpoint(ENDPOINT, {
  params: { page: { min: 1, max: 100, default: 1 } },
  mapData: ({ data }) => {
    const entries = (list) => Array.isArray(list) ? list.filter((item) => hasText(item?.title) && hasText(item.slug))
      .map(({ title, slug, episode, type, status }) => ({ title, slug, episode, type, status })) : [];
    const ongoing = entries(data?.ongoing);
    const updated = entries(data?.updated);
    return ongoing.length || updated.length ? { ongoing, updated } : null;
  }
});

module.exports = { animasuHome };
if (require.main === module) cli();
