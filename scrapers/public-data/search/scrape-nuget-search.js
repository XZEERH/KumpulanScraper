#!/usr/bin/env node
'use strict';

/**
 * Name : NuGet Package Search
 * Creator : lmavour
 * Source : https://learn.microsoft.com/en-us/nuget/api/search-query-service-resource
 * Base Web : https://azuresearch-usnc.nuget.org
 * Type : Scraper
 * Description : Mencari paket NuGet publik dan versi stabilnya.
 * Note : node scrapers/public-data/search/scrape-nuget-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://azuresearch-usnc.nuget.org/query?prerelease=false';
const { scrape: nugetSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'nuget', interval: 1500,
  params: {
    q: { required: true },
    take: { min: 1, max: 25, default: 5 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['data']) ? payload : null
});

module.exports = { nugetSearch };
if (require.main === module) cli();
