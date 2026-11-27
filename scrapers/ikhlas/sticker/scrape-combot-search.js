#!/usr/bin/env node
'use strict';

/**
 * Name : Combot Sticker Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mencari ribuan paket stiker Telegram berdasarkan kata kunci topik, karakter, atau nama paket dari basis data Combot.org dengan dukungan nomor halaman.
 * Note : node scrapers/ikhlas/sticker/scrape-combot-search.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/sticker/combot-search';
const { scrape: ikhlasStickerCombotSearch, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    q: { required: true },
    page: {}
  }
});

module.exports = { ikhlasStickerCombotSearch };
if (require.main === module) cli();
