#!/usr/bin/env node
'use strict';

/**
 * Name : SiPongi+ Karhutla & Hotspot
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Real-time satellite monitoring of forest and land fire hotspots (Karhutla) and CO2 emissions in Indonesia from KLHK.
 * Note : node scrapers/kyio/information/scrape-sipongi.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/sipongi';
const { scrape: informationSipongi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    type: {},
    q: {}
  }
});

module.exports = { informationSipongi };
if (require.main === module) cli();
