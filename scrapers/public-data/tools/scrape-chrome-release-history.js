#!/usr/bin/env node
'use strict';

/**
 * Name : Chrome Release History
 * Creator : lmavour
 * Source : https://developer.chrome.com/docs/web-platform/versionhistory/reference
 * Base Web : https://versionhistory.googleapis.com
 * Type : Scraper
 * Description : Membaca versi Chrome berdasarkan platform dan kanal rilis.
 * Note : node scrapers/public-data/tools/scrape-chrome-release-history.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://versionhistory.googleapis.com/v1/chrome/platforms/{platform}/channels/{channel}/versions';
const { scrape: chromeReleaseHistory, cli } = jsonEndpoint(ENDPOINT, {
  source: 'chrome-versionhistory', interval: 1500,
  params: {
    platform: { default: 'linux', choices: ['linux', 'mac', 'mac_arm64', 'win', 'win64', 'android', 'ios'] },
    channel: { default: 'stable', choices: ['stable', 'beta', 'dev', 'canary'] },
    page_size: { min: 1, max: 25, default: 10 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['versions']) ? payload : null
});

module.exports = { chromeReleaseHistory };
if (require.main === module) cli();
