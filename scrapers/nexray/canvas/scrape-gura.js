#!/usr/bin/env node
'use strict';

/**
 * Name : Gura
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/canvas
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat gambar dengan template Gura
 * Note : node scrapers/nexray/canvas/scrape-gura.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/canvas/gura';
const { scrape: nexrayCanvasGura, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayCanvasGura };
if (require.main === module) cli();
