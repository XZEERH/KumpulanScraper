#!/usr/bin/env node
'use strict';

/**
 * Name : Wikipedia Search
 * Creator : lmavour
 * Source : https://www.mediawiki.org/wiki/API:REST_API/Reference
 * Base Web : https://wikipedia.org
 * Type : Scraper
 * Description : Mencari artikel Wikipedia dan mengembalikan tautan serta cuplikan teks.
 * Note : node scrapers/kangwifi/search/scrape-wikipedia.js --q Indonesia --lang id --limit 3
 */

const { load } = require('cheerio');
const { request, text, hasText, choice, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const SOURCE = 'wikipedia';
const LANGUAGES = ['id', 'en', 'ms', 'jv', 'su', 'ar', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'zh'];

async function wikipedia(options = {}) {
  try {
    const q = text(options.q, 'Kata kunci', 150);
    const lang = choice(options.lang, 'id', LANGUAGES, 'Bahasa');
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const base = `https://${lang}.wikipedia.org`;
    const payload = await request(urlWithParams(`${base}/w/rest.php/v1/search/page`, { q, limit }), {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 300000, redirect: 'error'
    });
    if (!Array.isArray(payload?.pages)) throw new Error('Respons Wikipedia bukan daftar artikel');
    const results = payload.pages.filter((page) => Number.isSafeInteger(page?.id) && page.id > 0 && hasText(page.title))
      .slice(0, limit).map((page) => {
        const image = page.thumbnail?.url;
        const thumbnail = httpsUrl(typeof image === 'string' && image.startsWith('//') ? `https:${image}` : image, ['upload.wikimedia.org']);
        return {
          id: page.id, title: page.title, description: page.description ?? null,
          excerpt: typeof page.excerpt === 'string' ? load(page.excerpt, null, false).text().trim() : null,
          url: `${base}/?curid=${page.id}`, thumbnail: thumbnail?.href ?? null
        };
      });
    return { status: true, source: SOURCE, attribution: 'Wikipedia; ikuti lisensi artikel dan gambar masing-masing', data: { q, lang, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { wikipedia };
if (require.main === module) runOptionsCLI(SOURCE, '--q <kata kunci> [--lang id] [--limit 5]', wikipedia, ['q', 'lang']);
