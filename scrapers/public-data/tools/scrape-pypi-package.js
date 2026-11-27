#!/usr/bin/env node
'use strict';

/**
 * Name : PyPI Package Metadata
 * Creator : lmavour
 * Source : https://docs.pypi.org/api/json/
 * Base Web : https://pypi.org
 * Type : Scraper
 * Description : Membaca versi, lisensi, rilis dan distribusi sebuah proyek Python.
 * Note : node scrapers/public-data/tools/scrape-pypi-package.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://pypi.org/pypi/{project}/json';
const { scrape: pypiPackage, cli } = jsonEndpoint(ENDPOINT, {
  source: 'pypi', interval: 1500,
  params: {
    project: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['info']?.['version'] === 'string' && payload?.['info']?.['version'].trim().length > 0 ? payload : null
});

module.exports = { pypiPackage };
if (require.main === module) cli();
