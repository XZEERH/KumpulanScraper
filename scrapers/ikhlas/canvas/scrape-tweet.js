#!/usr/bin/env node
'use strict';

/**
 * Name : Tweet Card
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar postingan tweet Twitter/X untuk konten visual media sosial, meme, quote, dan presentasi.
 * Note : node scrapers/ikhlas/canvas/scrape-tweet.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/tweet';
const { scrape: ikhlasCanvasTweet, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    displayName: { required: true },
    username: { required: true },
    comment: { required: true },
    avatar: { required: true, url: true },
    verified: {},
    theme: { choices: ['dark', 'light'] }
  }
});

module.exports = { ikhlasCanvasTweet };
if (require.main === module) cli();
