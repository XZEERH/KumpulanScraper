#!/usr/bin/env node
'use strict';

/**
 * Name : Website Screenshot
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Capture a screenshot of a given website URL
 * Note : node scrapers/nexray/tools/scrape-ssweb.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/ssweb';
const { scrape: nexrayToolsSsweb, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true },
    width: {},
    height: {},
    device_scale: {}
  }
});

module.exports = { nexrayToolsSsweb };
if (require.main === module) cli();
