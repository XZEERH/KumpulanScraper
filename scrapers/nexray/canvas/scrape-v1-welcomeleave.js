#!/usr/bin/env node
'use strict';

/**
 * Name : Welcome-Leave v1
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/canvas
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Buat gambar welcome atau leave menggunakan canvas v1
 * Note : node scrapers/nexray/canvas/scrape-v1-welcomeleave.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/canvas/v1/welcomeleave';
const { scrape: nexrayCanvasV1Welcomeleave, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    title: { required: true },
    description: { required: true },
    avatar: { required: true, url: true },
    background: { required: true, url: true },
    color: { required: true },
    cardstroke: { required: true }
  }
});

module.exports = { nexrayCanvasV1Welcomeleave };
if (require.main === module) cli();
