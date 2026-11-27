#!/usr/bin/env node
'use strict';

/**
 * Name : SoundCloud Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Cari musik independen, lagu populer, podcast, dan remix di SoundCloud lengkap dengan info genre, durasi, dan jumlah pemutaran.
 * Note : node scrapers/ikhlas/search/scrape-soundcloud.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/soundcloud';
const { scrape: ikhlasSearchSoundcloud, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchSoundcloud };
if (require.main === module) cli();
