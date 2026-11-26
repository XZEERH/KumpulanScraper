#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian SoundCloud
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari trek SoundCloud dan mengembalikan metadata serta tautan publik.
 * Note : node scrapers/siputzx/search/scrape-siputzx-s-soundcloud.js --query "duka"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/soundcloud';
const { scrape: searchSoundcloud, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { query: { required: true } }
});

module.exports = { searchSoundcloud };
if (require.main === module) cli();
