#!/usr/bin/env node
'use strict';

/**
 * Name : Sindo News
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan berita terbaru dari SindoNews
 * Note : node scrapers/nexray/berita/scrape-sindonews.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/sindonews';
const { scrape: nexrayBeritaSindonews, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaSindonews };
if (require.main === module) cli();
