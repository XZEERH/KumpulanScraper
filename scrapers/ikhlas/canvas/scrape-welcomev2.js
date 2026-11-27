#!/usr/bin/env node
'use strict';

/**
 * Name : Welcome V2
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan selamat datang versi 2 dengan tata letak minimalis mencakup username, nama server, jumlah anggota, avatar, dan background.
 * Note : node scrapers/ikhlas/canvas/scrape-welcomev2.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/welcomev2';
const { scrape: ikhlasCanvasWelcomev2, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    username: { required: true },
    guildName: { required: true },
    memberCount: { required: true },
    avatar: { required: true, url: true },
    background: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasWelcomev2 };
if (require.main === module) cli();
