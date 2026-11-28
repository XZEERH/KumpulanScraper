#!/usr/bin/env node
'use strict';

/**
 * Name : Football Live
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get live football matches, scores, schedules, and detailed match info
 * Note : node scrapers/prexzy/sports/scrape-football.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/sports/football';
const { scrape: prexzySportsFootball, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    detail: {},
    category: {},
    id: {},
    lang: {}
  }
});

module.exports = { prexzySportsFootball };
if (require.main === module) cli();
