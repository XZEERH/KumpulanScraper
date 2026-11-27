#!/usr/bin/env node
'use strict';

/**
 * Name : IQC Image Maker
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Buat gambar IQC dari foto
 * Note : node scrapers/kyio/maker/scrape-iqc.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/iqc';
const { scrape: makerIqc, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    text: { required: true }
  }
});

module.exports = { makerIqc };
if (require.main === module) cli();
