#!/usr/bin/env node
'use strict';

/**
 * Name : Genshin Impact
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil profil publik Genshin Impact.
 * Note : node scrapers/nexray/stalker/scrape-genshin.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/genshin';
const { scrape: nexrayStalkerGenshin, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    id: { required: true }
  }
});

module.exports = { nexrayStalkerGenshin };
if (require.main === module) cli();
