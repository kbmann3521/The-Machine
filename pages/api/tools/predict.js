/**
 * Unified Tool Prediction Pipeline
 * 
 * LAYER 1: Hard Detection Matrix (Regex + Heuristics) - 80-90% of cases
 * LAYER 2: LLM Classification - Fallback for ambiguous cases
 * LAYER 3: Semantic Search - For plain_text inputs only
 * 
 * Scoring: base weight + semantic + bias (all clamped to [0,1])
 */

import { TOOLS } from '../../../lib/tools'
import { hardDetectMatrix } from '../../../lib/hardDetection'
import {
  getToolBaseWeight,
  getToolBiasWeight,
  shouldUseSemanticSearch,
} from '../../../lib/toolMappings'
import {
  generateEmbedding,
  cosineSimilarity,
} from '../../../lib/embeddings'
import { classify as llmClassify } from '../../../lib/llmClassifier'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Fetch tool visibility from Supabase
 */
async function getVisibilityMap() {
  try {
    const { data: tools } = await supabase
      .from('tools')
      .select('id, show_in_recommendations')

    const visibilityMap = {}
    if (tools && Array.isArray(tools)) {
      tools.forEach(tool => {
        visibilityMap[tool.id] = tool.show_in_recommendations !== false
      })
    }
    return visibilityMap
  } catch (error) {
    console.error('Error fetching tool visibility:', error)
    return {}
  }
}

/**
 * Determine input type using detection matrix + LLM refinement.
 */
async function determineInputTypeWithMatrix(input) {
  const hardResult = hardDetectMatrix(input)
  const hardBest = hardResult?.best || null

  // If hard detection is strong and not plain_text, just use it
  if (hardBest && hardBest.type !== 'plain_text' && hardBest.confidence >= 0.9) {
    console.log(
      `✓ LAYER 1 (hard): ${hardBest.type} (${(hardBest.confidence * 100).toFixed(
        0,
      )}%)`
    )
    return hardBest
  }

  // Ask LLM for ambiguous cases
  try {
    const llmResult = await llmClassify(input)
    if (llmResult) {
      console.log(
        `LAYER 2 (LLM): ${llmResult.type} (${(llmResult.confidence * 100).toFixed(
          0,
        )}%)`
      )

      // If LLM is significantly more confident, let it override
      if (
        !hardBest ||
        llmResult.confidence >= (hardBest.confidence || 0) + 0.15
      ) {
        console.log(`✓ LAYER 2 overrides hard detection → ${llmResult.type}`)
        return llmResult
      }

      // Otherwise keep hard detection
      return hardBest
    }
  } catch (error) {
    console.error('LLM classification error:', error)
  }

  // Fallback: treat as plain_text if nothing else
  return {
    type: 'plain_text',
    confidence: 0.5,
    reason: 'Fallback to plain_text',
    source: 'fallback',
  }
}

/**
 * Semantic search layer: only used for plain_text / ambiguous_text.
 * Returns map of { toolId => semanticScore }
 */
async function layerSemanticSearch(input, visibilityMap) {
  try {
    const queryEmbedding = await generateEmbedding(input)
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return {}
    }

    const semanticMap = {}
    const entries = Object.entries(TOOLS)

    for (const [toolId, toolData] of entries) {
      if (visibilityMap[toolId] === false) continue

      const toolEmbedding = await generateEmbedding(
        `${toolData.name}. ${toolData.description} ${toolData.example || ''}`
      )

      if (!toolEmbedding || toolEmbedding.length === 0) continue

      const semanticScore = cosineSimilarity(queryEmbedding, toolEmbedding)
      semanticMap[toolId] = semanticScore
    }

    return semanticMap
  } catch (error) {
    console.error('Semantic search error:', error)
    return {}
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputText, inputImage } = req.body || {}

    if (!inputText && !inputImage) {
      return res.status(400).json({ error: 'No input provided' })
    }

    const visibilityMap = await getVisibilityMap()
    let predictedTools = []

    // IMAGE path remains simple
    if (inputImage && !inputText) {
      const imageCapableSet = new Set(
        Object.entries(TOOLS)
          .filter(([toolId, toolData]) => {
            if (toolId === 'image-resizer') return true
            return toolData.inputTypes?.includes('image')
          })
          .map(([toolId]) => toolId)
      )

      predictedTools = Object.entries(TOOLS)
        .map(([toolId, toolData]) => {
          if (visibilityMap[toolId] === false) return null

          let similarity = 0
          let source = 'unmatched'

          if (toolId === 'image-resizer') {
            similarity = 0.99
            source = 'image_detection'
          } else if (imageCapableSet.has(toolId)) {
            similarity = 0.9
            source = 'image_detection'
          }

          return {
            toolId,
            name: toolData.name,
            description: toolData.description,
            similarity,
            source,
          }
        })
        .filter(Boolean)

      predictedTools.sort((a, b) => b.similarity - a.similarity)
      return res.status(200).json({ predictedTools })
    }

    // TEXT path: full detection + scoring
    const rawInput = inputText || ''
    const inputType = await determineInputTypeWithMatrix(rawInput)
    const inputTypeLabel = inputType.type

    console.log(
      'Final inputType:',
      inputTypeLabel,
      'from',
      inputType.source || 'unknown'
    )

    const useSemantic = shouldUseSemanticSearch(inputTypeLabel)
    let semanticMap = {}

    if (useSemantic) {
      console.log('Using semantic search for:', inputTypeLabel)
      semanticMap = await layerSemanticSearch(rawInput, visibilityMap)
    }

    // Build full scored list of tools
    const toolsWithScores = []

    for (const [toolId, toolData] of Object.entries(TOOLS)) {
      if (visibilityMap[toolId] === false) continue

      // Base heuristic from inputType→tool relevance matrix
      let base = getToolBaseWeight(toolId, inputTypeLabel)

      // Add semantic for plain_text / ambiguous_text
      const semanticScore = useSemantic ? semanticMap[toolId] || 0 : 0
      if (useSemantic && semanticScore > 0) {
        // 60% heuristic, 30% semantic
        base = 0.6 * base + 0.3 * semanticScore
      }

      // Apply bias
      const bias = getToolBiasWeight(toolId, inputTypeLabel, rawInput)
      let similarity = base + bias

      // Clamp to [0, 1]
      similarity = Math.max(0, Math.min(1, similarity))

      const tool = {
        toolId,
        name: toolData.name,
        description: toolData.description,
        similarity,
        source: useSemantic ? 'semantic+heuristic' : 'heuristic',
      }

      const suggestedConfig = detectSuggestedConfig(toolId, rawInput, inputType)
      if (suggestedConfig) {
        tool.suggestedConfig = suggestedConfig
      }

      toolsWithScores.push(tool)
    }

    // Sort tools globally by similarity
    toolsWithScores.sort((a, b) => b.similarity - a.similarity)
    predictedTools = toolsWithScores

    return res.status(200).json({
      predictedTools,
      inputContent: rawInput,
      _debug: {
        pipelineUsed: '3-layer (hard-detection -> llm -> semantic)',
        semanticEnabled: useSemantic,
        totalTools: predictedTools.length,
      },
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
