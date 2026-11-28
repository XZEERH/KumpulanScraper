#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Card
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat kartu visual Now Playing bergaya Spotify lengkap dengan judul lagu, artis, durasi waktu progress bar, cover album, dan warna border.
 * Note : node scrapers/ikhlas/canvas/scrape-spotify.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/spotify';
const { scrape: ikhlasCanvasSpotify, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    title: { required: true },
    artist: { required: true },
    start: { required: true },
    end: { required: true },
    image: { required: true, url: true },
    album: {},
    border: {}
  }
});

module.exports = { ikhlasCanvasSpotify };
if (require.main === module) cli();
