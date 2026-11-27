#!/usr/bin/env node
'use strict';

/**
 * Name : Github
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Stalker github untuk mencari akun github
 * Note : node scrapers/nexray/stalker/scrape-github.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/github';
const { scrape: nexrayStalkerGithub, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerGithub };
if (require.main === module) cli();
