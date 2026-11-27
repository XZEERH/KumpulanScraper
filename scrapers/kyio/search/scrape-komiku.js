#!/usr/bin/env node
'use strict';

/**
 * Name : Komiku Reader & Downloader Suite
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pusat baca & unduh komik terlengkap: Manga, Manhwa, Manhua, daftar chapter, reader CDN resolusi tinggi, dan download ZIP otomatis.
 * Note : node scrapers/kyio/search/scrape-komiku.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/komiku';
const { scrape: searchKomiku, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    q: {},
    slug: {},
    url: {},
    type: {},
    genre: {},
    page: {},
    format: {}
  }
});

module.exports = { searchKomiku };
if (require.main === module) cli();
