#!/usr/bin/env node
'use strict';

/**
 * Name : Metadata Detail Animasu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Membaca judul, genre, studio, dan jumlah episode dari slug katalog Animasu.
 * Note : node scrapers/apiku/anime/animasu/scrape-detail.js --slug sora-wa-akai-kawa-no-hotori
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/animasu/detail';
const { scrape: animasuDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: { slug: { required: true, pattern: /^[a-z\d][a-z\d-]{0,140}$/ } },
  mapData: ({ data }, { slug }) => {
    if (!hasText(data?.title)) return null;
    const { title, alternative_title, synopsis, genres, type, studio, status, rating, episodes } = data;
    return { slug, title, alternativeTitle: alternative_title, synopsis, genres, type, studio, status, rating,
      episodeCount: Array.isArray(episodes) ? episodes.length : null };
  }
});

module.exports = { animasuDetail };
if (require.main === module) cli();
