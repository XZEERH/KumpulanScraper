#!/usr/bin/env node
'use strict';

/**
 * Name : Live Fun Facts
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/fun
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate comprehensive medical fun facts about human body based on birth date
 * Note : node scrapers/nexray/fun/scrape-livefunfact.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/fun/livefunfact';
const { scrape: nexrayFunLivefunfact, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    birthdate: { required: true }
  }
});

module.exports = { nexrayFunLivefunfact };
if (require.main === module) cli();
