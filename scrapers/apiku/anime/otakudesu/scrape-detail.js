#!/usr/bin/env node
'use strict';

/**
 * Name : Metadata Detail Otakudesu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Membaca metadata anime, sinopsis, dan jumlah episode tanpa tautan pemutar.
 * Note : node scrapers/apiku/anime/otakudesu/scrape-detail.js --slug koori-jouheki-s2-sub-indo
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/otakudesu/detail';
const { scrape: otakudesuDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: { slug: { required: true, pattern: /^[a-z\d][a-z\d-]{0,140}$/ } },
  mapData: ({ data }, { slug }) => {
    if (!hasText(data?.title)) return null;
    const { title, japanese, synopsis, genres, type, studio, status, score, releaseDate, episodes } = data;
    return { slug, title, japanese, synopsis, genres, type, studio, status, score, releaseDate,
      episodeCount: Array.isArray(episodes) ? episodes.length : null };
  }
});

module.exports = { otakudesuDetail };
if (require.main === module) cli();
