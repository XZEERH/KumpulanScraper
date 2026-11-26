#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian MCPEDL
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari entri add-on dan konten Minecraft dari katalog MCPEDL.
 * Note : node scrapers/siputzx/search/scrape-mcpedl.js --q shaders
 */

const { jsonEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/mcpedl';
const { scrape: searchMcpedl, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { q: { required: true } },
  validateData: (data) => Array.isArray(data) && data.some((item) => hasText(item?.title) && httpsUrl(item.link))
});

module.exports = { searchMcpedl };
if (require.main === module) cli();
