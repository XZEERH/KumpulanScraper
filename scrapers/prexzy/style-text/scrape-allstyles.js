#!/usr/bin/env node
'use strict';

/**
 * Name : All Text Styles
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Generate all 35+ text styles at once
 * Note : node scrapers/prexzy/style-text/scrape-allstyles.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tools/allstyles';
const { scrape: prexzyStyleTextAllstyles, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyStyleTextAllstyles };
if (require.main === module) cli();
