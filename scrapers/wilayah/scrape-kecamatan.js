#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Kecamatan
 * Creator : lmavour
 * Source : https://wilayah.id/
 * Base Web : https://wilayah.id
 * Type : Scraper
 * Description : Mengambil kecamatan berdasarkan kode kabupaten atau kota.
 * Note : node scrapers/wilayah/scrape-kecamatan.js --kode 31.71
 */

const { jsonEndpoint, hasText } = require('../lib/scraper-utils');
const ENDPOINT = 'https://wilayah.id/api/districts/{kode}.json';
const { scrape: daftarKecamatan, cli } = jsonEndpoint(ENDPOINT, {
  source: 'wilayah-id', interval: 1000,
  params: { kode: { required: true, pattern: /^\d{2}\.\d{2}$/ } },
  selectData: (payload) => payload?.meta?.administrative_area_level === 3
    ? { regions: payload.data, updatedAt: payload.meta.updated_at ?? null } : null,
  validateData: ({ regions }, { kode }) => Array.isArray(regions) && regions.length > 0 && regions.every((region) =>
    typeof region?.code === 'string' && /^\d{2}\.\d{2}\.\d{2}$/.test(region.code) && region.code.startsWith(`${kode}.`) && hasText(region.name))
});

module.exports = { daftarKecamatan };
if (require.main === module) cli();
