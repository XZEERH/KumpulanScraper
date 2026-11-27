#!/usr/bin/env node
'use strict';

/**
 * Name : Message
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/maker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate Windows-style message box image
 * Note : node scrapers/nexray/maker/scrape-msg.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/maker/msg';
const { scrape: nexrayMakerMsg, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    message: { required: true },
    title: {},
    icon: { choices: ['warning', 'error', 'information', 'question'] }
  }
});

module.exports = { nexrayMakerMsg };
if (require.main === module) cli();
