#!/usr/bin/env node
'use strict';

/**
 * Name : Write Cream Image
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate AI images with various aspect ratios
 * Note : node scrapers/nexray/ai/scrape-writecreamimg.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/writecreamimg';
const { scrape: nexrayAiWritecreamimg, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    prompt: { required: true },
    ratio: { choices: ['1:1', '16:9', '2:3', '3:2', '4:5', '5:4', '9:16', '21:9', '9:21'] }
  }
});

module.exports = { nexrayAiWritecreamimg };
if (require.main === module) cli();
