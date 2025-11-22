#!/usr/bin/env node

async function regenerateEmbeddings() {
  console.log('Starting embedding regeneration with validator category fix...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/tools/generate-embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer embedding-secret-key-regenerate-all'
      },
      body: JSON.stringify({}),
    })
    
    if (!response.ok) {
      console.error('Error:', response.status, response.statusText)
      return
    }
    
    // Stream the response since it's a long-running process
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    let buffer = ''
    let progress = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      // Process complete lines
      const lines = buffer.split('\n')
      buffer = lines[lines.length - 1] // Keep incomplete line in buffer
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim()
        if (line) {
          try {
            const data = JSON.parse(line)
            
            if (data.status === 'processing') {
              const percent = data.progress || 0
              if (percent > progress) {
                progress = percent
                process.stdout.write(`\rProgress: ${percent}% (${data.processed}/${data.total} tools)`)
              }
            } else if (data.status === 'complete') {
              console.log('\n\n✅ Embedding regeneration complete!')
              console.log(`Processed: ${data.processed}`)
              console.log(`Failed: ${data.failed}`)
              console.log(`Skipped: ${data.skipped}`)
              console.log(`Total: ${data.total}`)
              
              if (data.failed > 0) {
                console.log('\nErrors:')
                data.errors?.slice(0, 5).forEach(err => {
                  console.log(`  - ${err.toolId}: ${err.error}`)
                })
              }
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

regenerateEmbeddings()
