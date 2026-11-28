#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Lirik Lagu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mencari judul dan artis serta lirik biasa atau LRC jika tersedia.
 * Note : node scrapers/apiku/lirik/scrape-search.js --q "Twinkle Twinkle Little Star"
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/lirik/search';
const { scrape: lirikSearch, cli } = apikuEndpoint(ENDPOINT, {
  params: { q: { maxLength: 150 }, judul: { maxLength: 150 }, artis: { maxLength: 120 }, album: { maxLength: 150 } },
  checkParams: (values) => {
    if (!Object.keys(values).length) throw new Error('Isi minimal salah satu dari q, judul, artis, atau album');
  },
  validateData: (data) => Array.isArray(data) && data.every((track) => hasText(track?.judul) && hasText(track.artis))
});

module.exports = { lirikSearch };
if (require.main === module) cli();
