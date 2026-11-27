#!/usr/bin/env node
'use strict';

/**
 * Name : Deep Synthesizer
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Endpoint peringkas cerdas. Menggunakan algoritma TextRank untuk mengekstrak kalimat krusial sebelum diolah oleh AI menjadi ringkasan eksekutif yang padat dan hemat token.
 * Note : node scrapers/kyio/ai/scrape-deep-synthesizer.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deep-synthesizer';
const { scrape: aiDeepSynthesizer, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  params: {
    text: {},
    url: {},
    lang: {},
    bullets: {}
  }
});

module.exports = { aiDeepSynthesizer };
if (require.main === module) cli();
