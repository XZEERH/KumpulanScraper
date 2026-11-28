#!/usr/bin/env node
'use strict';

/**
 * Name : Job Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for latest jobs from JobStreet Indonesia.
 * Note : node scrapers/kyio/search/scrape-jobstreet.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/jobstreet';
const { scrape: searchJobstreet, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    job: { required: true, aliases: ['q', 'query', 'keyword', 'posisi'] },
    city: { aliases: ['location', 'where', 'kota'] }
  }
});

module.exports = { searchJobstreet };
if (require.main === module) cli();
