#!/usr/bin/env node
'use strict';

/**
 * Name : Met Object Record
 * Creator : lmavour
 * Source : https://metmuseum.github.io/
 * Base Web : https://collectionapi.metmuseum.org
 * Type : Scraper
 * Description : Look up a Met object by ID for title, maker, date, medium, and public-domain status.
 * Note : node scrapers/public-data/culture/scrape-met-artwork.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/{objectID}';
const { scrape: metArtwork, cli } = jsonEndpoint(ENDPOINT, {
  source: 'met', interval: 1500,
  params: {
    objectID: { required: true, type: 'number', min: 1, max: 999999999 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['title'] === 'string' && payload?.['title'].trim().length > 0 ? payload : null
});

module.exports = { metArtwork };
if (require.main === module) cli();
