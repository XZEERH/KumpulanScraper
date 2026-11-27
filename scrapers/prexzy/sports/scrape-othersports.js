#!/usr/bin/env node
'use strict';

/**
 * Name : Other Sports Live
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get live matches for other sports, schedules, and detailed match info
 * Note : node scrapers/prexzy/sports/scrape-othersports.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/sports/othersports';
const { scrape: prexzySportsOthersports, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    detail: {},
    category: {},
    id: {},
    lang: {}
  }
});

module.exports = { prexzySportsOthersports };
if (require.main === module) cli();
