#!/usr/bin/env node
'use strict';

/**
 * Name : WhatsApp Channel
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch detailed metadata from a public WhatsApp Channel URL
 * Note : node scrapers/kyio/tools/scrape-whatsappchannel.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/whatsappchannel';
const { scrape: toolsWhatsappchannel, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { toolsWhatsappchannel };
if (require.main === module) cli();
