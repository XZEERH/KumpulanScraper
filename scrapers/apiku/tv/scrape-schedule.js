#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal TV Per Channel
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil jam tayang dan nama acara untuk satu ID channel televisi.
 * Note : node scrapers/apiku/tv/scrape-schedule.js --channel sctv
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tv/schedule';
const { scrape: tvSchedule, cli } = apikuEndpoint(ENDPOINT, {
  params: { channel: { required: true, pattern: /^[\da-z-]{1,32}$/i, normalize: (value) => value.toLowerCase() } },
  mapData: ({ data }, { channel }) => Array.isArray(data) ? { channel, programs: data } : null,
  validateData: ({ programs }) => programs.some((item) => hasText(item?.time) && hasText(item.event))
});

module.exports = { tvSchedule };
if (require.main === module) cli();
