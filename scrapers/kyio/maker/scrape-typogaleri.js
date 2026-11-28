#!/usr/bin/env node
'use strict';

/**
 * Name : Typography Galeri Video
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate aesthetic typography gallery panorama video from image or video with floating photo cards, live background, and ambient soundscape. Dev: Riki.
 * Note : node scrapers/kyio/maker/scrape-typogaleri.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/typogaleri';
const { scrape: makerTypogaleri, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    judul: {},
    tempat: {},
    text: {},
    author: {},
    duration: {}
  }
});

module.exports = { makerTypogaleri };
if (require.main === module) cli();
