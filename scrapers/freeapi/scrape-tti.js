#!/usr/bin/env node
'use strict';

/**
 * Name : PixelSter Text to Image
 * Creator : lmavour
 * Source : https://freeapi.pro/pixelster#api
 * Base Web : https://freeapi.pro
 * Type : Scraper
 * Description : Menghasilkan satu gambar dan mengembalikan tautan JPEG dari penyedia.
 * Note : node scrapers/freeapi/scrape-tti.js --prompt "A yellow flower icon" --ratio 1:1
 */

const { request, text, choice, httpsUrl, failure, runCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://freeapi.pro/api/tti';
const SOURCE = 'freeapi';
const USAGE = 'Usage: node scrapers/freeapi/scrape-tti.js --prompt <teks> [--ratio 1:1]';
const RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '2:1', '1:2', '3:2', '2:3', '4:5', '5:4'];

async function freeapiTextToImage(options = {}) {
  try {
    const prompt = text(options.prompt, 'Prompt', 1000);
    const ratio = choice(options.ratio, '1:1', RATIOS, 'Rasio');
    const payload = await request(ENDPOINT, {
      timeout: options.timeout ?? 60000, interval: 1800, cache: false, jsonBody: { prompt, ratio }
    });
    const link = payload?.success === true && httpsUrl(payload.imageUrl, ['access.vheer.com']);
    if (!link) throw new Error('PixelSter tidak mengembalikan tautan gambar yang valid');
    return { status: true, source: SOURCE, endpoint: 'tti', data: { imageUrl: link.href, ratio } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { freeapiTextToImage };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => {
  if (args._.length) throw new Error(USAGE);
  return freeapiTextToImage(args);
}, ['prompt', 'ratio']);
