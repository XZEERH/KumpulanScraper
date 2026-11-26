#!/usr/bin/env node
'use strict';

/**
 * Name : Katalog Otakudesu
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan metadata anime yang sedang atau sudah selesai tayang.
 * Note : node scrapers/apiku/anime/otakudesu/scrape-home.js
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/otakudesu/home';
const { scrape: otakudesuHome, cli } = apikuEndpoint(ENDPOINT, {
  mapData: ({ data }) => {
    const entries = (list) => Array.isArray(list) ? list.filter((item) => hasText(item?.title) && hasText(item.slug))
      .map(({ title, slug, episode, day, date }) => ({ title, slug, episode, day, date })) : [];
    const ongoing = entries(data?.ongoing);
    const complete = entries(data?.complete);
    return ongoing.length || complete.length ? { ongoing, complete } : null;
  }
});

module.exports = { otakudesuHome };
if (require.main === module) cli();
