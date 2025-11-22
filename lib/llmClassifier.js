/**
 * LLM Intent Classifier
 * 
 * Used ONLY as fallback when hard detection fails.
 * Provides strict, deterministic classification for ambiguous inputs.
 */

import OpenAI from './openaiWrapper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are a strict input-type classifier for a multi-tool utility website. 
Users do NOT provide instructions; they only paste raw input such as code, text, numbers, URLs, JSON, HTML, CSS, SQL, CSV, Markdown, binary, timestamps, JWTs, etc.

Your job is to classify the input EXACTLY into one of the allowed types. 
You are NOT selecting a tool. You are ONLY determining the raw input's type.

You MUST follow these rules:

-----------------------------
1. HIGH-CONFIDENCE STRUCTURED FORMATS
If the input clearly matches one of these formats, classify it as:
email, url, json, html, css, js, xml, yaml, markdown, svg, csv, jwt, base64, html_entities, sql, cron, ip, uuid, mime, http_header, timestamp, binary, hex_color, jsonpath, filepath

-----------------------------
2. NUMERIC / SYMBOLIC FORMATS (DO NOT classify as text)
If the input is primarily numeric or symbolic, classify as:
integer, float, math_expression, time_24h, time_12h, file_size, unit_value, hex_number, octal_number, decimal_number

ONLY classify as plain_text if the input contains linguistic content (words, sentences, grammar).

Examples that are NOT plain_text:
"11100101"
"5+6-2"
"1:00pm"
"50mb"
"2025-11-22"
"0xFF"
"10kg"
"2.5m"
"((((()))))"
"/user/home/app"

-----------------------------
3. PLAIN TEXT RULE
Use "plain_text" ONLY when:
- the input contains natural-language words
- it is not recognized as any structured or numeric format
- it resembles normal English text, phrases, or sentences

Examples:
"hello world"
"this is a sentence"
"my dog is cute"
"i need help"
"this is a paragraph"

-----------------------------
4. AMBIGUOUS CASES
If input could be either structured OR plain_text:
- If it has ANY syntactic markers → choose structured type
- If it has ONLY words ��� choose plain_text

-----------------------------
5. OUTPUT FORMAT
You MUST output ONLY valid JSON with the following fields:

{
  "type": "<one_of_the_types_above>",
  "confidence": 0.0–1.0,
  "reasoning": "Short explanation of why this type fits."
}

Do NOT return anything outside of this JSON.
Do NOT suggest tools.
Do NOT rewrite the text.
Do NOT interpret meaning.
Do NOT solve math or parse code.

Your job is PURE classification.`

/**
 * Classify input using LLM (fallback layer)
 * Only call this after hard detection fails
 */
export async function llmClassify(input) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Classify this input:\n\n${input.substring(0, 1000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
    })

    const content = response.choices[0].message.content
    const result = JSON.parse(content)

    // Validate result structure
    if (!result.type || typeof result.confidence !== 'number') {
      console.warn('Invalid LLM response structure:', result)
      return null
    }

    return {
      type: result.type,
      confidence: Math.min(1, Math.max(0, result.confidence)),
      reason: result.reasoning || 'LLM classification',
    }
  } catch (error) {
    console.error('LLM classification error:', error)
    return null
  }
}

/**
 * Classify input with hard detection first, LLM as fallback
 */
export async function classify(input, hardDetectionResult = null) {
  // If hard detection succeeded, return immediately
  if (hardDetectionResult && hardDetectionResult.confidence >= 0.75) {
    return hardDetectionResult
  }

  // Fall back to LLM classification
  const llmResult = await llmClassify(input)
  if (llmResult) {
    return llmResult
  }

  // If both layers fail, default to plain_text with high confidence
  // Since we've ruled out all structured formats, plain text is the correct fallback
  return {
    type: 'plain_text',
    confidence: 0.85,
    reason: 'No structured pattern matched; treating as plain text',
  }
}

export default {
  llmClassify,
  classify,
}
