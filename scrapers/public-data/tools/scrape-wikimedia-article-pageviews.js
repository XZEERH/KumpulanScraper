#!/usr/bin/env node
'use strict';

/**
 * Name : Wikipedia Article Pageviews
 * Creator : lmavour
 * Source : https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/examples/page-metrics.html
 * Base Web : https://wikimedia.org
 * Type : Scraper
 * Description : Get daily human pageview counts for an article on a Wikipedia language edition.
 * Note : node scrapers/public-data/tools/scrape-wikimedia-article-pageviews.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/{project}/all-access/user/{article}/daily/{start}/{end}';
const { scrape: wikimediaArticlePageviews, cli } = jsonEndpoint(ENDPOINT, {
  source: 'wikimedia-analytics', interval: 1500,
  params: {
    project: { maxLength: 48, default: 'en.wikipedia.org', pattern: new RegExp('^(?!\\.{1,2}$)(?:^[a-z0-9]+(?:-[a-z0-9]+)*\\.wikipedia\\.org$)') },
    article: { required: true, maxLength: 200, pattern: new RegExp('^(?!\\.{1,2}$).+$') },
    start: { required: true, maxLength: 8, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[0-9]{4}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])$)') },
    end: { required: true, maxLength: 8, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[0-9]{4}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['items']) ? payload : null
});

module.exports = { wikimediaArticlePageviews };
if (require.main === module) cli();
