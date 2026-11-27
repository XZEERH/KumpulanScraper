#!/usr/bin/env node
'use strict';

/**
 * Name : 1917 Style Text
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : 1917 style text effect
 * Note : node scrapers/prexzy/text-maker/scrape-style1917.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/style1917';
const { scrape: prexzyTextMakerStyle1917, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  format: 'image',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyTextMakerStyle1917 };
if (require.main === module) cli();
