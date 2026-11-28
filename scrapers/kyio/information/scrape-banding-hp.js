#!/usr/bin/env node
'use strict';

/**
 * Name : Compare Phones
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Bandingkan dua HP secara detail dari Carisinyal.
 * Note : node scrapers/kyio/information/scrape-banding-hp.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/banding-hp';
const { scrape: informationBandingHp, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q1: { required: true },
    q2: { required: true }
  }
});

module.exports = { informationBandingHp };
if (require.main === module) cli();
