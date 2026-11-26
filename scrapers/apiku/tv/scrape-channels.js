#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Channel TV
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan nama dan kode stasiun TV Indonesia untuk mencari jadwal tayang.
 * Note : node scrapers/apiku/tv/scrape-channels.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tv/channels';
const { scrape: tvChannels, cli } = apikuEndpoint(ENDPOINT, {
  validateData: (data) => Array.isArray(data) && data.length > 0 && data.every((item) => hasText(item?.id) && hasText(item.name))
});

module.exports = { tvChannels };
if (require.main === module) cli();
