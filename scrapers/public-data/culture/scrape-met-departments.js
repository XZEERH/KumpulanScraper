#!/usr/bin/env node
'use strict';

/**
 * Name : Met Departments
 * Creator : lmavour
 * Source : https://metmuseum.github.io/
 * Base Web : https://collectionapi.metmuseum.org
 * Type : Scraper
 * Description : List the Met collection departments and their numeric IDs.
 * Note : node scrapers/public-data/culture/scrape-met-departments.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://collectionapi.metmuseum.org/public/collection/v1/departments';
const { scrape: metDepartments, cli } = jsonEndpoint(ENDPOINT, {
  source: 'met', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['departments']) ? payload : null
});

module.exports = { metDepartments };
if (require.main === module) cli();
