#!/usr/bin/env node
'use strict';

/**
 * Name : Circled
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Convert text to Circled style
 * Note : node scrapers/prexzy/style-text/scrape-circled.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tools/circled';
const { scrape: prexzyStyleTextCircled, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    text: { required: true }
  }
});

module.exports = { prexzyStyleTextCircled };
if (require.main === module) cli();
