#!/usr/bin/env node
'use strict';

/**
 * Name : AI Summarizer
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Meringkas artikel atau teks panjang menjadi paragraf ringkas, poin penting (bullet points), atau satu kalimat inti terbaik.
 * Note : node scrapers/kyio/ai/scrape-summarizer.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/summarizer';
const { scrape: aiSummarizer, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    text: { required: true },
    mode: {},
    lang: {},
    length: {}
  }
});

module.exports = { aiSummarizer };
if (require.main === module) cli();
