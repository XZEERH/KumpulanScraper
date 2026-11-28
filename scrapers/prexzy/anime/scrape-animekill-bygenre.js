#!/usr/bin/env node
'use strict';

/**
 * Name : Anime By Genre
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get anime filtered by genre
 * Note : node scrapers/prexzy/anime/scrape-animekill-bygenre.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/anime/animekill-bygenre';
const { scrape: prexzyAnimeAnimekillBygenre, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'data',
  params: {
    genre: { required: true },
    offset: {}
  }
});

module.exports = { prexzyAnimeAnimekillBygenre };
if (require.main === module) cli();
