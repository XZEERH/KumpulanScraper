#!/usr/bin/env node
'use strict';

/**
 * Name : Berita Antariksa
 * Source : https://api.spaceflightnewsapi.net/v4/docs/
 * Base Web : https://www.spaceflightnewsapi.net
 * Type : Scraper
 * Description : Membaca judul, ringkasan, dan tautan asli berita antariksa dari berbagai penerbit.
 * Note : node scrapers/integrations/scrape-berita-angkasa.js --q NASA --limit 3
 */

const { request, text, hasText, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://api.spaceflightnewsapi.net/v4/articles/';
const SOURCE = 'spaceflight-news-api';

async function beritaAngkasa(options = {}) {
  try {
    const q = options.q === undefined ? undefined : text(options.q, 'Kata kunci', 150);
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const offset = integer(options.offset, 0, 0, 100000, 'Offset');
    const payload = await request(urlWithParams(ENDPOINT, { search: q, limit, offset, ordering: '-published_at' }), {
      timeout: options.timeout, cache: options.cache, cacheTtl: 300000, interval: 1000, redirect: 'error'
    });
    if (!Number.isSafeInteger(payload?.count) || payload.count < 0 || !Array.isArray(payload.results)) {
      throw new Error('Respons Spaceflight News API tidak valid');
    }
    const results = payload.results.flatMap((article) => {
      const url = httpsUrl(article?.url);
      if (!url || !Number.isSafeInteger(article.id) || !hasText(article.title)) return [];
      return [{
        id: article.id, title: article.title, summary: article.summary ?? null, publisher: article.news_site ?? null,
        publishedAt: article.published_at ?? null, url: url.href, image: httpsUrl(article.image_url)?.href ?? null
      }];
    }).slice(0, limit);
    return { status: true, source: SOURCE, data: { q: q ?? null, total: payload.count, offset,
      nextOffset: payload.next ? offset + limit : null, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { beritaAngkasa };
if (require.main === module) runOptionsCLI(SOURCE, '[--q NASA] [--limit 5] [--offset 0]', beritaAngkasa, ['q', 'offset']);
