# Semantic Search Pipeline Implementation Guide

## Overview

This document guides you through setting up the complete 9-step semantic search pipeline for your tool hub.

## System Architecture

```
User Input
   ↓
1. Classification (determine input type: text/image/code/url)
   ↓
2. Intent Extraction (what does user want to do?)
   ↓
3. Meaning Normalization (create clean structured object)
   ↓
4. Embedding Generation (convert to vector)
   ↓
5. Vector Search in Supabase (find similar tools)
   ↓
6. Confidence Threshold Filter (≥0.75)
   ↓
7. Optimistic UI Display
   ↓
8. Tool Selection & Loading
```

## Setup Instructions

### Step 1: Install OpenAI Package

```bash
npm install openai
```

### Step 2: Verify Environment Variables

Your `.env.local` should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://lkcwoiyuzivqzynhwfsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SITE_URL=https://www.pioneerwebtools.com
```

### Step 3: Generate Tool Embeddings

Once your app is deployed or running locally, generate embeddings for all tools:

#### Option A: Using API Endpoint

```bash
# Call the embeddings generation endpoint
curl -X POST https://yourapp.com/api/tools/generate-embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMBEDDING_SECRET_KEY" \
  -d '{}'
```

#### Option B: Using Node Script (for offline batch processing)

```bash
node scripts/generate-tool-embeddings.js
```

#### Option C: Direct Supabase Update

```bash
npm run generate-embeddings
```

### Step 4: Verify Embeddings

Check that embeddings were successfully stored:

```sql
-- In Supabase SQL Editor
SELECT id, name, embedding IS NOT NULL as has_embedding 
FROM tools 
LIMIT 20;
```

All tools should have embeddings (not NULL).

## API Endpoints

### Classification Endpoint
**POST** `/api/tools/classify`

Request:
```json
{
  "input": "Your input text here"
}
```

Response:
```json
{
  "input_type": "text|image|code|url",
  "content_summary": "Brief description of the input"
}
```

### Intent Extraction Endpoint
**POST** `/api/tools/extract-intent`

Request:
```json
{
  "input": "Your input text here",
  "input_type": "text"
}
```

Response:
```json
{
  "intent": "text_transformation",
  "sub_intent": "case_conversion",
  "confidence": 0.95
}
```

### Semantic Prediction Endpoint
**POST** `/api/tools/predict-semantic`

Request:
```json
{
  "inputText": "User input text"
}
```

Response:
```json
{
  "predictedTools": [
    {
      "toolId": "case-converter",
      "name": "Case Converter",
      "description": "Convert text case...",
      "similarity": 0.92
    }
  ],
  "metadata": {
    "classification": { ... },
    "intent": { ... },
    "usedVectorSearch": true
  }
}
```

### Regular Prediction Endpoint (Fallback)
**POST** `/api/tools/predict`

Automatically uses semantic search if available, falls back to pattern matching.

## Features

### 1. Classification (30-120ms)
- Uses GPT-4o-mini for fast classification
- Identifies input type: text, image, code, URL, file
- Prevents embedding junk or irrelevant content

### 2. Intent Extraction (30-120ms)
- Determines what user wants to accomplish
- Categories: text_transformation, data_conversion, image_processing, etc.
- Provides confidence score

### 3. Meaning Normalization
- Creates structured representation of user's intent
- Combines classification + intent into single object
- Format: `"input_type: text, intent: text_transformation, sub_intent: case_conversion"`

### 4. Real Embeddings
- Uses OpenAI's `text-embedding-3-small` model (faster, cheaper)
- 1,536-dimensional vectors
- Excellent semantic understanding

### 5. Vector Search (5-20ms)
- Uses Supabase pgvector with `<=>` operator (cosine distance)
- Custom RPC function: `search_tools(query_embedding, match_count)`
- Retrieves top N matching tools

### 6. Confidence Threshold (0.75)
- Only shows tools with similarity ≥ 0.75
- Prevents false positive suggestions
- Example:
  - User types "ca" → Case Converter won't auto-load prematurely
  - User types "convert text to uppercase" → Case Converter loads immediately

### 7. Optimistic UI
- Shows predictions as they arrive
- Smooth animations for tool appearance
- Highlight effect on top match
- Score colors indicate confidence (red→yellow→green)

### 8. Tool Pre-loading
- Automatically selects top matching tool
- Pre-fills configuration based on intent
- Runs tool immediately with detected settings

## Performance Metrics

Expected latency breakdown:
- Classification: 50-100ms
- Intent Extraction: 50-100ms
- Embedding Generation: 30-60ms
- Vector Search: 5-20ms
- **Total: 135-280ms** (feels instant to user)

With optimistic UI, user sees predictions within 100ms of typing.

## Fallback Strategy

If semantic search is unavailable:
1. Falls back to pattern matching
2. Uses Levenshtein distance for fuzzy matching
3. Returns pattern-matched tools with confidence scores
4. User experience remains unchanged

## Monitoring & Debugging

### Enable debug mode in client:
```javascript
// In pages/index.js
const DEBUG = true;
// This will log classification, intent, and confidence scores
```

### Check API logs:
```bash
# View recent predictions
tail -f logs/predictions.log

# Check embedding generation status
curl https://yourapp.com/api/tools/generate-embeddings \
  -H "Authorization: Bearer YOUR_KEY"
```

## Cost Optimization

### API Costs
- **Classification**: ~$0.00005 per call (GPT-4o-mini)
- **Intent Extraction**: ~$0.00005 per call
- **Embedding Generation**: ~$0.0001 per batch of 10 tools

For 10,000 user searches:
- Classification: $0.50
- Intent: $0.50
- Embeddings: $0.01 (one-time)
- **Total: ~$1.01 per 10k searches**

### Optimization Tips
1. Combine classification + intent in single call (save ~$0.0001)
2. Cache user embeddings to avoid re-processing
3. Batch embedding generation for new tools
4. Use `gpt-4o-mini` instead of full GPT-4

## Customization

### Change Confidence Threshold
Edit `pages/api/tools/predict-semantic.js`:
```javascript
const CONFIDENCE_THRESHOLD = 0.75; // Change this value
```

### Add Custom Intent Categories
Edit `pages/api/tools/extract-intent.js` and add to the prompt:
```javascript
// Add your custom categories here
- your_custom_intent: your description
```

### Modify Meaning Normalization
Edit `lib/meaningNormalization.js` to add more fields:
```javascript
export function normalizeMeaning(classification, intent) {
  return {
    type: classification.input_type,
    content_summary: classification.content_summary,
    intent: intent.intent,
    sub_intent: intent.sub_intent,
    language: detectLanguage(classification.content_summary),
    // Add more fields
  }
}
```

## Troubleshooting

### "Vector search not available"
- Check that pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- Verify RPC function exists: `SELECT * FROM pg_proc WHERE proname = 'search_tools';`
- Check Supabase logs for SQL errors

### "Embeddings are NULL"
- Run the embedding generation endpoint
- Check OpenAI API key in environment variables
- View errors in `/api/tools/generate-embeddings` logs

### "Semantic prediction returns empty"
- Verify tools have embeddings in database
- Check that at least one tool meets confidence threshold
- System falls back to pattern matching automatically

### Poor prediction accuracy
1. Ensure all tools have embeddings generated
2. Check that tool descriptions are descriptive and complete
3. Review intent extraction confidence scores
4. Consider adding more examples to tool descriptions

## Next Steps

1. [Generate embeddings](#step-3-generate-tool-embeddings) for all tools
2. Test the pipeline with sample inputs
3. Monitor accuracy and adjust confidence threshold if needed
4. Consider adding user feedback loop to improve predictions
5. Implement analytics to track prediction accuracy

## Additional Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/ai/vector-columns)
- [Semantic Search Best Practices](https://www.pinecone.io/learn/semantic-search/)
