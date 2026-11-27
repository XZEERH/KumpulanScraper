#!/usr/bin/env node
'use strict';

/**
 * Name : Brat Animated GIF
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate an animated Brat typing GIF (white aesthetic) powered by @ghuts/brat, Sharp, and gifwrap.
 * Note : node scrapers/kyio/maker/scrape-bratgif.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/bratgif';
const { scrape: makerBratgif, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true },
    blur: {},
    frames: {},
    delay: {},
    size: {}
  }
});

module.exports = { makerBratgif };
if (require.main === module) cli();
