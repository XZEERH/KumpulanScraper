#!/usr/bin/env node
'use strict';

/**
 * Name : Gempa BMKG via ApiKu
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Menampilkan gempa terbaru, potensi tsunami, dan daftar gempa M5+ dari BMKG.
 * Note : node scrapers/apiku/bmkg/scrape-gempa.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/bmkg/gempa';
const { scrape: gempa, cli } = apikuEndpoint(ENDPOINT, {
  mapData: ({ data }) => data && { ...data, attribution: 'BMKG - https://data.bmkg.go.id/gempabumi/' },
  validateData: (data) => hasText(data.latest?.Wilayah) && hasText(data.latest.DateTime) && hasText(data.latest.Magnitude) &&
    Number.isFinite(Number(data.latest.Magnitude)) && Array.isArray(data.recent)
});

module.exports = { gempa };
if (require.main === module) cli();
