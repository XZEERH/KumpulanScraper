#!/usr/bin/env node
'use strict';

/**
 * Name : Katalog Komiku
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan judul, slug, dan info rilis dari katalog Komiku tanpa tautan halaman baca.
 * Note : node scrapers/apiku/manga/komiku/scrape-home.js
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/komiku/home';
const { scrape: komikuHome, cli } = apikuEndpoint(ENDPOINT, {
  mapData: ({ data }) => {
    const entries = (list) => Array.isArray(list) ? list.filter((item) => hasText(item?.title) && hasText(item.slug))
      .map(({ title, slug, chapter }) => ({ title: title.trim().split(/\r?\n/, 1)[0], slug, chapter })) : [];
    const ranking = entries(data?.ranking);
    const recent = entries(data?.recent);
    return ranking.length || recent.length ? { ranking, recent } : null;
  }
});

module.exports = { komikuHome };
if (require.main === module) cli();
