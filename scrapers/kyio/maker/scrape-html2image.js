#!/usr/bin/env node
'use strict';

/**
 * Name : HTML 2 Image
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Convert HTML and CSS code into a high-quality image
 * Note : node scrapers/kyio/maker/scrape-html2image.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/html2image';
const { scrape: makerHtml2image, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    html: { required: true },
    css: {},
    width: {},
    height: {},
    google_fonts: {}
  }
});

module.exports = { makerHtml2image };
if (require.main === module) cli();
