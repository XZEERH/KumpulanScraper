#!/usr/bin/env node
'use strict';

/**
 * Name : GitClone Tool
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download zip archive from a public GitHub repository.
 * Note : node scrapers/kyio/tools/scrape-gitclone.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/gitclone';
const { scrape: toolsGitclone, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { toolsGitclone };
if (require.main === module) cli();
