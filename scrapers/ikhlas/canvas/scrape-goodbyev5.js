#!/usr/bin/env node
'use strict';

/**
 * Name : Goodbye V5
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar perpisahan modern Discord dengan nama pengguna, nama server, jumlah anggota, avatar, latar belakang, dan kontrol kualitas.
 * Note : node scrapers/ikhlas/canvas/scrape-goodbyev5.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/goodbyev5';
const { scrape: ikhlasCanvasGoodbyev5, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    username: { required: true },
    guildName: { required: true },
    memberCount: { required: true },
    avatar: { required: true, url: true },
    background: { required: true, url: true },
    quality: {}
  }
});

module.exports = { ikhlasCanvasGoodbyev5 };
if (require.main === module) cli();
