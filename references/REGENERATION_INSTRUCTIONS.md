# Optional: Regenerate Embeddings

## When to Regenerate

**The context-aware changes are immediately effective without regenerating!** Here's why:

- ✅ User input embeddings are now context-aware (the main fix)
- ✅ Tool embeddings were already appropriate (based on tool descriptions)
- ⚠️ Regenerating is optional for consistency, but not required for improvements

## How to Regenerate (If Desired)

### Option 1: Web UI (Recommended)

1. Go to `https://www.pioneerwebtools.com/admin/generate-embeddings`
2. Enter your embedding secret key: `embedding-secret-key-regenerate-all`
3. Click "Test OpenAI API Key" to verify connection
4. Click "Start Generation"
5. Wait for completion (5-10 minutes for all tools)

### Option 2: Command Line

If you have Node.js access, run:
```bash
node regenerate-embeddings-admin.mjs
```

This will regenerate all tool embeddings using the latest generation logic.

## What Regeneration Does

When regenerating embeddings:
- Each tool's embedding is recalculated from its description
- Uses the `update_tool_embedding` SQL function for storage
- Ensures consistent embedding format (pgvector)
- Rate-limited at ~2 requests/second to avoid API throttling

## Monitoring Regeneration

The admin panel shows:
- Progress percentage
- Number of tools processed
- Any failed embeddings with error messages
- Total completion summary

## After Regeneration

Once complete:
- All 64 tools will have fresh embeddings
- Semantic search will use both:
  - User input: context-aware (from the code changes)
  - Tool descriptions: freshly regenerated

## Troubleshooting

**If regeneration fails:**
1. Check the OpenAI API key is valid
2. Verify you have remaining API credits
3. Check that Supabase is accessible
4. Review error messages in the admin panel

**If some tools fail:**
- Failed tools won't be updated
- Existing embeddings remain unchanged
- You can retry to regenerate failed tools

## No Regeneration Needed For Basic Testing

The context-aware changes are effective immediately:
- Try `/test-semantic` to see improved intent extraction
- URLs now suggest "url_operations" instead of "access website"
- Semantic search should show more relevant results

Full regeneration is optional and adds consistency but isn't required for the improvements to work.
