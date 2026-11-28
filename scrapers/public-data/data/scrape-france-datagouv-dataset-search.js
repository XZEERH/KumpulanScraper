#!/usr/bin/env node
'use strict';

/**
 * Name : France Data.gouv.fr Dataset Search
 * Creator : lmavour
 * Source : https://guides.data.gouv.fr/api-de-data.gouv.fr/reference/datasets
 * Base Web : https://www.data.gouv.fr
 * Type : Scraper
 * Description : Search open datasets published in France's national data catalog.
 * Note : node scrapers/public-data/data/scrape-france-datagouv-dataset-search.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://www.data.gouv.fr/api/1/datasets/?access_type=open';
const { scrape: franceDatagouvDatasetSearch, cli } = jsonEndpoint(ENDPOINT, {
  source: 'data-gouv-fr', interval: 1500,
  params: {
    q: { required: true, maxLength: 180 },
    page_size: { type: 'number', min: 1, max: 25, default: 10 },
    page: { type: 'number', min: 1, max: 50, default: 1 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['data']) ? payload : null
});

module.exports = { franceDatagouvDatasetSearch };
if (require.main === module) cli();
