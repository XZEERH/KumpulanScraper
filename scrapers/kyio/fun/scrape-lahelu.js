#!/usr/bin/env node
'use strict';

/**
 * Name : Lahelu
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Browse and search memes from Lahelu Indonesian meme community.
 * Note : node scrapers/kyio/fun/scrape-lahelu.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/lahelu';
const { scrape: funLahelu, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: {},
    type: {},
    page: {}
  }
});

module.exports = { funLahelu };
if (require.main === module) cli();
