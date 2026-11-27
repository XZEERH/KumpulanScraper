#!/usr/bin/env node
'use strict';

/**
 * Name : JWT Parser / Decoder
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Decode isi dari JSON Web Token (Header & Payload) tanpa signature.
 * Note : node scrapers/kyio/tools/scrape-jwt.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/jwt';
const { scrape: toolsJwt, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    token: {},
    q: {}
  }
});

module.exports = { toolsJwt };
if (require.main === module) cli();
