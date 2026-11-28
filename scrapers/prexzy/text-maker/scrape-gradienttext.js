#!/usr/bin/env node
'use strict';

/**
 * Name : 3D Gradient Text
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Create 3D gradient text effect
 * Note : node scrapers/prexzy/text-maker/scrape-gradienttext.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/gradienttext';
const { scrape: prexzyTextMakerGradienttext, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  format: 'image',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyTextMakerGradienttext };
if (require.main === module) cli();
