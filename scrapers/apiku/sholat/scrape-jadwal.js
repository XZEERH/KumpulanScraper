#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal Salat ApiKu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil jadwal salat kota atau kabupaten di Indonesia untuk satu bulan.
 * Note : node scrapers/apiku/sholat/scrape-jadwal.js --kota Bogor --bulan 11 --tahun 2026
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/sholat/jadwal';
const { scrape: jadwalSholat, cli } = apikuEndpoint(ENDPOINT, {
  params: { kota: { required: true, maxLength: 100 }, bulan: { min: 1, max: 12 }, tahun: { min: 1900, max: 2100 } },
  validateData: (data, { bulan, tahun }) => hasText(data?.kota) && Number.isSafeInteger(data.periode?.bulan) &&
    Number.isSafeInteger(data.periode.tahun) && (bulan === undefined || data.periode.bulan === bulan) &&
    (tahun === undefined || data.periode.tahun === tahun) && Array.isArray(data.jadwal_bulanan) &&
    data.jadwal_bulanan.some((row) => hasText(row?.tanggal) && /^\d{2}:\d{2}$/.test(row.subuh) && /^\d{2}:\d{2}$/.test(row.isya))
});

module.exports = { jadwalSholat };
if (require.main === module) cli();
