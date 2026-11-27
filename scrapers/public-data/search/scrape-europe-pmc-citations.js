#!/usr/bin/env node
'use strict';

/**
 * Name : Europe PMC Citing Publications
 * Creator : lmavour
 * Source : https://europepmc.org/RestfulWebService
 * Base Web : https://www.ebi.ac.uk
 * Type : Scraper
 * Description : Find publications that cite a PubMed-indexed article, using the Europe PMC citation network.
 * Note : node scrapers/public-data/search/scrape-europe-pmc-citations.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://www.ebi.ac.uk/europepmc/webservices/rest/MED/{id}/citations?format=json';
const { scrape: europePmcCitations, cli } = jsonEndpoint(ENDPOINT, {
  source: 'europe-pmc', interval: 1500,
  params: {
    id: { required: true, type: 'number', min: 1, max: 999999999 },
    page: { type: 'number', min: 1, max: 100, default: 1 },
    pageSize: { type: 'number', min: 1, max: 25, default: 10 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['citationList']?.['citation']) ? payload : null
});

module.exports = { europePmcCitations };
if (require.main === module) cli();
