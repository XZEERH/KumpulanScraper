#!/usr/bin/env node
'use strict';

/**
 * Name : HandSter Text to Handwriting
 * Creator : lmavour
 * Source : https://freeapi.pro/tth
 * Base Web : https://freeapi.pro
 * Type : Scraper
 * Description : Merender satu halaman tulisan tangan sebagai PNG Base64.
 * Note : node scrapers/freeapi/scrape-hand.js --text "Hello world" --paper ruled
 */

const { request, text, integer, choice, imageData, failure, runCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://freeapi.pro/api/hand';
const SOURCE = 'freeapi';
const USAGE = 'Usage: node scrapers/freeapi/scrape-hand.js --text <teks> [--font neat] [--color blue] [--size 34] [--paper ruled|plain] [--style neat|rough] [--page 1]';

async function freeapiHand(options = {}) {
  try {
    const input = text(options.text, 'Teks', 15000);
    const font = text(options.font ?? 'neat', 'Font', 40);
    const color = text(options.color ?? 'blue', 'Warna', 30);
    if (!/^[a-z\d][a-z\d_-]*$/i.test(font)) throw new Error('Kunci font tidak valid');
    if (!/^(?:#[a-f\d]{6}|[a-z][a-z-]*)$/i.test(color)) throw new Error('Warna harus nama warna atau kode #RRGGBB');
    const size = integer(options.size, 34, 16, 80, 'Ukuran');
    const paper = choice(options.paper, 'ruled', ['ruled', 'plain'], 'Kertas');
    const style = choice(options.style, 'neat', ['neat', 'rough'], 'Gaya');
    const page = integer(options.page, 1, 1, 100, 'Halaman');
    const result = await request(ENDPOINT, {
      timeout: options.timeout ?? 35000, interval: 1800, format: 'binary', headers: { Accept: 'image/png' },
      jsonBody: { text: input, font, color, size, paper, style, page, format: 'png' }
    });
    const data = result.contentType === 'image/png' ? imageData(result) : null;
    if (!data) throw new Error('HandSter tidak mengembalikan PNG yang valid');
    return { status: true, source: SOURCE, endpoint: 'hand', data: { ...data, page } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { freeapiHand };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => {
  if (args._.length) throw new Error(USAGE);
  return freeapiHand(args);
}, ['text', 'font', 'color', 'size', 'paper', 'style', 'page']);
