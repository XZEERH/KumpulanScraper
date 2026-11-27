#!/usr/bin/env node
'use strict';

/**
 * Name : Welcome V5
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan selamat datang modern dengan kartu profil terintegrasi, nama server, jumlah anggota, dan efek latar belakang sinematis.
 * Note : node scrapers/ikhlas/canvas/scrape-welcomev5.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/welcomev5';
const { scrape: ikhlasCanvasWelcomev5, cli } = documentedEndpoint(ENDPOINT, {
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

module.exports = { ikhlasCanvasWelcomev5 };
if (require.main === module) cli();
