#!/usr/bin/env node
'use strict';

/**
 * Name : WhatsApp Quote Maker
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate WhatsApp message screenshot image with custom sender and text.
 * Note : node scrapers/kyio/maker/scrape-qwa.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/qwa';
const { scrape: makerQwa, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST', 'GET'],
  params: {
    message: { required: true },
    sender_name: {},
    sender_number: {},
    time: {},
    sender_avatar: {},
    sender_image: {},
    background: {},
    quoted_message: {},
    quoted_name: {},
    quoted_number: {},
    quoted_image: {}
  }
});

module.exports = { makerQwa };
if (require.main === module) cli();
