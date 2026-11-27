#!/usr/bin/env node
'use strict';

/**
 * Name : G-Drive Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate a direct download link for Google Drive files.
 * Note : node scrapers/kyio/downloader/scrape-gdrive.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/gdrive';
const { scrape: downloaderGdrive, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderGdrive };
if (require.main === module) cli();
