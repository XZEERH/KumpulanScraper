#!/usr/bin/env node
'use strict';

/**
 * Name : Rust Crate Metadata
 * Creator : lmavour
 * Source : https://crates.io/data-access
 * Base Web : https://crates.io
 * Type : Scraper
 * Description : Membaca rilis, kategori, versi dan informasi crate Rust.
 * Note : node scrapers/public-data/tools/scrape-crates-package.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://crates.io/api/v1/crates/{crate}';
const { scrape: cratesPackage, cli } = jsonEndpoint(ENDPOINT, {
  source: 'crates', interval: 1500,
  params: {
    crate: { required: true, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && typeof payload?.['crate']?.['max_version'] === 'string' && payload?.['crate']?.['max_version'].trim().length > 0 ? payload : null
});

module.exports = { cratesPackage };
if (require.main === module) cli();
