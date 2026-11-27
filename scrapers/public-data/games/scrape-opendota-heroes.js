#!/usr/bin/env node
'use strict';

/**
 * Name : OpenDota Hero Catalog
 * Creator : lmavour
 * Source : https://docs.opendota.com/#tag/heroes
 * Base Web : https://api.opendota.com
 * Type : Scraper
 * Description : Membaca daftar hero Dota 2, atribut utama, dan perannya.
 * Note : node scrapers/public-data/games/scrape-opendota-heroes.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.opendota.com/api/heroes';
const { scrape: opendotaHeroes, cli } = jsonEndpoint(ENDPOINT, {
  source: 'opendota', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { opendotaHeroes };
if (require.main === module) cli();
