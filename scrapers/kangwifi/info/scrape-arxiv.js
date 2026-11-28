#!/usr/bin/env node
'use strict';

/**
 * Name : arXiv Paper Search
 * Creator : lmavour
 * Source : https://info.arxiv.org/help/api/user-manual.html
 * Base Web : https://arxiv.org
 * Type : Scraper
 * Description : Mencari judul, penulis, abstrak, dan tautan PDF dari feed Atom arXiv.
 * Note : node scrapers/kangwifi/info/scrape-arxiv.js --q "machine learning" --limit 3
 */

const { load } = require('cheerio');
const { request, text, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://export.arxiv.org/api/query';
const SOURCE = 'arxiv';

async function arxiv(options = {}) {
  try {
    const q = text(options.q, 'Kata kunci', 180);
    if (/["\\\u0000-\u001f]/.test(q)) throw new Error('Kata kunci arXiv tidak mendukung kutip, backslash, atau karakter kontrol');
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const xml = await request(urlWithParams(ENDPOINT, { search_query: `all:"${q}"`, max_results: limit }), {
      timeout: options.timeout, cache: options.cache, interval: 3000, cacheTtl: 600000, redirect: 'error',
      format: 'text', headers: { Accept: 'application/atom+xml' }
    });
    const $ = load(xml, { xmlMode: true });
    if (!$('feed').length) throw new Error('Respons arXiv bukan feed Atom');
    const entries = $('feed > entry').slice(0, limit).toArray();
    const results = entries.flatMap((element) => {
      const entry = $(element);
      const id = entry.children('id').text().trim().replace(/^http:\/\//, 'https://');
      const url = httpsUrl(id, ['arxiv.org']);
      const title = entry.children('title').text().replace(/\s+/g, ' ').trim();
      if (!url?.pathname.startsWith('/abs/') || !title) return [];
      const pdf = entry.children('link[title="pdf"]').attr('href')?.replace(/^http:\/\//, 'https://');
      return [{
        title, url: url.href, pdf: httpsUrl(pdf, ['arxiv.org'])?.href ?? null,
        authors: entry.children('author').map((_, author) => $(author).children('name').text().trim()).get().filter(Boolean),
        summary: entry.children('summary').text().replace(/\s+/g, ' ').trim(),
        published: entry.children('published').text().trim() || null
      }];
    });
    if (entries.length && !results.length) throw new Error('arXiv tidak mengembalikan entri publikasi yang valid');
    return { status: true, source: SOURCE, data: { q, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { arxiv };
if (require.main === module) runOptionsCLI(SOURCE, '--q <kata kunci> [--limit 5]', arxiv, ['q']);
