#!/usr/bin/env node
'use strict';

/**
 * Name : Lirik Lagu Spesifik
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil lirik biasa dan LRC berdasarkan judul, artis, dan informasi rilisan opsional.
 * Note : node scrapers/apiku/lirik/scrape-detail.js --judul Yellow --artis Coldplay
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/lirik';
const { scrape: lirikDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: {
    judul: { required: true, maxLength: 150 }, artis: { required: true, maxLength: 120 },
    album: { maxLength: 150 }, durasi: { min: 1, max: 36000 }
  },
  validateData: (data) => hasText(data?.judul) && hasText(data.artis) &&
    (data.instrumen === true || hasText(data.lirik) || hasText(data.lirik_sinkron))
});

module.exports = { lirikDetail };
if (require.main === module) cli();
