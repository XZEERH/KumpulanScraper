#!/usr/bin/env node
'use strict';

/**
 * Name : JSON to XML
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Konversi data JSON ke format XML.
 * Note : node scrapers/kyio/tools/scrape-json-xml.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/json-xml';
const { scrape: toolsJsonXml, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  params: {
    json: { required: true }
  }
});

module.exports = { toolsJsonXml };
if (require.main === module) cli();
