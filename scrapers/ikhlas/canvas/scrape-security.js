#!/usr/bin/env node
'use strict';

/**
 * Name : Security Card
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat kartu investigasi tersangka keamanan bergaya Discord dengan timestamp akun, kejadian mencurigakan, avatar, latar, dan bahasa.
 * Note : node scrapers/ikhlas/canvas/scrape-security.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/security';
const { scrape: ikhlasCanvasSecurity, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    avatar: { required: true, url: true },
    background: { required: true, url: true },
    createdTimestamp: { required: true },
    suspectTimestamp: { required: true },
    locale: { required: true }
  }
});

module.exports = { ikhlasCanvasSecurity };
if (require.main === module) cli();
