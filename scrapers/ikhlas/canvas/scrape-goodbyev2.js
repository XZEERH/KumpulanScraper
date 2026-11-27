#!/usr/bin/env node
'use strict';

/**
 * Name : Goodbye V2
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan perpisahan versi 2 dengan desain bersih dan fokus pada teks ucapan perpisahan.
 * Note : node scrapers/ikhlas/canvas/scrape-goodbyev2.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/goodbyev2';
const { scrape: ikhlasCanvasGoodbyev2, cli } = documentedEndpoint(ENDPOINT, {
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

module.exports = { ikhlasCanvasGoodbyev2 };
if (require.main === module) cli();
