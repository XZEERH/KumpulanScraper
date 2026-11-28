#!/usr/bin/env node
'use strict';

/**
 * Name : Goal.com Live Scores
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get live football scores, fixtures and results from Goal.com
 * Note : node scrapers/prexzy/sports/scrape-goallivescore.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/sports/goallivescore';
const { scrape: prexzySportsGoallivescore, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'data',
  params: {
    edition: {},
    raw: {}
  }
});

module.exports = { prexzySportsGoallivescore };
if (require.main === module) cli();
