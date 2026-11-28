#!/usr/bin/env node
'use strict';

/**
 * Name : Quotly
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/canvas
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat gambar quotly dengan background transparan
 * Note : node scrapers/nexray/canvas/scrape-quotly.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/canvas/quotly';
const { scrape: nexrayCanvasQuotly, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true },
    name: { required: true },
    avatar: { required: true, url: true },
    color: { required: true }
  }
});

module.exports = { nexrayCanvasQuotly };
if (require.main === module) cli();
