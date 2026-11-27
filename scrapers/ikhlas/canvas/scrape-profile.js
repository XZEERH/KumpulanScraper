#!/usr/bin/env node
'use strict';

/**
 * Name : Profile Card
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat kartu profil pengguna komprehensif dengan progress bar EXP, level, peringkat, rank ID, avatar, dan latar kustom.
 * Note : node scrapers/ikhlas/canvas/scrape-profile.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/profile';
const { scrape: ikhlasCanvasProfile, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    backgroundURL: { required: true, url: true },
    avatarURL: { required: true, url: true },
    rankName: { required: true },
    rankId: { required: true },
    exp: { required: true },
    requireExp: { required: true },
    level: { required: true },
    name: { required: true }
  }
});

module.exports = { ikhlasCanvasProfile };
if (require.main === module) cli();
