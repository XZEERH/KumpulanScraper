#!/usr/bin/env node
'use strict';

/**
 * Name : Brat Image Maker
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat gambar Brat PNG atau GIF dan mengembalikan data Base64.
 * Note : node scrapers/siputzx/maker/scrape-siputzx-m-brat.js --text "Halo dunia" --isAnimated true --delay 500
 */

const { request, text, integer, choice, urlWithParams, failure, runCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/m/brat';
const ROUTE = new URL(ENDPOINT).pathname.slice('/api/'.length);
const SOURCE = 'siputzx';
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const USAGE = `Usage: node scrapers/siputzx/maker/scrape-siputzx-m-brat.js --text <teks> [--isAnimated <true|false>] [--delay <100-1500>]\nEndpoint: ${ROUTE}`;

async function makeBrat(options = {}) {
  try {
    const caption = text(options.text, 'text', 100);
    const flag = options.isAnimated;
    const isAnimated = choice(typeof flag === 'boolean' ? String(flag) : flag, 'false', ['true', 'false'], 'isAnimated') === 'true';
    const delay = options.delay === undefined ? undefined : integer(options.delay, NaN, 100, 1500, 'delay');
    const mimeType = isAnimated ? 'image/gif' : 'image/png';
    const { buffer, contentType } = await request(urlWithParams(ENDPOINT, { text: caption, isAnimated, delay }), {
      timeout: options.timeout, interval: 1500, format: 'binary', redirect: 'error', headers: { Accept: mimeType }
    });
    const validSignature = isAnimated ? /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6)) : buffer.subarray(0, 8).equals(PNG_SIGNATURE);
    if (contentType !== mimeType || !validSignature) throw new Error(`Siputzx tidak mengembalikan ${mimeType} yang valid`);
    return {
      status: true, source: SOURCE, endpoint: ROUTE, timestamp: null,
      data: { mimeType, base64: buffer.toString('base64') }
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { makeBrat };
if (require.main === module) {
  runCLI(SOURCE, USAGE, (args) => {
    if (args._.length) throw new Error(USAGE);
    return makeBrat(args);
  }, ['text', 'isAnimated', 'delay']);
}
