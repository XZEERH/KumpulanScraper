#!/usr/bin/env node
'use strict';

/**
 * Name : WiFi QR Code Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate QR code untuk auto-connect ke jaringan WiFi.
 * Note : node scrapers/kyio/tools/scrape-wifi-qr.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/wifi-qr';
const { scrape: toolsWifiQr, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    ssid: { required: true },
    password: {},
    encryption: {}
  }
});

module.exports = { toolsWifiQr };
if (require.main === module) cli();
