#!/usr/bin/env node
'use strict';

/**
 * Name : DramaBox Ranking
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menampilkan chart drama peringkat teratas kategori Top Hits dan Trending di platform DramaBox.
 * Note : node scrapers/ikhlas/movie/scrape-dramabox-ranking.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/movie/dramabox/ranking';
const { scrape: ikhlasMovieDramaboxRanking, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  params: {
    locale: { choices: ['in', 'en', 'zhHans', 'ko', 'zh', 'es', 'ja', 'fr', 'th', 'vi'] }
  }
});

module.exports = { ikhlasMovieDramaboxRanking };
if (require.main === module) cli();
