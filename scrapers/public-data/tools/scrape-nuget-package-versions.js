#!/usr/bin/env node
'use strict';

/**
 * Name : NuGet Package Versions
 * Creator : lmavour
 * Source : https://learn.microsoft.com/en-us/nuget/api/package-base-address-resource
 * Base Web : https://api.nuget.org
 * Type : Scraper
 * Description : Mendaftar versi paket NuGet menggunakan ID paket huruf kecil.
 * Note : node scrapers/public-data/tools/scrape-nuget-package-versions.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.nuget.org/v3-flatcontainer/{id}/index.json';
const { scrape: nugetPackageVersions, cli } = jsonEndpoint(ENDPOINT, {
  source: 'nuget', interval: 1500,
  params: {
    id: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[a-z0-9][a-z0-9._-]{0,99}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['versions']) ? payload : null
});

module.exports = { nugetPackageVersions };
if (require.main === module) cli();
