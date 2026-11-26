#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Apple Music
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari judul, artis, sampul, dan tautan resmi Apple Music.
 * Note : node scrapers/siputzx/search/scrape-siputzx-s-applemusic.js --query duka --region id
 */

const { jsonEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/applemusic';
const { scrape: searchAppleMusic, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { query: { required: true }, region: { pattern: /^[a-z]{2}$/i, normalize: (value) => value.toLowerCase() } },
  validateData: (data) => Array.isArray(data) && data.some((item) => hasText(item?.title) && httpsUrl(item.link, ['music.apple.com']))
});

module.exports = { searchAppleMusic };
if (require.main === module) cli();
