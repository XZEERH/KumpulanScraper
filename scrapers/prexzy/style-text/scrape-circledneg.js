#!/usr/bin/env node
'use strict';

/**
 * Name : Circled (neg)
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Convert text to Circled (neg) style
 * Note : node scrapers/prexzy/style-text/scrape-circledneg.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tools/circledneg';
const { scrape: prexzyStyleTextCircledneg, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyStyleTextCircledneg };
if (require.main === module) cli();
