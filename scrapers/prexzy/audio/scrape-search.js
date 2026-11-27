#!/usr/bin/env node
'use strict';

/**
 * Name : FreeSound Search
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Search for free sounds and audio effects
 * Note : node scrapers/prexzy/audio/scrape-search.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/sound/search';
const { scrape: prexzyAudioSearch, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    query: { required: true }
  }
});

module.exports = { prexzyAudioSearch };
if (require.main === module) cli();
