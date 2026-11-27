#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub Trending
 * Creator : lmavour
 * Base Web : https://github.com/trending
 * Description : Repo trending berdasarkan bahasa dan periode tanpa API key.
 * Note : Parser HTML dapat berubah; tidak mencoba melewati CAPTCHA atau rate limit.
 */

const { load } = require('cheerio');
const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'github-trending';
const USAGE = 'Usage: node scrapers/integrations/scrape-githubtrending.js <all|javascript|bahasa> [--since daily|weekly|monthly] [--limit 10]';

function parseTrending(html, limit = 10) {
  const $ = load(html);
  const number = (value) => /\d/.test(value) ? Number(value.replace(/[^\d]/g, '')) : null;
  const results = [];
  $('article.Box-row').slice(0, limit).each((_, element) => {
    const row = $(element);
    const href = row.find('h2 a').attr('href')?.trim();
    if (!/^\/[a-zA-Z\d_.-]+\/[a-zA-Z\d_.-]+$/.test(href || '')) return;
    results.push({
      name: href.slice(1), url: `https://github.com${href}`,
      description: row.find('p').first().text().replace(/\s+/g, ' ').trim() || null,
      language: row.find('[itemprop="programmingLanguage"]').text().trim() || null,
      stars: number(row.find('a[href$="/stargazers"]').text()),
      forks: number(row.find('a[href$="/forks"]').text()),
      starsInPeriod: number(row.find('span.float-sm-right').text())
    });
  });
  if (!results.length && !$('.blankslate').length) throw new Error('Struktur halaman GitHub Trending berubah atau akses dibatasi');
  return results;
}

async function githubTrending(language = 'all', options = {}) {
  try {
    language = text(language, 'Bahasa', 50).toLowerCase();
    if (!/^[a-z\d][a-z\d+#.-]*$/i.test(language)) throw new Error('Nama bahasa tidak valid');
    const since = choice(options.since, 'daily', ['daily', 'weekly', 'monthly'], 'Periode');
    const limit = integer(options.limit, 10, 1, 25, 'Limit');
    const html = await request(urlWithParams(`https://github.com/trending${language === 'all' ? '' : `/${encodeURIComponent(language)}`}`, { since }), {
      ...options, format: 'text', interval: 1000, cacheTtl: 300000
    });
    const results = parseTrending(html, limit);
    return { status: true, source: SOURCE, language, since, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { githubTrending, parseTrending };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => githubTrending(args._[0], args), ['since']);
