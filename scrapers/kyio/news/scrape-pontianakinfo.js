#!/usr/bin/env node
'use strict';

/**
 * Name : Pontianak Info
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest local news from Pontianak Informasi
 * Note : node scrapers/kyio/news/scrape-pontianakinfo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/news/pontianakinfo';
const { scrape: newsPontianakinfo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsPontianakinfo };
if (require.main === module) cli();
