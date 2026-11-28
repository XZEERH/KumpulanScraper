#!/usr/bin/env node
'use strict';

/**
 * Name : deps.dev Package Overview
 * Creator : lmavour
 * Source : https://docs.deps.dev/api/v3/#getpackage
 * Base Web : https://api.deps.dev
 * Type : Scraper
 * Description : Melihat versi paket dari ekosistem perangkat lunak sumber terbuka.
 * Note : node scrapers/public-data/tools/scrape-depsdev-package.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.deps.dev/v3/systems/{system}/packages/{package}';
const { scrape: depsdevPackage, cli } = jsonEndpoint(ENDPOINT, {
  source: 'depsdev', interval: 1500,
  params: {
    system: { default: 'npm', choices: ['npm', 'pypi', 'go', 'cargo', 'maven', 'nuget'] },
    package: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^(?:@[A-Za-z0-9_.-]+/)?[A-Za-z0-9][A-Za-z0-9_.:/-]{0,180}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['versions']) ? payload : null
});

module.exports = { depsdevPackage };
if (require.main === module) cli();
