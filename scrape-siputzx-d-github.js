#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub ZIP Downloader
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil metadata dan tautan arsip ZIP dari repositori GitHub publik.
 * Note : node scrape-siputzx-d-github.js --url "https://github.com/sindresorhus/is-png"
 */

const { jsonEndpoint, httpsUrl } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/d/github';
const { scrape: downloadGithub, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1800, cache: false,
  params: {
    url: { required: true, type: 'https-url', hosts: ['github.com', 'www.github.com'], path: /^\/[\w.-]+\/[\w.-]+\/?$/ }
  },
  validateData(data) {
    const link = httpsUrl(data?.download_url, ['github.com', 'codeload.github.com']);
    return link && (link.hostname === 'github.com'
      ? /^\/[^/]+\/[^/]+\/archive\/.+\.zip$/i.test(link.pathname)
      : /^\/[^/]+\/[^/]+\/zip\/.+/.test(link.pathname));
  }
});

module.exports = { downloadGithub };
if (require.main === module) cli();
