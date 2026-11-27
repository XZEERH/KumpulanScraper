#!/usr/bin/env node
'use strict';

/**
 * Name : Naskah Khutbah MUI
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Membaca naskah khutbah dari URL artikel MUI yang ditemukan di scrape-khutbah.js.
 * Note : node scrapers/apiku/islami/scrape-khutbah-detail.js --url "https://mui.or.id/baca/khutbah/<slug>"
 */

const { apikuEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/khutbah/detail';
const hosts = ['mui.or.id', 'www.mui.or.id'];
const { scrape: khutbahDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: { url: { required: true, type: 'https-url', hosts, path: /^\/baca\/(?:[a-z\d-]+\/)*[a-z\d-]+\/?$/i } },
  mapData: ({ data }) => {
    if (!hasText(data?.title) || !httpsUrl(data.url, hosts) || !Array.isArray(data.paragraphs)) return null;
    const paragraphs = data.paragraphs.filter(hasText);
    return paragraphs.length ? { title: data.title, url: data.url, date: data.date, paragraphs } : null;
  }
});

module.exports = { khutbahDetail };
if (require.main === module) cli();
