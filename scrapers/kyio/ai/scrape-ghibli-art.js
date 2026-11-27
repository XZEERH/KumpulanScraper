#!/usr/bin/env node
'use strict';

/**
 * Name : Ghibli AI Anime Photo Filter
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ubah foto menjadi ilustrasi Studio Ghibli dengan 9 preset mood: ghibli, sky, forest, mystical, fantasy, vintage, ocean, nature, dreamy.
 * Note : node scrapers/kyio/ai/scrape-ghibli-art.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/ghibli-art';
const { scrape: aiGhibliArt, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    image: {},
    mood: {},
    prompt: {},
    intensity: {},
    action: {},
    job_id: {},
    appcheck: {},
    json: {}
  }
});

module.exports = { aiGhibliArt };
if (require.main === module) cli();
