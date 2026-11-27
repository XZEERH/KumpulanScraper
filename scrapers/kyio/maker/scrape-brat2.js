#!/usr/bin/env node
'use strict';

/**
 * Name : Brat Animated Video v2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate Brat v2 animated MP4 video (white aesthetic) with zoom bounce and typography.
 * Note : node scrapers/kyio/maker/scrape-brat2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/brat2';
const { scrape: makerBrat2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true },
    fps: {},
    duration: {},
    size: {}
  }
});

module.exports = { makerBrat2 };
if (require.main === module) cli();
