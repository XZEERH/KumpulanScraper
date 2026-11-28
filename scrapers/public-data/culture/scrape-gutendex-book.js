#!/usr/bin/env node
'use strict';

/**
 * Name : Project Gutenberg Book Record
 * Creator : lmavour
 * Source : https://gutendex.com/
 * Base Web : https://gutendex.com
 * Type : Scraper
 * Description : Look up a Project Gutenberg ebook by ID for its authors, subjects, rights status, and available formats.
 * Note : node scrapers/public-data/culture/scrape-gutendex-book.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://gutendex.com/books/{id}/';
const { scrape: gutendexBook, cli } = jsonEndpoint(ENDPOINT, {
  source: 'gutendex', interval: 1500,
  params: {
    id: { required: true, type: 'number', min: 1, max: 999999999 }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['title'] === 'string' && payload?.['title'].trim().length > 0 ? payload : null
});

module.exports = { gutendexBook };
if (require.main === module) cli();
