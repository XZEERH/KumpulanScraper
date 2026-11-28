#!/usr/bin/env node
'use strict';

/**
 * Name : Goodbye V4
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat banner perpisahan modern bergaya Canvafy dengan avatar, latar, judul, deskripsi, border kustom, dan overlay opacity.
 * Note : node scrapers/ikhlas/canvas/scrape-goodbyev4.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/goodbyev4';
const { scrape: ikhlasCanvasGoodbyev4, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    avatar: { required: true, url: true },
    background: { required: true, url: true },
    title: { required: true },
    description: { required: true },
    border: {},
    avatarBorder: {},
    overlayOpacity: {}
  }
});

module.exports = { ikhlasCanvasGoodbyev4 };
if (require.main === module) cli();
