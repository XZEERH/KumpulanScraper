#!/usr/bin/env node
'use strict';

/**
 * Name : Basketball Live
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get live basketball matches, scores, schedules, and detailed match info
 * Note : node scrapers/prexzy/sports/scrape-basketball.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/sports/basketball';
const { scrape: prexzySportsBasketball, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    detail: {},
    category: {},
    id: {},
    lang: {}
  }
});

module.exports = { prexzySportsBasketball };
if (require.main === module) cli();
