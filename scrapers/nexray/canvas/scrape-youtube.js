#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube-Thumbnail
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/canvas
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate YouTube-style thumbnail with cover image, title, and artist
 * Note : node scrapers/nexray/canvas/scrape-youtube.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/canvas/youtube';
const { scrape: nexrayCanvasYoutube, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    title: { required: true },
    artist: { required: true },
    coverurl: { required: true, url: true }
  }
});

module.exports = { nexrayCanvasYoutube };
if (require.main === module) cli();
