#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Photo
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mencari foto di TikTok
 * Note : node scrapers/nexray/search/scrape-tiktokphoto.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/tiktokphoto';
const { scrape: nexraySearchTiktokphoto, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchTiktokphoto };
if (require.main === module) cli();
