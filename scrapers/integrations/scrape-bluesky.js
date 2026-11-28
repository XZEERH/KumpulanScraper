#!/usr/bin/env node
'use strict';

/**
 * Name : Bluesky Public Profile / Feed
 * Creator : lmavour
 * Base Web : https://docs.bsky.app/docs/api
 * Description : Profil dan feed akun publik Bluesky tanpa login atau API key.
 */

const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'bluesky';
const USAGE = 'Usage: node scrapers/integrations/scrape-bluesky.js <profile|feed> <handle|did|profile-url> [--limit 10] [--cursor cursor]';

async function bluesky(actor, options = {}) {
  try {
    actor = text(actor, 'Akun', 300);
    if (/^https?:\/\//i.test(actor)) {
      const url = new URL(actor);
      const match = url.pathname.match(/^\/profile\/([^/]+)\/?$/);
      if (url.hostname !== 'bsky.app' || !match) throw new Error('URL harus berupa https://bsky.app/profile/<akun>');
      actor = decodeURIComponent(match[1]);
    }
    actor = actor.replace(/^@/, '');
    if (!/^did:(?:plc:[a-z2-7]+|web:[a-zA-Z0-9.:%_-]+)$/.test(actor) && !/^[a-zA-Z0-9](?:[a-zA-Z0-9.-]*\.)[a-zA-Z]{2,}$/.test(actor)) {
      throw new Error('Handle atau DID Bluesky tidak valid');
    }
    const mode = choice(options.mode, 'profile', ['profile', 'feed']);
    const limit = integer(options.limit, 10, 1, 100, 'Limit');
    const cursor = options.cursor === undefined ? undefined : text(options.cursor, 'Cursor', 1000);
    const method = mode === 'profile' ? 'app.bsky.actor.getProfile' : 'app.bsky.feed.getAuthorFeed';
    const payload = await request(urlWithParams(`https://public.api.bsky.app/xrpc/${method}`, {
      actor, ...(mode === 'feed' ? { limit, cursor } : {})
    }), { ...options, interval: 500, cacheTtl: 60000 });
    if (!payload || payload.error || (mode === 'profile' ? !payload.did : !Array.isArray(payload.feed))) {
      throw new Error(payload?.message || 'Respons Bluesky tidak valid');
    }
    if (mode === 'feed') return { status: true, source: SOURCE, actor, mode, total: payload.feed.length, cursor: payload.cursor || null, results: payload.feed };
    return {
      status: true, source: SOURCE, mode,
      profile: {
        did: payload.did, handle: payload.handle, name: payload.displayName || payload.handle,
        description: payload.description || '', avatar: payload.avatar || null, banner: payload.banner || null,
        followers: payload.followersCount, following: payload.followsCount, posts: payload.postsCount,
        url: `https://bsky.app/profile/${payload.handle}`
      }
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { bluesky };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => bluesky(args._[1], { ...args, mode: args._[0] }), ['cursor']);
