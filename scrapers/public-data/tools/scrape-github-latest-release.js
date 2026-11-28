#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub Latest Release
 * Creator : lmavour
 * Source : https://docs.github.com/en/rest/releases/releases#get-the-latest-release
 * Base Web : https://api.github.com
 * Type : Scraper
 * Description : Membaca rilis terakhir repositori publik tanpa mengunduh aset.
 * Note : node scrapers/public-data/tools/scrape-github-latest-release.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.github.com/repos/{owner}/{repo}/releases/latest';
const { scrape: githubLatestRelease, cli } = jsonEndpoint(ENDPOINT, {
  source: 'github', interval: 1500,
  params: {
    owner: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') },
    repo: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['tag_name'] === 'string' && payload?.['tag_name'].trim().length > 0 ? payload : null
});

module.exports = { githubLatestRelease };
if (require.main === module) cli();
