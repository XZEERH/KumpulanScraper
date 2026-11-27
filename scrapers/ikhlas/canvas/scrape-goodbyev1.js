#!/usr/bin/env node
'use strict';

/**
 * Name : Goodbye V1
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan perpisahan versi 1 untuk anggota yang meninggalkan server dengan informasi server, avatar, dan latar kustom.
 * Note : node scrapers/ikhlas/canvas/scrape-goodbyev1.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/goodbyev1';
const { scrape: ikhlasCanvasGoodbyev1, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    username: { required: true },
    guildName: { required: true },
    guildIcon: { required: true, url: true },
    memberCount: { required: true },
    avatar: { required: true, url: true },
    background: { required: true, url: true },
    quality: {}
  }
});

module.exports = { ikhlasCanvasGoodbyev1 };
if (require.main === module) cli();
