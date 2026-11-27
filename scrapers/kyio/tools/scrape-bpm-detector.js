#!/usr/bin/env node
'use strict';

/**
 * Name : BPM & Musical Key Detector
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Deteksi tempo (BPM), kunci nada musik, notasi Camelot Wheel, dan harmonik chroma dari file audio atau URL.
 * Note : node scrapers/kyio/tools/scrape-bpm-detector.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/bpm-detector';
const { scrape: toolsBpmDetector, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { toolsBpmDetector };
if (require.main === module) cli();
