#!/usr/bin/env node
'use strict';

/**
 * Name : Crossref Works Search
 * Source : https://www.crossref.org/documentation/retrieve-metadata/rest-api/
 * Base Web : https://api.crossref.org
 * Type : Scraper
 * Description : Mencari DOI, judul, penulis, dan tahun publikasi ilmiah.
 * Note : node scrapers/kangwifi/info/scrape-crossref.js --q "machine learning" --limit 3
 */

const { request, text, hasText, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.crossref.org/works';
const SOURCE = 'crossref';

async function crossref(options = {}) {
  try {
    const q = text(options.q, 'Kata kunci', 200);
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const payload = await request(urlWithParams(ENDPOINT, {
      'query.bibliographic': q, rows: limit, select: 'DOI,title,author,published,URL,type'
    }), { timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 600000, redirect: 'error' });
    if (payload?.status !== 'ok' || !Array.isArray(payload.message?.items)) throw new Error('Respons Crossref tidak valid');
    const results = payload.message.items.filter((item) => hasText(item?.DOI) && Array.isArray(item.title) && hasText(item.title[0])).slice(0, limit)
      .map((item) => ({
        doi: item.DOI, title: item.title[0], type: item.type ?? null,
        authors: Array.isArray(item.author) ? item.author.map((a) => [a?.given, a?.family].filter(hasText).join(' ')).filter(Boolean) : [],
        published: item.published?.['date-parts']?.[0] ?? null, url: httpsUrl(item.URL)?.href ?? null
      }));
    return { status: true, source: SOURCE, data: { q, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { crossref };
if (require.main === module) runOptionsCLI(SOURCE, '--q <judul atau penulis> [--limit 5]', crossref, ['q']);
