import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    const info = {}

    // 1. Check if tools table exists and has embeddings
    console.log('🔍 Checking tools table...')
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .limit(1)

    if (toolsError) {
      info.toolsTable = {
        error: toolsError.message,
        status: 'FAILED',
      }
      console.log('✗ Tools table error:', toolsError.message)
    } else {
      const toolsWithEmbeddings = tools?.filter(t => t.embedding !== null).length || 0
      info.toolsTable = {
        exists: true,
        status: 'OK',
        sampleSize: tools?.length || 0,
        toolsWithEmbeddings: toolsWithEmbeddings,
      }
      console.log('✓ Tools table exists')
      console.log('  Sample embeddings present:', toolsWithEmbeddings > 0)
    }

    // 2. Check if search_tools RPC function exists
    console.log('🔍 Checking search_tools RPC function...')
    const testEmbedding = Array(1536).fill(0.5) // Test embedding
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('search_tools', {
      query_embedding: testEmbedding,
      match_count: 1,
    })

    if (rpcError) {
      info.rpcFunction = {
        error: rpcError.message,
        status: 'FAILED',
      }
      console.log('✗ RPC function error:', rpcError.message)
    } else {
      info.rpcFunction = {
        exists: true,
        status: 'OK',
        testResultCount: rpcResult?.length || 0,
      }
      console.log('✓ RPC function exists and works')
    }

    // 3. Get comprehensive stats
    console.log('🔍 Getting comprehensive stats...')
    const { data: allTools, error: allToolsError } = await supabase
      .from('tools')
      .select('id, name, embedding, show_in_recommendations')

    if (!allToolsError) {
      const totalTools = allTools?.length || 0
      const toolsWithEmbeddings = allTools?.filter(t => t.embedding !== null).length || 0
      const toolsInRecommendations = allTools?.filter(t => t.show_in_recommendations !== false).length || 0
      
      info.stats = {
        totalTools,
        toolsWithEmbeddings,
        embeddingCoverage: totalTools > 0 ? `${Math.round((toolsWithEmbeddings / totalTools) * 100)}%` : '0%',
        toolsInRecommendations,
      }
      
      // Show some sample tools
      info.sampleTools = allTools
        ?.slice(0, 5)
        .map(t => ({
          id: t.id,
          name: t.name,
          hasEmbedding: t.embedding !== null,
          inRecommendations: t.show_in_recommendations !== false,
          embeddingDimensions: t.embedding?.length || null,
        })) || []

      console.log('✓ Stats:')
      console.log(`  Total tools: ${totalTools}`)
      console.log(`  Tools with embeddings: ${toolsWithEmbeddings}`)
      console.log(`  Coverage: ${info.stats.embeddingCoverage}`)
    }

    // 4. Test vector search with a real embedding
    console.log('🔍 Testing vector search with semantic embedding...')
    const { generateEmbedding } = await import('../../../lib/embeddings.js')
    const semanticEmbedding = await generateEmbedding('plain English text writing category')
    
    const { data: semanticResults, error: semanticError } = await supabase.rpc('search_tools', {
      query_embedding: semanticEmbedding,
      match_count: 5,
    })

    if (semanticError) {
      info.semanticSearch = { error: semanticError.message }
      console.log('✗ Semantic search error:', semanticError.message)
    } else {
      info.semanticSearch = {
        status: 'OK',
        resultsCount: semanticResults?.length || 0,
        topResults: semanticResults?.slice(0, 3).map(r => ({
          id: r.id,
          name: r.name,
          distance: r.distance?.toFixed(4),
          similarity: (1 - r.distance)?.toFixed(4),
        })) || [],
      }
      console.log('✓ Semantic search works')
      if (semanticResults?.length > 0) {
        console.log('  Top result:', semanticResults[0].name, 'distance:', semanticResults[0].distance?.toFixed(4))
      }
    }

    // Summary
    const isSetupComplete = 
      info.toolsTable?.status === 'OK' && 
      info.rpcFunction?.status === 'OK' && 
      (info.stats?.toolsWithEmbeddings || 0) > 0

    res.status(200).json({
      setupComplete: isSetupComplete,
      status: isSetupComplete ? '✅ READY' : '❌ INCOMPLETE',
      info,
      recommendations: getRecommendations(info),
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

function getRecommendations(info) {
  const recommendations = []

  if (info.toolsTable?.error) {
    recommendations.push('❌ Tools table not found. Create the tools table in Supabase.')
  }

  if (info.rpcFunction?.error) {
    recommendations.push('❌ search_tools RPC function not found. Create the RPC function in Supabase.')
  }

  if (info.stats?.toolsWithEmbeddings === 0) {
    recommendations.push('⚠️ No embeddings found. Run "npm run regenerate-embeddings" to generate them.')
  } else if (info.stats?.embeddingCoverage !== '100%') {
    recommendations.push(`⚠️ Only ${info.stats?.embeddingCoverage} of tools have embeddings. Consider regenerating.`)
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Everything looks good! Semantic search should be working.')
  }

  return recommendations
}
