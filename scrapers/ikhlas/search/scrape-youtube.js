#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Video Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Pencarian video YouTube lengkap dengan judul, deskripsi, nama channel penyiar, durasi waktu, thumbnail HD, dan tautan tonton langsung.
 * Note : node scrapers/ikhlas/search/scrape-youtube.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/youtube';
const { scrape: ikhlasSearchYoutube, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchYoutube };
if (require.main === module) cli();
