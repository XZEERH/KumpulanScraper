#!/usr/bin/env node
'use strict';

/**
 * Name : Google AI Mode & Lens Vision
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Akses antarmuka kecerdasan buatan Google Search AI Mode (UDM=50) dan multimodal Google Lens Vision dengan manajemen cookie NID anti-bot otomatis berbasis Camoufox.
 * Note : node scrapers/kyio/ai/scrape-googleai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/googleai';
const { scrape: aiGoogleai, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    q: {},
    url: {},
    file: {},
    image: {},
    sessionId: {},
    action: {},
    hl: {},
    gl: {}
  }
});

module.exports = { aiGoogleai };
if (require.main === module) cli();
