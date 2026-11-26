#!/usr/bin/env node
'use strict';

/**
 * Name : Katalog Kitab Maulid
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil judul, pengarang, dan tautan kitab maulid dari katalog NU Online.
 * Note : node scrapers/apiku/islami/scrape-maulid-books.js
 */

const { apikuEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/maulid/books';
const { scrape: maulidBooks, cli } = apikuEndpoint(ENDPOINT, {
  mapData: ({ data }) => {
    if (!Array.isArray(data)) return null;
    const books = data.filter((book) => hasText(book?.name) && httpsUrl(book.url, ['quran.nu.or.id']));
    return books.length ? books : null;
  }
});

module.exports = { maulidBooks };
if (require.main === module) cli();
