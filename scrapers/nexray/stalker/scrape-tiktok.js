#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get TikTok user profile information
 * Note : node scrapers/nexray/stalker/scrape-tiktok.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/tiktok';
const { scrape: nexrayStalkerTiktok, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerTiktok };
if (require.main === module) cli();
