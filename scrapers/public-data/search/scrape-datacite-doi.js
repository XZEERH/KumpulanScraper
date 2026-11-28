#!/usr/bin/env node
'use strict';

/**
 * Name : DataCite DOI Record
 * Creator : lmavour
 * Source : https://support.datacite.org/docs/api-get-doi
 * Base Web : https://api.datacite.org
 * Type : Scraper
 * Description : Resolve a findable DataCite DOI to its title, publisher, resource type, and related identifiers.
 * Note : node scrapers/public-data/search/scrape-datacite-doi.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.datacite.org/dois/{doi}';
const { scrape: dataciteDoi, cli } = jsonEndpoint(ENDPOINT, {
  source: 'datacite', interval: 1500,
  params: {
    doi: { required: true, maxLength: 180, pattern: new RegExp('^(?!\\.{1,2}$)(?:^10\\.[0-9]{4,9}/[-A-Za-z0-9._:/()+;]+$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && payload?.['data']?.['attributes'] != null && typeof payload?.['data']?.['attributes'] === 'object' && !Array.isArray(payload?.['data']?.['attributes']) ? payload : null
});

module.exports = { dataciteDoi };
if (require.main === module) cli();
