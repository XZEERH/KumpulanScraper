#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Kabupaten dan Kota
 * Creator : lmavour
 * Source : https://wilayah.id/
 * Base Web : https://wilayah.id
 * Type : Scraper
 * Description : Mengambil kabupaten dan kota berdasarkan kode provinsi.
 * Note : node scrapers/wilayah/scrape-kabupaten.js --kode 31
 */

const { jsonEndpoint, hasText } = require('../lib/scraper-utils');
const ENDPOINT = 'https://wilayah.id/api/regencies/{kode}.json';
const { scrape: daftarKabupaten, cli } = jsonEndpoint(ENDPOINT, {
  source: 'wilayah-id', interval: 1000,
  params: { kode: { required: true, pattern: /^\d{2}$/ } },
  selectData: (payload) => payload?.meta?.administrative_area_level === 2
    ? { regions: payload.data, updatedAt: payload.meta.updated_at ?? null } : null,
  validateData: ({ regions }, { kode }) => Array.isArray(regions) && regions.length > 0 && regions.every((region) =>
    typeof region?.code === 'string' && /^\d{2}\.\d{2}$/.test(region.code) && region.code.startsWith(`${kode}.`) && hasText(region.name))
});

module.exports = { daftarKabupaten };
if (require.main === module) cli();
