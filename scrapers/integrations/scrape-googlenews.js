#!/usr/bin/env node
'use strict';

/**
 * Name : Google News RSS Search
 * Base Web : https://news.google.com/
 * Description : Judul berita, penerbit, tanggal, dan tautan RSS tanpa API key.
 * Note : Tautan tetap milik Google News; tidak membongkar redirect atau mengambil artikel penuh.
 */

const { load } = require('cheerio');
const { request, text, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'google-news';
const USAGE = 'Usage: node scrapers/integrations/scrape-googlenews.js "teknologi Indonesia" [--country ID] [--language id] [--limit 10]';

function parseNewsRSS(xml, limit = 10) {
  const $ = load(xml, { xmlMode: true });
  if (!$('rss > channel').length) throw new Error('Respons bukan feed RSS Google News');
  const results = [];
  $('channel > item').slice(0, limit).each((_, element) => {
    const item = $(element);
    const rawDate = item.children('pubDate').text().trim();
    const time = Date.parse(rawDate);
    const url = item.children('link').text().trim();
    const title = item.children('title').text().trim();
    if (!title || !/^https?:\/\//i.test(url)) return;
    results.push({
      title, url,
      publishedAt: Number.isFinite(time) ? new Date(time).toISOString() : null,
      publisher: item.children('source').text().trim() || null,
      publisherUrl: item.children('source').attr('url') || null
    });
  });
  return results;
}

async function googleNews(query, options = {}) {
  try {
    query = text(query, 'Kata kunci', 500);
    const country = text(options.country ?? 'ID', 'Negara', 2).toUpperCase();
    const language = text(options.language ?? 'id', 'Bahasa', 10);
    if (!/^[A-Z]{2}$/.test(country) || !/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(language)) {
      throw new Error('Kode negara atau bahasa tidak valid');
    }
    const limit = integer(options.limit, 10, 1, 100, 'Limit');
    const xml = await request(urlWithParams('https://news.google.com/rss/search', {
      q: query, hl: language, gl: country, ceid: `${country}:${language.split('-')[0]}`
    }), { ...options, format: 'text', interval: 1000, cacheTtl: 300000 });
    const results = parseNewsRSS(xml, limit);
    return { status: true, source: SOURCE, query, country, language, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { googleNews, parseNewsRSS };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => googleNews(args._.join(' '), args), ['country', 'language']);
