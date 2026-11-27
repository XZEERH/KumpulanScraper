#!/usr/bin/env node
'use strict';

/**
 * Name : Research Organization Registry Search
 * Creator : lmavour
 * Source : https://ror.readme.io/docs/api-query
 * Base Web : https://api.ror.org
 * Type : Scraper
 * Description : Find research institutions by name or alias and retrieve their public ROR identifiers.
 * Note : node scrapers/public-data/search/scrape-ror-organization-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.ror.org/v2/organizations';
const { scrape: rorOrganizationSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'ror', interval: 1500,
  params: {
    query: { required: true, maxLength: 180 },
    page: { type: 'number', min: 1, max: 50, default: 1 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['items']) ? payload : null
});

module.exports = { rorOrganizationSearch };
if (require.main === module) cli();
