/**
 * 3-Layer Tool Prediction Pipeline
 * 
 * LAYER 1: Hard Detection (Regex + Heuristics) - 80-90% of cases
 * LAYER 2: LLM Classification - Fallback for ambiguous cases
 * LAYER 3: Semantic Search - For plain_text inputs only
 * 
 * Scoring: 60% heuristics + 30% semantic + 10% tool bias
 */

import { generateEmbedding, cosineSimilarity } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'
import { hardDetect, isLikelyPlainText } from '../../../lib/hardDetection'
import { classify as llmClassify } from '../../../lib/llmClassifier'
import { getToolsForInputType, shouldUseSemanticSearch, getToolBiasWeight } from '../../../lib/toolMappings'

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
 * LAYER 1: Hard Detection
 * Runs regex and heuristics to classify input
 */
function layerHardDetection(input) {
  const result = hardDetect(input)
  
  if (result && result.confidence >= 0.80) {
    console.log(`✓ LAYER 1 (Hard Detection): ${result.type} (${(result.confidence * 100).toFixed(0)}%)`)
    return result
  }
  
  return null
}

/**
 * LAYER 2: LLM Classification
 * Falls back to LLM for ambiguous cases
 */
async function layerLlmClassification(input) {
  const result = await llmClassify(input)
  
  if (result && result.confidence >= 0.65) {
    console.log(`✓ LAYER 2 (LLM Classification): ${result.type} (${(result.confidence * 100).toFixed(0)}%)`)
    return result
  }
  
  return null
}

/**
 * Determine input type through 3-layer pipeline
 */
async function determineInputType(input) {
  // LAYER 1: Hard Detection
  const hardResult = layerHardDetection(input)
  if (hardResult) {
    return hardResult
  }

  // LAYER 2: LLM Classification
  const llmResult = await layerLlmClassification(input)
  if (llmResult) {
    return llmResult
  }

  // Default: Plain text
  console.log('⊘ No layer matched; defaulting to plain_text')
  return {
    type: 'plain_text',
    confidence: 0.3,
    reason: 'Default fallback',
  }
}

/**
 * LAYER 3: Semantic Search
 * Used only for plain_text inputs to find the best matching tool
 */
async function layerSemanticSearch(input, inputType, visibilityMap) {
  // Only use semantic search for plain text
  if (!shouldUseSemanticSearch(inputType)) {
    return null
  }

  try {
    console.log(`🧠 LAYER 3 (Semantic Search): Searching for ${inputType} tools`)

    // Get tools relevant to this input type
    const candidateToolIds = getToolsForInputType(inputType)
    if (candidateToolIds.length === 0) {
      console.warn(`No tools mapped for input type: ${inputType}`)
      return null
    }

    // Filter by visibility
    const visibleTools = candidateToolIds.filter(id => visibilityMap[id] !== false)
    if (visibleTools.length === 0) {
      return null
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(input)
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return null
    }

    // Score each tool
    const toolScores = await Promise.all(
      visibleTools.map(async (toolId) => {
        const toolData = TOOLS[toolId]
        if (!toolData) return null

        // Generate tool embedding from description
        const toolEmbedding = await generateEmbedding(
          `${toolData.name} ${toolData.description}`
        )

        if (!toolEmbedding || toolEmbedding.length === 0) {
          return null
        }

        // Calculate semantic similarity
        const semanticScore = cosineSimilarity(queryEmbedding, toolEmbedding)

        return {
          toolId,
          name: toolData.name,
          description: toolData.description,
          semanticScore,
        }
      })
    )

    return toolScores.filter(Boolean).sort((a, b) => b.semanticScore - a.semanticScore)
  } catch (error) {
    console.error('Semantic search error:', error)
    return null
  }
}

/**
 * Calculate final score for each tool
 * Formula: (heuristics * 0.6) + (semantic * 0.3) + (bias * 0.1)
 */
function calculateFinalScore(heuristicScore, semanticScore, toolBias) {
  return (heuristicScore * 0.6) + (semanticScore * 0.3) + (toolBias * 0.1)
}

/**
 * Direct tool selection based on input type
 * Returns all tools, with matched tools first and ordered by relevance
 */
async function directToolSelection(inputType, visibilityMap) {
  const matchedToolIds = getToolsForInputType(inputType)
  const matchedMap = new Map(matchedToolIds.map((id, idx) => [id, 0.95 - (idx * 0.02)]))

  // Separate matched and unmatched tools
  const matchedTools = []
  const unmatchedTools = []

  Object.entries(TOOLS).forEach(([toolId, toolData]) => {
    if (visibilityMap[toolId] === false) return

    const similarity = matchedMap.get(toolId) || 0
    const tool = {
      toolId,
      name: toolData.name,
      description: toolData.description,
      similarity,
      source: similarity > 0 ? 'hard_detection' : 'unmatched',
    }

    if (similarity > 0) {
      matchedTools.push(tool)
    } else {
      unmatchedTools.push(tool)
    }
  })

  // Return matched tools first (in order from mapping), then unmatched
  return [...matchedTools, ...unmatchedTools]
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputText, inputImage } = req.body

    if (!inputText && !inputImage) {
      return res.status(400).json({ error: 'No input provided' })
    }

    const inputContent = inputText || 'image input'
    const visibilityMap = await getVisibilityMap()

    let predictedTools = []

    // For image input, prioritize image-capable tools but show all
    if (inputImage) {
      const imageCapableSet = new Set(
        Object.entries(TOOLS)
          .filter(([toolId, toolData]) => {
            if (toolId === 'image-resizer') return true
            return toolData.inputTypes?.includes('image')
          })
          .map(([toolId]) => toolId)
      )

      predictedTools = Object.entries(TOOLS)
        .filter(([toolId]) => visibilityMap[toolId] !== false)
        .map(([toolId, toolData]) => {
          let similarity = 0
          if (toolId === 'image-resizer') {
            similarity = 0.99
          } else if (imageCapableSet.has(toolId)) {
            similarity = 0.90
          }
          return {
            toolId,
            name: toolData.name,
            description: toolData.description,
            similarity,
            source: similarity > 0 ? 'image_detection' : 'unmatched',
          }
        })
    } else {
      // TEXT INPUT: Use 3-layer detection pipeline
      
      // STEP 1: Determine input type (Layers 1 & 2)
      const inputType = await determineInputType(inputContent)
      console.log(`📊 Input Type: ${inputType.type} (confidence: ${(inputType.confidence * 100).toFixed(0)}%)`)

      // STEP 2: Select tools based on input type
      // For structured inputs: direct selection
      // For plain_text: semantic search
      
      if (shouldUseSemanticSearch(inputType.type)) {
        // LAYER 3: Semantic search for plain_text
        const semanticResults = await layerSemanticSearch(inputContent, inputType.type, visibilityMap)

        if (semanticResults && semanticResults.length > 0) {
          // Create a map of semantic results
          const semanticMap = new Map(
            semanticResults.map(result => [result.toolId, result])
          )

          // Apply scoring formula with bias to semantic results
          const scoredResults = semanticResults.map(result => {
            const toolBias = getToolBiasWeight(result.toolId, inputType.type)
            const finalScore = calculateFinalScore(
              0.6, // Heuristic score placeholder (for semantic search, this is low)
              result.semanticScore,
              toolBias
            )

            return {
              toolId: result.toolId,
              name: result.name,
              description: result.description,
              similarity: Math.min(1, finalScore),
              source: 'semantic_search',
              semanticScore: result.semanticScore,
              biasApplied: toolBias > 0 ? toolBias : undefined,
            }
          })

          // Add all other tools with 0 similarity
          const allToolIds = Object.keys(TOOLS)
          const otherTools = allToolIds
            .filter(toolId => !semanticMap.has(toolId) && visibilityMap[toolId] !== false)
            .map(toolId => {
              const toolData = TOOLS[toolId]
              return {
                toolId,
                name: toolData.name,
                description: toolData.description,
                similarity: 0,
                source: 'unmatched',
              }
            })

          predictedTools = [...scoredResults, ...otherTools]
        } else {
          // No semantic results, return all tools with 0 similarity
          predictedTools = Object.entries(TOOLS)
            .filter(([toolId]) => visibilityMap[toolId] !== false)
            .map(([toolId, toolData]) => ({
              toolId,
              name: toolData.name,
              description: toolData.description,
              similarity: 0,
              source: 'unmatched',
            }))
        }
      } else {
        // Direct tool selection for structured inputs
        predictedTools = await directToolSelection(inputType.type, visibilityMap)
      }
    }

    // Sort by similarity
    predictedTools.sort((a, b) => b.similarity - a.similarity)

    res.status(200).json({
      predictedTools,
      inputContent,
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
