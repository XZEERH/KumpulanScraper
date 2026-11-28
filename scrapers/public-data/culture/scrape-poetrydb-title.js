#!/usr/bin/env node
'use strict';

/**
 * Name : PoetryDB Title Lookup
 * Creator : lmavour
 * Source : https://github.com/thundercomb/poetrydb#readme
 * Base Web : https://poetrydb.org
 * Type : Scraper
 * Description : Find poems by exact title in PoetryDB and return authors and the poem lines.
 * Note : node scrapers/public-data/culture/scrape-poetrydb-title.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://poetrydb.org/title/{title}:abs';
const { scrape: poetrydbTitle, cli } = jsonEndpoint(ENDPOINT, {
  source: 'poetrydb', interval: 1500,
  params: {
    title: { required: true, maxLength: 100, pattern: new RegExp('^(?!\\.{1,2}$).+$') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { poetrydbTitle };
if (require.main === module) cli();
