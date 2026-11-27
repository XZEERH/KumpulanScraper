#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Quotes
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Pencarian kutipan kata mutiara, dialog bijak, dan filosofi kehidupan dari berbagai serial anime dan karakter legendaris melalui database Ikhlas API.
 * Note : node scrapers/ikhlas/anime/scrape-animequotes.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/anime/animequotes';
const { scrape: ikhlasAnimeAnimequotes, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasAnimeAnimequotes };
if (require.main === module) cli();
