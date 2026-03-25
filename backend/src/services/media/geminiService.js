/**
 * Gemini Service — AI product metadata extraction
 *
 * Uses Gemini 1.5 Flash vision to analyse a product image and return
 * structured JSON with product name and bilingual descriptions (EN + SW).
 *
 * Env vars required:
 *   GEMINI_API_KEY  Google AI Studio API key (aistudio.google.com → Get API key)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = `You are a product cataloguer for Naneka, an e-commerce platform serving
Tanzanian customers — many products come from Kariakoo Market, Dar es Salaam.

Analyse this product image and respond with ONLY a valid JSON object (no markdown, no
extra text):
{
  "product_name": "Short English product name (2–5 words, title case)",
  "description_en": "2–3 sentences describing the product in English for an online store listing.",
  "description_sw": "Maelezo ya bidhaa hii kwa Kiswahili, sentensi 2–3, yanayofaa kwa duka la mtandaoni."
}`;

const PLACEHOLDERS = new Set(['', 'your_gemini_api_key', 'your-gemini-api-key']);

function assertGeminiConfig() {
  const key = process.env.GEMINI_API_KEY ?? '';
  if (PLACEHOLDERS.has(key)) {
    throw new Error(
      `[geminiService] GEMINI_API_KEY is missing or still set to a placeholder value. ` +
      `Open backend/.env and set GEMINI_API_KEY to your real key from ` +
      `aistudio.google.com → Get API key.`
    );
  }
}

/**
 * Extract product metadata from an image buffer using Gemini 1.5 Flash.
 *
 * @param {Buffer} buffer   Raw image bytes
 * @param {string} mimetype MIME type (e.g. 'image/jpeg')
 * @returns {{ product_name: string, description_en: string, description_sw: string }}
 */
export async function extractProductInfo(buffer, mimetype = 'image/jpeg') {
  assertGeminiConfig();

  let result;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // gemini-2.0-flash-lite: highest free-tier quota (30 RPM, 1500 req/day).
    // gemini-1.5-flash is not available on this project's API key.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const imagePart = {
      inlineData: {
        data:     buffer.toString('base64'),
        mimeType: mimetype,
      },
    };

    result = await model.generateContent([PROMPT, imagePart]);
  } catch (err) {
    // Gemini SDK wraps HTTP errors — surface the exact message
    const msg = err?.message ?? err?.status ?? JSON.stringify(err);
    throw new Error(`[Gemini] ${msg}`);
  }

  const raw = result.response.text().trim();

  // Strip markdown fences Gemini sometimes wraps around JSON
  const clean = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`[Gemini] Response was not valid JSON. Raw response: ${raw.slice(0, 200)}`);
  }

  return {
    product_name:   String(parsed.product_name   ?? ''),
    description_en: String(parsed.description_en ?? ''),
    description_sw: String(parsed.description_sw ?? ''),
  };
}
