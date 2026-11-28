#!/usr/bin/env node
'use strict';

/**
 * Name : Firefox Add-on Search
 * Creator : lmavour
 * Source : https://mozilla.github.io/addons-server/topics/api/addons.html#search
 * Base Web : https://addons.mozilla.org
 * Type : Scraper
 * Description : Mencari ekstensi dan tema publik untuk Firefox.
 * Note : node scrapers/public-data/search/scrape-firefox-addon-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://addons.mozilla.org/api/v5/addons/search/';
const { scrape: firefoxAddonSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'mozilla-amo', interval: 1500,
  params: {
    q: { required: true },
    page_size: { min: 1, max: 25, default: 5 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['results']) ? payload : null
});

module.exports = { firefoxAddonSearch };
if (require.main === module) cli();
