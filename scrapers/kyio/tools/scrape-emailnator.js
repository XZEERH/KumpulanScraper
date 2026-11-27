#!/usr/bin/env node
'use strict';

/**
 * Name : Emailnator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate temporary emails and read their inboxes
 * Note : node scrapers/kyio/tools/scrape-emailnator.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/emailnator';
const { scrape: toolsEmailnator, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    email: {},
    id: {}
  }
});

module.exports = { toolsEmailnator };
if (require.main === module) cli();
