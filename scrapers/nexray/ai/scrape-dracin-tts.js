#!/usr/bin/env node
'use strict';

/**
 * Name : Dracin Tts
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat suara dracin
 * Note : node scrapers/nexray/ai/scrape-dracin-tts.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/dracin-tts';
const { scrape: nexrayAiDracinTts, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true },
    speed: {},
    volume: {},
    music: {}
  }
});

module.exports = { nexrayAiDracinTts };
if (require.main === module) cli();
