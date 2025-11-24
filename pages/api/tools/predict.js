/**
 * 3-Layer Tool Prediction Pipeline
 * 
 * LAYER 1: Hard Detection Matrix (Regex + Heuristics) - 80-90% of cases
 * LAYER 2: LLM Classification - Fallback for ambiguous cases
 * LAYER 3: Semantic Search - For plain_text inputs only
 * 
 * Scoring: 60% heuristics + 30% semantic + 10% tool bias
 */

import { generateEmbedding, cosineSimilarity } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'
import { hardDetectMatrix } from '../../../lib/hardDetection'
import { getToolsForInputType, getToolBiasWeight, shouldUseSemanticSearch } from '../../../lib/toolMappings'
import { classify as llmClassify } from '../../../lib/llmClassifier'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function getVisibilityMap() {
  const { data: supabaseTools } = await supabase
    .from('tools')
    .select('id, show_in_recommendations')

  const visibilityMap = {}
  if (supabaseTools) {
    supabaseTools.forEach(tool => {
      visibilityMap[tool.id] = tool.show_in_recommendations !== false
    })
  }
  return visibilityMap
}

/**
 * LAYER 1: Hard Detection via detection matrix
 */
function layerHardDetection(input) {
  const result = hardDetectMatrix(input)
  if (!result) return null

  const { best } = result

  // If we're very confident, we can short-circuit
  if (best.confidence >= 0.9) {
    console.log(`✓ LAYER 1 (hard): ${best.type} (${(best.confidence * 100).toFixed(0)}%)`)
    return best
  }

  console.log(`LAYER 1 (hard, low-confidence): ${best.type} (${(best.confidence * 100).toFixed(0)}%)`)
  return best
}

/**
 * LAYER 2: LLM Classification (fallback / refinement)
 * Expected to return: { type, confidence }
 */
async function layerLlmClassification(input, hardBest) {
  try {
    const llmResult = await llmClassify(input)
    if (!llmResult) return null

    console.log(`LAYER 2 (LLM): ${llmResult.type} (${(llmResult.confidence * 100).toFixed(0)}%)`)

    // Simple arbitration: if LLM is much more confident, override
    if (!hardBest || llmResult.confidence >= hardBest.confidence + 0.15) {
      console.log(`✓ LAYER 2 overrides hard detection → ${llmResult.type}`)
      return llmResult
    }

    // Otherwise, keep hard detection
    return hardBest
  } catch (error) {
    console.error('LLM classification error:', error)
    return hardBest
  }
}

/**
 * LAYER 3: Semantic Search – only for plain_text / ambiguous_text
 */
async function layerSemanticSearch(input, inputTypeLabel, visibilityMap) {
  if (!shouldUseSemanticSearch(inputTypeLabel)) return null

  try {
    const candidateToolIds = getToolsForInputType(inputTypeLabel)
    const visibleTools = candidateToolIds.filter(id => visibilityMap[id] !== false)

    if (!visibleTools.length) return null

    const queryEmbedding = await generateEmbedding(input)
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return null
    }

    const toolScores = await Promise.all(
      visibleTools.map(async (toolId) => {
        const toolData = TOOLS[toolId]
        if (!toolData) return null

        const toolEmbedding = await generateEmbedding(
          `${toolData.name}. ${toolData.description} ${toolData.example || ''}`
        )

        if (!toolEmbedding || toolEmbedding.length === 0) {
          return null
        }

        const semanticScore = cosineSimilarity(queryEmbedding, toolEmbedding)
        return {
          toolId,
          name: toolData.name,
          description: toolData.description,
          semanticScore,
        }
      })
    )

    return toolScores
      .filter(Boolean)
      .sort((a, b) => b.semanticScore - a.semanticScore)
  } catch (error) {
    console.error('Semantic search error:', error)
    return null
  }
}

/**
 * Determine input type using detection matrix + LLM.
 */
async function determineInputTypeWithMatrix(input) {
  const hardBest = layerHardDetection(input)

  // If hard detection is strong and not plain_text, just use it
  if (hardBest && hardBest.type !== 'plain_text' && hardBest.confidence >= 0.9) {
    return hardBest
  }

  // For ambiguous input (plain_text, low confidence), ask LLM
  const llmRefined = await layerLlmClassification(input, hardBest)

  if (llmRefined) return llmRefined

  // Fallback: if nothing else, treat as plain_text
  return {
    type: 'plain_text',
    confidence: 0.5,
    reason: 'Fallback to plain_text',
    source: 'fallback',
  }
}

/**
 * Direct tool selection for structured types (non plain_text).
 */
async function directToolSelection(inputType, inputText, visibilityMap) {
  const inputTypeLabel = inputType.type
  const candidateToolIds = getToolsForInputType(inputTypeLabel)
  const results = []

  for (const [toolId, toolData] of Object.entries(TOOLS)) {
    if (visibilityMap[toolId] === false) continue

    let similarity = 0
    let source = 'unmatched'

    if (candidateToolIds.includes(toolId)) {
      similarity = 0.9
      source = 'hard_detection'
    }

    const bias = getToolBiasWeight(toolId, inputTypeLabel, inputText)
    similarity = Math.max(0, Math.min(1, similarity + bias))

    if (similarity > 0) {
      const tool = {
        toolId,
        name: toolData.name,
        description: toolData.description,
        similarity,
        source,
      }

      // Add suggested config if available
      if (toolData.suggestedConfig) {
        tool.suggestedConfig = toolData.suggestedConfig
      }

      results.push(tool)
    }
  }

  return results
}

/**
 * Main handler
 */
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

    // IMAGE-only path
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

    // TEXT INPUT: use detection matrix + 3-layer pipeline
    const rawInput = inputText || ''
    const inputType = await determineInputTypeWithMatrix(rawInput)
    const inputTypeLabel = inputType.type

    console.log('Final inputType:', inputTypeLabel, 'from', inputType.source || 'unknown')

    if (inputTypeLabel === 'plain_text' || inputTypeLabel === 'ambiguous_text') {
      // LAYER 3: semantic search + bias for plain text
      const toolsForPlain = getToolsForInputType(inputTypeLabel)
      const semanticScores = await layerSemanticSearch(rawInput, inputTypeLabel, visibilityMap)

      const matchedTools = []
      const unmatchedTools = []

      for (const [toolId, toolData] of Object.entries(TOOLS)) {
        if (visibilityMap[toolId] === false) continue

        let similarity = 0
        let source = 'unmatched'

        // Text toolkit gets strong base signal
        if (toolId === 'text-toolkit') {
          similarity = 0.98
          source = 'plain_text_detection'
        } else if (toolsForPlain.includes(toolId)) {
          similarity = 0.70
          source = 'plain_text_detection'
        }

        // If semantic search has a score for this tool, blend it
        const semanticEntry = semanticScores?.find(s => s.toolId === toolId)
        if (semanticEntry) {
          // 60% heuristic + 30% semantic + 10% bias (later)
          similarity = Math.max(similarity, 0.6 * similarity + 0.3 * semanticEntry.semanticScore)
          source = 'semantic_search'
        }

        const bias = getToolBiasWeight(toolId, inputTypeLabel, rawInput)
        similarity = Math.max(0, Math.min(1, similarity + bias))

        const tool = {
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity,
          source,
        }

        if (similarity > 0) {
          // Add suggested config if available
          if (toolData.suggestedConfig) {
            tool.suggestedConfig = toolData.suggestedConfig
          }
          matchedTools.push(tool)
        } else {
          unmatchedTools.push(tool)
        }
      }

      predictedTools = [...matchedTools, ...unmatchedTools]
    } else {
      // Structured or non-plain inputs
      predictedTools = await directToolSelection(inputType, rawInput, visibilityMap)

      // Add unmatched tools
      const matchedToolIds = new Set(predictedTools.map(t => t.toolId))
      for (const [toolId, toolData] of Object.entries(TOOLS)) {
        if (visibilityMap[toolId] === false || matchedToolIds.has(toolId)) continue

        predictedTools.push({
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: 0,
          source: 'unmatched',
        })
      }
    }

    predictedTools.sort((a, b) => b.similarity - a.similarity)

    res.status(200).json({
      predictedTools,
      inputContent: rawInput,
      _debug: {
        pipelineUsed: '3-layer (hard-detection -> llm -> semantic)',
        totalResults: predictedTools.length,
      },
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
