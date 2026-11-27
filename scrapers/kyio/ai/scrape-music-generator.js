#!/usr/bin/env node
'use strict';

/**
 * Name : AI Music Generator (Suno)
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate 2 lagu (audio, cover, lirik, durasi) dari teks prompt memakai engine SongGenerator.io / Suno chirp-hawk.
 * Note : node scrapers/kyio/ai/scrape-music-generator.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/music-generator';
const { scrape: aiMusicGenerator, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    prompt: { aliases: ['q', 'query', 'text'] },
    taskId: {},
    instrumental: {},
    customMode: {},
    style: {},
    title: {},
    waitMs: {}
  }
});

module.exports = { aiMusicGenerator };
if (require.main === module) cli();
