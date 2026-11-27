#!/usr/bin/env node
'use strict';

/**
 * Name : Open Library Search
 * Creator : lmavour
 * Base Web : https://openlibrary.org/developers/api
 * Description : Pencarian buku, penulis, ISBN, edisi, dan sampul tanpa API key.
 * Note : Untuk lookup manusia, bukan bulk backend. Daftarkan penggunaan rutin sesuai panduan.
 *        SCRAPER_CONTACT dapat diisi email kontak; request dibatasi 1/detik per proses.
 */

const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'open-library';
const USAGE = 'Usage: node scrapers/integrations/scrape-openlibrary.js <search|isbn> "target" [--page 1] [--limit 10] [--language id]';

async function openlibrary(query, options = {}) {
  try {
    query = text(query, 'Target');
    const mode = choice(options.mode, 'search', ['search', 'isbn']);
    if (mode === 'isbn') {
      query = query.replace(/[\s-]/g, '').toUpperCase();
      if (!/^(?:\d{9}[\dX]|\d{13})$/.test(query)) throw new Error('ISBN harus terdiri dari 10 atau 13 karakter');
      const sum = [...query].reduce((total, digit, index) => total + (digit === 'X' ? 10 : Number(digit)) *
        (query.length === 10 ? 10 - index : (index % 2 ? 3 : 1)), 0);
      if (sum % (query.length === 10 ? 11 : 10) !== 0) throw new Error('Checksum ISBN tidak valid');
    }
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const page = integer(options.page, 1, 1, 1000, 'Halaman');
    const language = text(options.language ?? 'id', 'Bahasa', 2).toLowerCase();
    if (!/^[a-z]{2}$/.test(language)) throw new Error('Bahasa harus berupa kode ISO 2 huruf');
    const payload = await request(urlWithParams('https://openlibrary.org/search.json', {
      ...(mode === 'isbn' ? { isbn: query } : { q: query }), limit, page, lang: language,
      fields: 'key,title,author_name,first_publish_year,edition_count,isbn,cover_i'
    }), { ...options, interval: 1000, cacheTtl: 300000 });
    if (!payload || !Array.isArray(payload.docs)) throw new Error('Respons Open Library tidak valid');
    const results = payload.docs.slice(0, limit).map((book) => ({
      id: book.key, title: book.title,
      url: `https://openlibrary.org${String(book.key).startsWith('/') ? book.key : `/works/${book.key}`}`,
      authors: book.author_name || [], firstPublished: book.first_publish_year ?? null,
      editionCount: book.edition_count ?? null, isbn: (book.isbn || []).slice(0, 10),
      cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null
    }));
    return { status: true, source: SOURCE, mode, query, page, available: payload.numFound ?? payload.num_found, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { openlibrary };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => openlibrary(args._.slice(1).join(' '), { ...args, mode: args._[0] }), ['page', 'language']);
