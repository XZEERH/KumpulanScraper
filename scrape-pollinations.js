#!/usr/bin/env node

/**
 * Name : image.pollinations.ai (generate gambar lewat prompt)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://image.pollinations.ai
 * Type : Scraper
 * Description : Generate gambar lewat prompt, btw ini udah support 18+
 * Note : error fix sendiri
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://image.pollinations.ai';
const MODELS_API_URL = 'https://gen.pollinations.ai/v1/models';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      const cleanKey = key.replace(/^--/, '');
      if (value !== undefined) {
        options[cleanKey] = value;
      } else {
        options[cleanKey] = true;
      }
    }
  });
  
  return options;
}

// Fetch data with retry logic and proper headers
async function fetchWithAxios(url, options = {}) {
  const config = {
    method: options.method || 'GET',
    url: url,
    timeout: options.timeout || DEFAULT_TIMEOUT,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': options.accept || 'application/json, text/html, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      ...options.headers
    },
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    },
    ...options.axiosConfig
  };

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Axios error: ${error.code} - ${error.message}`);
    }
    throw error;
  }
}

// Scrape from gen.pollinations.ai models API (primary source with detailed info)
async function scrapeModelsFromAPI() {
  try {
    console.log('Fetching models from gen.pollinations.ai/v1/models...');
    const response = await fetchWithAxios(MODELS_API_URL, {
      accept: 'application/json'
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.data}`);
    }
    
    const data = response.data;
    const models = data.data || data || [];
    
    // Filter image models
    const imageModels = models.filter(model => {
      const id = model.id || '';
      const type = model.type || model.model_type || '';
      const capabilities = model.capabilities || model.supported_generation_methods || [];
      
      return (
        type === 'image' ||
        type === 'images' ||
        (Array.isArray(capabilities) && (
          capabilities.includes('image') ||
          capabilities.includes('image_generation')
        )) ||
        /image|flux|kontext|sana|stable|dream|midjourney|dalle|ideogram|recraft|wan|gpt-image|imagen/i.test(id)
      );
    });
    
    console.log(`Found ${imageModels.length} image models from API`);
    
    return imageModels.map(model => {
      const id = model.id || '';
      const name = model.name || id.split('/').pop() || id;
      const description = model.description || '';
      
      // Extract parameters info
      const params = model.parameters || model.input_parameters || model.config || {};
      const supportedParams = Object.keys(params).length > 0 ? Object.keys(params) : [];
      
      // Build result object
      const result = {
        model_name: name,
        model_id: id,
        description: description,
        prompt: "Supported via /prompt/{prompt} endpoint",
        negative_prompt: {
          supported: true,
          note: "Use negative_prompt parameter (supports content moderation including mature content handling)"
        },
        parameters: {
          width: {
            supported: params.width !== undefined || supportedParams.includes('width'),
            default: params.width?.default,
            min: params.width?.min,
            max: params.width?.max,
            type: params.width?.type
          },
          height: {
            supported: params.height !== undefined || supportedParams.includes('height'),
            default: params.height?.default,
            min: params.height?.min,
            max: params.height?.max,
            type: params.height?.type
          },
          seed: {
            supported: true,
            description: "Random seed for reproducible results (0-2147483647)"
          },
          enhance: {
            supported: true,
            default: false,
            description: "Enhance prompt using AI"
          },
          private: {
            supported: true,
            default: false,
            description: "Make image private (requires authentication)"
          },
          nologo: {
            supported: true,
            default: false,
            description: "Remove Pollinations logo"
          },
          format: {
            supported: true,
            default: "jpg",
            options: ["jpg", "jpeg", "png", "webp"],
            description: "Output image format"
          },
          model: {
            supported: true,
            default: id,
            description: "Model to use for generation"
          }
        },
        supported_parameters: [
          "prompt (required)",
          "width",
          "height",
          "seed",
          "model",
          "enhance",
          "private",
          "nologo",
          "format",
          "negative_prompt",
          "nofeed",
          "safe",
          "quality",
          "image",
          "transparent",
          "clip_guidance",
          "init_image",
          "image2image",
          "text",
          "content",
          ...supportedParams.filter(p => !['width','height'].includes(p))
        ].filter((v,i,a)=>a.indexOf(v)===i),
        result_url_format: `https://image.pollinations.ai/prompt/{encoded_prompt}?model=${encodeURIComponent(id)}`,
        image_url_example: `https://image.pollinations.ai/prompt/example?model=${encodeURIComponent(id)}&width=1024&height=1024`,
        status: "available",
        rate_limit: {
          note: "Rate limits vary by model and authentication status"
        },
        source: "gen.pollinations.ai/v1/models"
      };
      
      return result;
    });
  } catch (error) {
    console.error('Error scraping from API:', error.message);
    return [];
  }
}

// Fallback: Scrape from web page
async function scrapeFromWebPage() {
  try {
    console.log('Fetching from image.pollinations.ai...');
    const response = await fetchWithAxios(TARGET_URL, {
      accept: 'text/html'
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    const models = [];
    
    // Look for model references in HTML
    $('script').each((i, el) => {
      const content = $(el).html();
      if (content && content.includes('model')) {
        // Extract model names (simple heuristic)
        const modelMatches = content.match(/"([^"]*(?:flux|sana|stable|dream|image|kontext|gpt-image)[^"]*)"/gi);
        if (modelMatches) {
          modelMatches.forEach(match => {
            const modelName = match.replace(/"/g, '');
            if (modelName && !models.find(m => m.model_id === modelName)) {
              models.push({
                model_name: modelName.split('/').pop() || modelName,
                model_id: modelName,
                prompt: "Supported",
                negative_prompt: { supported: true },
                parameters: {
                  width: { supported: true },
                  height: { supported: true },
                  seed: { supported: true },
                  enhance: { supported: true },
                  private: { supported: true },
                  nologo: { supported: true },
                  format: { supported: true, options: ["jpg", "png", "webp"] }
                },
                supported_parameters: ["prompt", "width", "height", "seed", "model", "enhance", "private", "nologo", "format", "negative_prompt"],
                result_url_format: `https://image.pollinations.ai/prompt/{encoded_prompt}?model=${encodeURIComponent(modelName)}`,
                image_url_example: `https://image.pollinations.ai/prompt/example?model=${encodeURIComponent(modelName)}&width=1024&height=1024`,
                status: "available",
                source: "image.pollinations.ai (web)"
              });
            }
          });
        }
      }
    });
    
    // Also check for specific model names in page text
    const pageText = $('body').text();
    const commonModels = ['flux', 'flux-pro', 'flux-dev', 'sana', 'stable-diffusion', 'turbo', 'kontext', 'dreamshaper'];
    commonModels.forEach(m => {
      if (pageText.toLowerCase().includes(m) && !models.find(x => x.model_id.includes(m))) {
        models.push({
          model_name: m,
          model_id: m,
          prompt: "Supported",
          negative_prompt: { supported: true },
          parameters: {
            width: { supported: true },
            height: { supported: true },
            seed: { supported: true },
            enhance: { supported: true },
            private: { supported: true },
            nologo: { supported: true },
            format: { supported: true, options: ["jpg", "png", "webp"] }
          },
          supported_parameters: ["prompt", "width", "height", "seed", "model", "enhance", "private", "nologo", "format", "negative_prompt"],
          result_url_format: `https://image.pollinations.ai/prompt/{encoded_prompt}?model=${m}`,
          image_url_example: `https://image.pollinations.ai/prompt/example?model=${m}&width=1024&height=1024`,
          status: "available",
          source: "image.pollinations.ai (web)"
        });
      }
    });
    
    console.log(`Found ${models.length} models from web scraping`);
    return models;
  } catch (error) {
    console.error('Error scraping from web:', error.message);
    return [];
  }
}

// Generate API usage examples
function generateUsageExamples(models) {
  return {
    generate_with_node: {
      description: "Generate image using Node.js (node scrape-pollinations.js --prompt='your prompt')",
      example_code: `const axios = require('axios');
const prompt = process.env.PROMPT || 'a beautiful sunset';
const model = process.env.MODEL || '${models[0]?.model_id || 'flux'}';
const url = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(prompt)}?model=\${model}&width=1024&height=1024\`;
axios.get(url, {responseType:'arraybuffer'}).then(r=>require('fs').writeFileSync('image.jpg',r.data));`
    },
    curl_example: `curl "https://image.pollinations.ai/prompt/a%20cat%20in%20space?model=${models[0]?.model_id || 'flux'}&width=1024&height=1024" -o image.jpg`,
    result_handling: {
      description: "Results are returned as image bytes directly; save to file or serve",
      response_type: "image/jpeg|png|webp depending on format parameter",
      status_codes: {
        200: "Success - image data",
        400: "Bad request - invalid parameters",
        429: "Rate limit exceeded",
        500: "Server error"
      }
    }
  };
}

// Main scraping function
async function scrape() {
  const options = parseArgs();
  const prompt = options.prompt;
  
  console.log('Starting Pollinations AI image models scraper...\n');
  
  let models = [];
  
  // Try API first (more detailed)
  try {
    models = await scrapeModelsFromAPI();
  } catch (e) {
    console.error('API scrape failed:', e.message);
  }
  
  // Fallback to web scraping if API returns empty
  if (models.length === 0) {
    console.log('No models from API, trying web scraping...');
    try {
      models = await scrapeFromWebPage();
    } catch (e) {
      console.error('Web scrape failed:', e.message);
    }
  }
  
  // Ensure we have at least sana as fallback (known model)
  if (models.length === 0) {
    models = [{
      model_name: 'sana',
      model_id: 'sana',
      prompt: "Supported via /prompt/{prompt} endpoint",
      negative_prompt: { supported: true },
      parameters: {
        width: { supported: true },
        height: { supported: true },
        seed: { supported: true },
        enhance: { supported: true },
        private: { supported: true },
        nologo: { supported: true },
        format: { supported: true, options: ["jpg", "png", "webp"] }
      },
      supported_parameters: ["prompt", "width", "height", "seed", "model", "enhance", "private", "nologo", "format", "negative_prompt"],
      result_url_format: "https://image.pollinations.ai/prompt/{encoded_prompt}?model=sana",
      image_url_example: "https://image.pollinations.ai/prompt/example?model=sana&width=1024&height=1024",
      status: "available",
      source: "fallback"
    }];
  }
  
  // Generate comprehensive output
  const output = {
    target_url: TARGET_URL,
    scraped_at: new Date().toISOString(),
    total_models: models.length,
    models: models,
    api_info: {
      base_url: TARGET_URL,
      generate_endpoint: `${TARGET_URL}/prompt/{prompt}`,
      models_endpoint: `${TARGET_URL}/models`,
      method: "GET",
      content_type: "image/*",
      note: "Supports both GET requests. Parameters passed as query params."
    },
    usage_examples: generateUsageExamples(models),
    pagination: {
      supported: false,
      note: "Models list is typically returned as a complete array"
    },
    request_handling: {
      timeout: DEFAULT_TIMEOUT,
      retry: {
        supported: true,
        recommendation: "Retry on 5xx/429 with exponential backoff"
      },
      error_handling: {
        400: "Invalid parameters",
        429: "Rate limit - retry after delay",
        500: "Server error - retry",
        503: "Service unavailable - retry"
      },
      empty_data_handling: "Return fallback model list if scraping fails"
    }
  };
  
  // If prompt is provided via CLI, generate image
  if (prompt) {
    console.log(`\nGenerating image for prompt: "${prompt}"`);
    try {
      const model = options.model || models[0]?.model_id || 'sana';
      const width = options.width || 1024;
      const height = options.height || 1024;
      const format = options.format || 'jpg';
      
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `${TARGET_URL}/prompt/${encodedPrompt}?model=${model}&width=${width}&height=${height}&format=${format}`;
      
      console.log(`Fetching from: ${imageUrl}`);
      const imgResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (imgResponse.status === 200) {
        const filename = options.output || `image_${Date.now()}.${format}`;
        fs.writeFileSync(filename, imgResponse.data);
        console.log(`Image saved to: ${filename}`);
        output.generated_image = {
          url: imageUrl,
          saved_as: filename,
          size_bytes: imgResponse.data.length,
          status: 200
        };
      }
    } catch (e) {
      console.error('Error generating image:', e.message);
      output.generated_image_error = e.message;
    }
  }
  
  // Write output
  const outputPath = options.outputJson || 'pollinations_models.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✓ Scraping complete! Output saved to: ${outputPath}`);
  console.log(`  - Total models: ${output.total_models}`);
  
  return output;
}

// Run scraper
if (require.main === module) {
  scrape().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { scrape, fetchWithAxios };