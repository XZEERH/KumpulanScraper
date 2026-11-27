#!/usr/bin/env node
'use strict';

/**
 * Name : Avatar Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate unique stylized avatars based on any text seed powered by DiceBear.
 * Note : node scrapers/kyio/maker/scrape-avatar.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/avatar';
const { scrape: makerAvatar, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    style: {}
  }
});

module.exports = { makerAvatar };
if (require.main === module) cli();
