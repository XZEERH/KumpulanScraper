#!/usr/bin/env node
'use strict';

/**
 * Name : QR Code
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Convert text ke QR Code
 * Note : node scrapers/nexray/tools/scrape-qrcode.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/qrcode';
const { scrape: nexrayToolsQrcode, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayToolsQrcode };
if (require.main === module) cli();
