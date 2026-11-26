#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Khutbah MUI
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan judul dan tautan naskah khutbah dari MUI.
 * Note : node scrapers/apiku/islami/scrape-khutbah.js --page 1 --limit 3
 */

const { apikuEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/khutbah';
const { scrape: khutbah, cli } = apikuEndpoint(ENDPOINT, {
  params: { page: { min: 1, max: 1000 }, limit: { min: 1, max: 20, default: 10 } },
  mapData: ({ data }, { limit }) => {
    if (!Array.isArray(data?.data)) return null;
    const results = data.data.filter((item) => hasText(item?.title) && httpsUrl(item.url, ['mui.or.id', 'www.mui.or.id']))
      .slice(0, limit).map(({ title, url, date, category }) => ({ title, url, date, category }));
    return data.data.length && !results.length ? null : { page: data.page, total: data.total, results };
  }
});

module.exports = { khutbah };
if (require.main === module) cli();
