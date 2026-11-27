#!/usr/bin/env node
'use strict';

/**
 * Name : Getcontact Caller & Tags Lookup
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Lacak identitas nama penampil, tag kontak (Getcontact), status spam, dan kuota nomor telepon.
 * Note : node scrapers/kyio/tools/scrape-getcontact.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/getcontact';
const { scrape: toolsGetcontact, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    phone: {},
    action: {}
  }
});

module.exports = { toolsGetcontact };
if (require.main === module) cli();
