#!/usr/bin/env node
'use strict';

/**
 * Name : Kutipan Anime Acak
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil kutipan anime beserta karakter dan judul sumbernya.
 * Note : node scrapers/siputzx/random/scrape-siputzx-r-quotesanime.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/r/quotesanime';
const { scrape: randomQuotesAnime, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { randomQuotesAnime };
if (require.main === module) cli();
