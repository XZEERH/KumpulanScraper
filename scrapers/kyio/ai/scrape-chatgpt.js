#!/usr/bin/env node
'use strict';

/**
 * Name : ChatGPT (Android backend)
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : ChatGPT via backend aplikasi Android resmi: chat guest & login, multi-turn, web search, deep research, dan generate/edit gambar.
 * Note : node scrapers/kyio/ai/scrape-chatgpt.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/chatgpt';
const { scrape: aiChatgpt, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true, aliases: ['text', 'prompt', 'query'] },
    action: {},
    sessionId: {},
    parentMessageId: {},
    model: {},
    token: {}
  }
});

module.exports = { aiChatgpt };
if (require.main === module) cli();
