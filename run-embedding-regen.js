#!/usr/bin/env node

// Direct invocation of the embedding generation handler
const handler = require('./pages/api/tools/generate-embeddings').default

async function runEmbeddingRegeneration() {
  console.log('Starting embedding regeneration with enhanced metadata...\n')

  const mockReq = {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.EMBEDDING_SECRET_KEY}`
    }
  }

  const mockRes = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code
      return this
    },
    json: function(data) {
      console.error(`Error (${this.statusCode}):`, JSON.stringify(data, null, 2))
      process.exit(1)
    },
    setHeader: function(key, value) {
      // No-op for streaming
    },
    write: function(data) {
      // Parse and display progress
      try {
        const parsed = data.split('\n').filter(Boolean).map(line => JSON.parse(line))
        for (const item of parsed) {
          if (item.status === 'processing') {
            process.stdout.write(`\rProgress: ${item.progress}% (${item.processed}/${item.total})`)
          } else if (item.status === 'complete') {
            console.log(`\n\n✅ Complete!`)
            console.log(`  Processed: ${item.processed}`)
            console.log(`  Failed: ${item.failed}`)
            console.log(`  Skipped: ${item.skipped}`)
            if (item.errors.length > 0) {
              console.log(`\n⚠️  Errors:`)
              item.errors.forEach(err => {
                console.log(`  - ${err.toolId}: ${err.error}`)
              })
            }
          }
        }
      } catch (e) {
        process.stdout.write(data)
      }
    },
    end: function() {
      process.exit(0)
    }
  }

  try {
    await handler(mockReq, mockRes)
  } catch (error) {
    console.error('\n❌ Error during regeneration:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

runEmbeddingRegeneration()
