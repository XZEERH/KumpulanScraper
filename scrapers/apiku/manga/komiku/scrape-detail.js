#!/usr/bin/env node
'use strict';

/**
 * Name : Metadata Detail Komiku
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Membaca judul, sinopsis, genre, dan jumlah chapter tanpa proxy gambar.
 * Note : node scrapers/apiku/manga/komiku/scrape-detail.js --slug archmage-restaurant
 */

const { apikuEndpoint, hasText } = require('../../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/komiku/detail';
const { scrape: komikuDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: { slug: { required: true, pattern: /^[a-z\d][a-z\d-]{0,140}$/ } },
  mapData: ({ data }, { slug }) => {
    if (!hasText(data?.title)) return null;
    const { title, synopsis, genres, chapters } = data;
    return { slug, title, synopsis, genres, chapterCount: Array.isArray(chapters) ? chapters.length : null };
  }
});

module.exports = { komikuDetail };
if (require.main === module) cli();
