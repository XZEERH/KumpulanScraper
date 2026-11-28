#!/usr/bin/env node
'use strict';

/**
 * Name : Level Up Card
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat kartu visual notifikasi pencapaian kenaikan level dengan indikator level awal, level baru, nama pengguna, avatar, dan latar.
 * Note : node scrapers/ikhlas/canvas/scrape-level-up.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/level-up';
const { scrape: ikhlasCanvasLevelUp, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    backgroundURL: { required: true, url: true },
    avatarURL: { required: true, url: true },
    fromLevel: { required: true },
    toLevel: { required: true },
    name: { required: true }
  }
});

module.exports = { ikhlasCanvasLevelUp };
if (require.main === module) cli();
