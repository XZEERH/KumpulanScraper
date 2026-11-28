#!/usr/bin/env node
'use strict';

/**
 * Name : NPM Package
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get NPM package information and version details
 * Note : node scrapers/nexray/stalker/scrape-npmjs.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/npmjs';
const { scrape: nexrayStalkerNpmjs, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    name: { required: true }
  }
});

module.exports = { nexrayStalkerNpmjs };
if (require.main === module) cli();
