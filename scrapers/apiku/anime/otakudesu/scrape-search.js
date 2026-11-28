#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Otakudesu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mencari metadata judul anime, status, dan genre dari katalog Otakudesu.
 * Note : node scrapers/apiku/anime/otakudesu/scrape-search.js --q Naruto
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/otakudesu/search';
const { scrape: otakudesuSearch, cli } = apikuEndpoint(ENDPOINT, {
  params: { q: { required: true, maxLength: 150 } },
  mapData: ({ data }) => Array.isArray(data) ? data.filter((item) => hasText(item?.title) && hasText(item.slug))
    .map(({ title, slug, genres, status, rating }) => ({ title, slug, genres, status, rating })) : null
});

module.exports = { otakudesuSearch };
if (require.main === module) cli();
