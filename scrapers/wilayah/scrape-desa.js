#!/usr/bin/env node
'use strict';

/**
 * Name : Daftar Desa dan Kelurahan
 * Source : https://wilayah.id/
 * Base Web : https://wilayah.id
 * Type : Scraper
 * Description : Mengambil desa dan kelurahan beserta kode adm4 berdasarkan kode kecamatan.
 * Note : node scrapers/wilayah/scrape-desa.js --kode 31.71.03
 */

const { jsonEndpoint, hasText } = require('../lib/scraper-utils');
const ENDPOINT = 'https://wilayah.id/api/villages/{kode}.json';
const { scrape: daftarDesa, cli } = jsonEndpoint(ENDPOINT, {
  source: 'wilayah-id', interval: 1000,
  params: { kode: { required: true, pattern: /^\d{2}\.\d{2}\.\d{2}$/ } },
  selectData: (payload) => payload?.meta?.administrative_area_level === 4
    ? { regions: payload.data, updatedAt: payload.meta.updated_at ?? null } : null,
  validateData: ({ regions }, { kode }) => Array.isArray(regions) && regions.length > 0 && regions.every((region) =>
    typeof region?.code === 'string' && /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(region.code) && region.code.startsWith(`${kode}.`) && hasText(region.name))
});

module.exports = { daftarDesa };
if (require.main === module) cli();
