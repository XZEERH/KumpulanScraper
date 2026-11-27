#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Provinsi Indonesia
 * Source : https://wilayah.id/
 * Base Web : https://wilayah.id
 * Type : Scraper
 * Description : Mengambil nama dan kode provinsi dari data Wilayah.id.
 * Note : node scrapers/wilayah/scrape-provinsi.js
 */

const { jsonEndpoint, hasText } = require('../lib/scraper-utils');
const ENDPOINT = 'https://wilayah.id/api/provinces.json';
const { scrape: daftarProvinsi, cli } = jsonEndpoint(ENDPOINT, {
  source: 'wilayah-id', interval: 1000,
  selectData: (payload) => payload?.meta?.administrative_area_level === 1
    ? { regions: payload.data, updatedAt: payload.meta.updated_at ?? null } : null,
  validateData: ({ regions }) => Array.isArray(regions) && regions.length > 0 && regions.every((region) =>
    typeof region?.code === 'string' && /^\d{2}$/.test(region.code) && hasText(region.name))
});

module.exports = { daftarProvinsi };
if (require.main === module) cli();
