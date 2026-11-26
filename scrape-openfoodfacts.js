#!/usr/bin/env node
'use strict';

/**
 * Name : Open Food Facts Barcode Lookup
 * Base Web : https://openfoodfacts.github.io/openfoodfacts-server/api/
 * Description : Komposisi, nutrisi, alergen, dan metadata barcode tanpa API key.
 * Note : Data komunitas dapat tidak lengkap. Ikuti ODbL/atribusi dan daftarkan penggunaan.
 *        Isi SCRAPER_CONTACT dengan email kontak untuk pemakaian rutin; uji memakai --staging.
 */

const { request, text, urlWithParams, failure, runCLI } = require('./scraper-utils');
const SOURCE = 'open-food-facts';
const USAGE = 'Usage: node scrape-openfoodfacts.js <barcode> [--staging]\nStaging memakai kredensial pengujian publik resmi off/off; bukan API key.';

async function openfoodfacts(barcode, options = {}) {
  try {
    barcode = text(barcode, 'Barcode', 14);
    if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(barcode)) throw new Error('Barcode harus terdiri dari 8, 12, 13, atau 14 digit');
    if (options.staging !== undefined && typeof options.staging !== 'boolean') throw new Error('Staging harus berupa boolean');
    const base = options.staging ? 'https://world.openfoodfacts.net' : 'https://world.openfoodfacts.org';
    const payload = await request(urlWithParams(`${base}/api/v3.6/product/${barcode}.json`, {
      fields: 'code,product_name,product_name_id,product_name_en,brands,quantity,image_front_url,ingredients_text,allergens_tags,nutriments,nutriscore_grade'
    }), {
      ...options, interval: 4100, cacheTtl: 3600000, allowNotFound: true,
      // Published staging credentials protect the test server from search-engine indexing.
      headers: options.staging ? { Authorization: `Basic ${Buffer.from('off:off').toString('base64')}` } : undefined
    });
    if (!payload || !payload.product || typeof payload.product !== 'object') {
      if (payload?.result?.id === 'product_not_found') return { status: true, source: SOURCE, barcode, found: false, product: null };
      throw new Error('Respons produk Open Food Facts tidak valid');
    }
    const product = payload.product;
    return {
      status: true, source: SOURCE, barcode, found: true, environment: options.staging ? 'staging' : 'production',
      attribution: 'Open Food Facts (ODbL); gambar CC BY-SA; data komunitas bukan jaminan keamanan alergen',
      product: {
        name: product.product_name_id || product.product_name || product.product_name_en || null,
        brands: product.brands || null, quantity: product.quantity || null,
        image: product.image_front_url || null, ingredients: product.ingredients_text || null,
        allergens: product.allergens_tags || [], nutriments: product.nutriments || {},
        nutriscore: product.nutriscore_grade || null, url: `${base}/product/${barcode}`
      }
    };
  } catch (error) {
    return failure(SOURCE, error);
  }
}

module.exports = { openfoodfacts };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => openfoodfacts(args._[0], args), [], ['staging']);
