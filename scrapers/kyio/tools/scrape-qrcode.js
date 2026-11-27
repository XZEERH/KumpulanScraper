#!/usr/bin/env node
'use strict';

/**
 * Name : QR Maker
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate stylish, customizable QR codes (WiFi, VCard, SMS, etc.) using the Wix Engine.
 * Note : node scrapers/kyio/tools/scrape-qrcode.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/qrcode';
const { scrape: toolsQrcode, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    type: {},
    fg: {},
    bg: {},
    size: {}
  }
});

module.exports = { toolsQrcode };
if (require.main === module) cli();
