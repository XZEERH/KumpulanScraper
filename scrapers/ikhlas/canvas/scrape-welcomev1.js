#!/usr/bin/env node
'use strict';

/**
 * Name : Welcome V1
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan selamat datang versi 1 untuk anggota komunitas atau server Discord dengan kustomisasi nama pengguna, nama server, ikon server, avatar, jumlah anggota, latar belakang, dan kualitas render.
 * Note : node scrapers/ikhlas/canvas/scrape-welcomev1.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/welcomev1';
const { scrape: ikhlasCanvasWelcomev1, cli } = documentedEndpoint(ENDPOINT, {
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

module.exports = { ikhlasCanvasWelcomev1 };
if (require.main === module) cli();
