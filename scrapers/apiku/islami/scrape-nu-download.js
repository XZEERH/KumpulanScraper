#!/usr/bin/env node
'use strict';

/**
 * Name : Katalog Dokumen NU Online
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan tautan PDF dan audio dari penyimpanan resmi NU, tanpa mengunduh file.
 * Note : node scrapers/apiku/islami/scrape-nu-download.js --category produk-hukum
 */

const { apikuEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/nu-download';
const { scrape: nuDownload, cli } = apikuEndpoint(ENDPOINT, {
  params: {
    category: { choices: ['atribut', 'buku-dan-kitab', 'amaliyah-nu', 'produk-hukum', 'lagu-mars-dan-himne'], default: 'produk-hukum' },
    q: { maxLength: 150 }
  },
  mapData: ({ data }) => {
    if (!Array.isArray(data?.data)) return null;
    const results = data.data.filter((file) => hasText(file?.title) && /^(?:pdf|mp3)$/i.test(file.file_type) &&
      httpsUrl(file.file_url, ['storage.nu.or.id'])).map(({ title, file_url, file_type }) => ({ title, url: file_url, type: file_type }));
    return data.data.length && !results.length ? null : { category: data.category, results };
  }
});

module.exports = { nuDownload };
if (require.main === module) cli();
