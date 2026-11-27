#!/usr/bin/env node
'use strict';

/**
 * Name : Europe PMC Publication Search
 * Creator : lmavour
 * Source : https://europepmc.org/RestfulWebService
 * Base Web : https://www.ebi.ac.uk
 * Type : Scraper
 * Description : Search Europe PMC for publication metadata, including identifiers, journals, and citation counts.
 * Note : node scrapers/public-data/search/scrape-europe-pmc-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=lite';
const { scrape: europePmcSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'europe-pmc', interval: 1500,
  params: {
    query: { required: true, maxLength: 180 },
    pageSize: { type: 'number', min: 1, max: 25, default: 10 },
    cursorMark: { maxLength: 128 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['resultList']?.['result']) ? payload : null
});

module.exports = { europePmcSearch };
if (require.main === module) cli();
