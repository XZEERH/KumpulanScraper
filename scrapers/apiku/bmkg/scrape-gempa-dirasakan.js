#!/usr/bin/env node
'use strict';

/**
 * Name : Gempa Dirasakan BMKG
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil daftar gempa dan laporan wilayah yang merasakan guncangan.
 * Note : node scrapers/apiku/bmkg/scrape-gempa-dirasakan.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/bmkg/gempa-dirasakan';
const { scrape: gempaDirasakan, cli } = apikuEndpoint(ENDPOINT, {
  mapData: ({ data }) => Array.isArray(data) ? { events: data, attribution: 'BMKG - https://data.bmkg.go.id/gempabumi/' } : null,
  validateData: ({ events }) => events.length > 0 && events.every((event) =>
    hasText(event?.Wilayah) && hasText(event.DateTime) && hasText(event.Dirasakan))
});

module.exports = { gempaDirasakan };
if (require.main === module) cli();
