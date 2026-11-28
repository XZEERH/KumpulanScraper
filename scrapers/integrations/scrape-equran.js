#!/usr/bin/env node
'use strict';

/**
 * Name : EQuran
 * Creator : lmavour
 * Base Web : https://equran.id/apidev/v2
 * Description : Surat, ayat, tafsir, URL audio, dan jadwal salat tanpa API key.
 * Jadwal salat : https://equran.id/apidev/shalat
 */

const { request, choice, integer, text, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'equran';
const USAGE = `Usage: node scrapers/integrations/scrape-equran.js <list|surat|tafsir> [nomor-surat]
       node scrapers/integrations/scrape-equran.js shalat <provinsi> <kabupaten/kota> [--bulan 11] [--tahun 2026]`;

async function equran(mode = 'list', options = {}) {
  try {
    mode = choice(mode, 'list', ['list', 'surat', 'tafsir', 'shalat']);
    if (mode === 'shalat') {
      const provinsi = text(options.provinsi, 'Provinsi', 100);
      const kabkota = text(options.kabkota, 'Kabupaten/kota', 100);
      const bulan = options.bulan === undefined ? undefined : integer(options.bulan, NaN, 1, 12, 'Bulan');
      const tahun = options.tahun === undefined ? undefined : integer(options.tahun, NaN, 1000, 9999, 'Tahun');
      const payload = await request('https://equran.id/api/v2/shalat', {
        timeout: options.timeout, contact: options.contact, interval: 500, cacheTtl: 3600000,
        // Do not cache a request whose month or year is relative to today.
        cache: options.cache !== false && bulan !== undefined && tahun !== undefined,
        jsonBody: { provinsi, kabkota, bulan, tahun }
      });
      const data = payload?.data;
      if (payload?.code !== 200 || !Array.isArray(data?.jadwal) || !data.jadwal.length ||
        (bulan !== undefined && data.bulan !== bulan) || (tahun !== undefined && data.tahun !== tahun)) {
        throw new Error('Jadwal salat EQuran tidak valid atau tidak tersedia untuk periode ini');
      }
      return { status: true, source: SOURCE, mode, attribution: 'EQuran.id', data };
    }
    const id = mode === 'list' ? null : integer(options.surah, NaN, 1, 114, 'Nomor surat');
    const endpoint = mode === 'tafsir' ? 'tafsir' : 'surat';
    const payload = await request(`https://equran.id/api/v2/${endpoint}${id ? `/${id}` : ''}`, {
      ...options, interval: 500, cacheTtl: 3600000
    });
    const data = payload?.data;
    const valid = mode === 'list' ? Array.isArray(data) : data?.nomor === id && Array.isArray(data[mode === 'tafsir' ? 'tafsir' : 'ayat']);
    if (payload?.code !== 200 || !valid) {
      throw new Error('Data EQuran tidak valid atau tidak tersedia');
    }
    return { status: true, source: SOURCE, mode, attribution: 'EQuran.id / Kementerian Agama RI', data: payload.data };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { equran };
if (require.main === module) {
  runCLI(SOURCE, USAGE, (args) => {
    const [mode, target, kabkota] = args._;
    return equran(mode, { ...args, surah: target, provinsi: target, kabkota });
  }, ['bulan', 'tahun']);
}
