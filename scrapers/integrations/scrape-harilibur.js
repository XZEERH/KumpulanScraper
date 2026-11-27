#!/usr/bin/env node
'use strict';

/**
 * Name : Hari Libur Indonesia
 * Creator : lmavour
 * Base Web : https://github.com/guangrei/APIHariLibur_V2
 * Description : Kalender libur/perayaan Indonesia dari JSON publik tanpa API key.
 * Note : Data komunitas berbasis Google Calendar, bukan keputusan resmi pemerintah.
 *        Status "belum pasti" dipertahankan untuk tanggal yang masih tentatif.
 */

const { request, choice, integer, isoDate, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'hari-libur';
const USAGE = 'Usage: node scrapers/integrations/scrape-harilibur.js 2026 [--mode holidays|calendar] [--month 12] [--date YYYY-MM-DD]';

async function hariLibur(year = new Date().getFullYear(), options = {}) {
  try {
    year = integer(year, NaN, 1970, 2100, 'Tahun');
    const mode = choice(options.mode, 'holidays', ['holidays', 'calendar']);
    const month = options.month === undefined ? null : integer(options.month, NaN, 1, 12, 'Bulan');
    const date = options.date === undefined ? null : isoDate(options.date);
    if (date && Number(date.slice(0, 4)) !== year) throw new Error('Tahun pada tanggal harus sama dengan tahun yang diminta');
    const payload = await request(`https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/${mode}.json`, {
      ...options, interval: 1000, cacheTtl: 3600000
    });
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Dataset kalender tidak valid');
    const entries = Object.entries(payload).filter(([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof value?.summary === 'string');
    if (!entries.length) throw new Error('Struktur dataset kalender berubah');
    const availableYears = [...new Set(entries.map(([key]) => Number(key.slice(0, 4))))].sort();
    if (!availableYears.includes(year)) throw new Error(`Tahun ${year} belum tersedia; tahun tersedia: ${availableYears.join(', ')}`);
    const results = entries.filter(([key]) => Number(key.slice(0, 4)) === year && (!month || Number(key.slice(5, 7)) === month) && (!date || key === date))
      .sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => ({
        date: key, name: value.summary,
        jointHoliday: /cuti bersama|joint holiday/i.test(value.summary),
        tentative: /belum pasti/i.test(value.summary)
      }));
    return { status: true, source: SOURCE, year, mode, availableYears, updatedAt: payload.info?.updated || null, attribution: 'guangrei / APIHariLibur_V2 / Google Calendar', total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { hariLibur };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => hariLibur(args._[0], args), ['mode', 'month', 'date']);
