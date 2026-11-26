#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Animasu
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mencari metadata anime berdasarkan judul, tanpa mengembalikan tautan pemutar.
 * Note : node scrapers/apiku/anime/animasu/scrape-search.js --q Naruto
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/animasu/search';
const { scrape: animasuSearch, cli } = apikuEndpoint(ENDPOINT, {
  params: { q: { required: true, maxLength: 150 } },
  mapData: ({ data }) => Array.isArray(data) ? data.filter((item) => hasText(item?.title) && hasText(item.slug))
    .map(({ title, slug, episode, type, status }) => ({ title, slug, episode, type, status })) : null
});

module.exports = { animasuSearch };
if (require.main === module) cli();
