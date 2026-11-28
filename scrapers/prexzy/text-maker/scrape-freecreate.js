#!/usr/bin/env node
'use strict';

/**
 * Name : 3D Hologram Text
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Free create a 3D hologram text effect
 * Note : node scrapers/prexzy/text-maker/scrape-freecreate.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/freecreate';
const { scrape: prexzyTextMakerFreecreate, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  format: 'image',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyTextMakerFreecreate };
if (require.main === module) cli();
