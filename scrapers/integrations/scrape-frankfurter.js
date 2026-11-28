#!/usr/bin/env node
'use strict';

/**
 * Name : Frankfurter
 * Creator : lmavour
 * Base Web : https://frankfurter.dev/
 * Description : Kurs referensi dan konversi mata uang tanpa API key.
 * Note : Bukan kurs transaksi bank atau harga trading realtime.
 */

const { request, text, isoDate, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'frankfurter';
const USAGE = 'Usage: node scrapers/integrations/scrape-frankfurter.js USD IDR [jumlah] [--date YYYY-MM-DD]';

async function frankfurter(base, quote, options = {}) {
  try {
    base = text(base, 'Mata uang asal', 3).toUpperCase();
    quote = text(quote, 'Mata uang tujuan', 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) throw new Error('Kode mata uang harus terdiri dari 3 huruf');
    const amount = options.amount === undefined ? 1 : Number(options.amount);
    if ((options.amount !== undefined && !['number', 'string'].includes(typeof options.amount)) ||
      (typeof options.amount === 'string' && !options.amount.trim()) || !Number.isFinite(amount) || amount < 0) {
      throw new Error('Jumlah harus berupa angka non-negatif yang finite');
    }
    const date = options.date === undefined ? undefined : isoDate(options.date);
    const payload = await request(urlWithParams(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, { date }), {
      ...options, interval: 500, cacheTtl: 300000
    });
    if (!payload || !Number.isFinite(payload.rate) || payload.rate <= 0 || !payload.date || payload.base !== base || payload.quote !== quote) {
      throw new Error('Kurs Frankfurter tidak valid');
    }
    const converted = amount * payload.rate;
    if (!Number.isFinite(converted)) throw new Error('Jumlah terlalu besar untuk dikonversi');
    return { status: true, source: SOURCE, base, quote, amount, rate: payload.rate, converted, date: payload.date };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { frankfurter };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => frankfurter(args._[0], args._[1], { ...args, amount: args._[2] }), ['date']);
