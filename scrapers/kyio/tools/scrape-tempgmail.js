#!/usr/bin/env node
'use strict';

/**
 * Name : Temporary Gmail Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate temporary Gmail, Outlook, or Hotmail addresses and check inbox.
 * Note : node scrapers/kyio/tools/scrape-tempgmail.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/tempgmail';
const { scrape: toolsTempgmail, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: { required: true },
    provider: {},
    email: {},
    dot: {},
    plus: {},
    wait: {}
  }
});

module.exports = { toolsTempgmail };
if (require.main === module) cli();
