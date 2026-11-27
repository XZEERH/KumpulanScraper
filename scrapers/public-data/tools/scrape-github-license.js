#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub Repository License
 * Creator : lmavour
 * Source : https://docs.github.com/en/rest/licenses/licenses#get-the-license-for-a-repository
 * Base Web : https://api.github.com
 * Type : Scraper
 * Description : Memeriksa lisensi terdeteksi dan identifikasi SPDX untuk repositori publik.
 * Note : node scrapers/public-data/tools/scrape-github-license.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.github.com/repos/{owner}/{repo}/license';
const { scrape: githubLicense, cli } = jsonEndpoint(ENDPOINT, {
  source: 'github', interval: 1500,
  params: {
    owner: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') },
    repo: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['license']?.['spdx_id'] === 'string' && payload?.['license']?.['spdx_id'].trim().length > 0 ? payload : null
});

module.exports = { githubLicense };
if (require.main === module) cli();
