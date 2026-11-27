#!/usr/bin/env node
'use strict';

/**
 * Name : A-cute
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Convert text to A-cute style
 * Note : node scrapers/prexzy/style-text/scrape-acute.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tools/acute';
const { scrape: prexzyStyleTextAcute, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyStyleTextAcute };
if (require.main === module) cli();
