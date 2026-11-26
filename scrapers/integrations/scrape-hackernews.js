#!/usr/bin/env node
'use strict';

/**
 * Name : Hacker News
 * Base Web : https://github.com/HackerNews/API
 * Description : Berita teknologi, Ask/Show HN, skor, jumlah komentar, dan lowongan tanpa API key.
 * Note : Jumlah item dibatasi; tidak melakukan crawl seluruh komentar.
 */

const { request, choice, integer, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'hacker-news';
const USAGE = 'Usage: node scrapers/integrations/scrape-hackernews.js <top|new|best|ask|show|jobs> [--limit 10]';

async function hackernews(feed = 'top', options = {}) {
  try {
    feed = choice(feed, 'top', ['top', 'new', 'best', 'ask', 'show', 'jobs'], 'Feed');
    const limit = integer(options.limit, 10, 1, 30, 'Limit');
    const endpoint = feed === 'jobs' ? 'jobstories' : `${feed}stories`;
    const settings = { ...options, interval: 200, cacheTtl: 60000 };
    const ids = await request(`https://hacker-news.firebaseio.com/v0/${endpoint}.json`, settings);
    if (!Array.isArray(ids)) throw new Error('Daftar Hacker News tidak valid');
    const results = [];
    for (const id of ids.slice(0, limit)) {
      if (!Number.isSafeInteger(id) || id < 1) throw new Error('ID Hacker News tidak valid');
      const item = await request(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, settings);
      if (!item || item.deleted || item.dead) continue;
      if (item.id !== id || !item.type) throw new Error('Metadata Hacker News tidak valid');
      results.push({
        id, title: item.title || null, type: item.type, author: item.by || null,
        url: item.url || `https://news.ycombinator.com/item?id=${id}`,
        discussionUrl: `https://news.ycombinator.com/item?id=${id}`,
        score: item.score ?? null, comments: item.descendants ?? 0,
        postedAt: Number.isFinite(item.time) ? new Date(item.time * 1000).toISOString() : null
      });
    }
    return { status: true, source: SOURCE, feed, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { hackernews };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => hackernews(args._[0], args));
