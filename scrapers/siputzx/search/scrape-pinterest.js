#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Pinterest Siputzx
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari pin publik dan tautan media tanpa mengekspor data akun mentah.
 * Note : node scrapers/siputzx/search/scrape-pinterest.js --query "batik pattern" --type image
 */

const { jsonEndpoint, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/pinterest';
const { scrape: searchPinterest, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { query: { required: true }, type: { choices: ['image', 'video', 'gif'] } },
  mapData(data) {
    if (!Array.isArray(data)) return null;
    const pins = data.filter((item) => httpsUrl(item?.pin, ['pinterest.com', 'www.pinterest.com'])).map((item) => ({
      url: item.pin, title: item.grid_title, description: item.description, type: item.type,
      image: httpsUrl(item.image_url)?.href ?? null, video: httpsUrl(item.video_url)?.href ?? null,
      gif: httpsUrl(item.gif_url)?.href ?? null
    }));
    return pins.length ? pins : null;
  }
});

module.exports = { searchPinterest };
if (require.main === module) cli();
