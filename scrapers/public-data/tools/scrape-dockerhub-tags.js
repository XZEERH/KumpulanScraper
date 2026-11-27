#!/usr/bin/env node
'use strict';

/**
 * Name : Docker Hub Image Tags
 * Creator : lmavour
 * Source : https://docs.docker.com/reference/api/hub/latest/
 * Base Web : https://hub.docker.com
 * Type : Scraper
 * Description : Membaca tag image publik Docker Hub tanpa menarik atau menjalankan image.
 * Note : node scrapers/public-data/tools/scrape-dockerhub-tags.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://hub.docker.com/v2/namespaces/{namespace}/repositories/{repository}/tags';
const { scrape: dockerhubTags, cli } = jsonEndpoint(ENDPOINT, {
  source: 'dockerhub', interval: 1500,
  params: {
    namespace: { default: 'library', pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') },
    repository: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') },
    page_size: { min: 1, max: 25, default: 5 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['results']) ? payload : null
});

module.exports = { dockerhubTags };
if (require.main === module) cli();
