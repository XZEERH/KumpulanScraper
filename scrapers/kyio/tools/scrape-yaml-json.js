#!/usr/bin/env node
'use strict';

/**
 * Name : YAML to JSON
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Konversi string YAML ke format JSON terstruktur.
 * Note : node scrapers/kyio/tools/scrape-yaml-json.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/yaml-json';
const { scrape: toolsYamlJson, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  params: {
    yaml: { required: true }
  }
});

module.exports = { toolsYamlJson };
if (require.main === module) cli();
