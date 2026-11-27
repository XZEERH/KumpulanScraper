#!/usr/bin/env node
'use strict';

/**
 * Name : PyPI Download Statistics
 * Creator : lmavour
 * Source : https://pypistats.org/api/
 * Base Web : https://pypistats.org
 * Type : Scraper
 * Description : Melihat jumlah unduhan terakhir untuk proyek Python publik.
 * Note : node scrapers/public-data/tools/scrape-pypi-download-stats.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://pypistats.org/api/packages/{project}/recent';
const { scrape: pypiDownloadStats, cli } = jsonEndpoint(ENDPOINT, {
  source: 'pypistats', interval: 1500,
  params: {
    project: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Number.isFinite(payload?.['data']?.['last_month']) ? payload : null
});

module.exports = { pypiDownloadStats };
if (require.main === module) cli();
