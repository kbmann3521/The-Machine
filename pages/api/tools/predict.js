/**
 * Tool Prediction Pipeline
 *
 * Uses only hard detection (regex/heuristics) + tool bias weighting
 * No LLM or embeddings - fast and deterministic
 */

import { TOOLS } from '../../../lib/tools'
import { hardDetectMatrix } from '../../../lib/hardDetection'
import {
  getToolBaseWeight,
  getToolBiasWeight,
} from '../../../lib/toolMappings'
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
        visibilityMap[tool.id] =
          tool.show_in_recommendations !== false
      })
    }
    return visibilityMap
  } catch (error) {
    console.error('Error fetching tool visibility:', error)
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
      return res
        .status(400)
        .json({ error: 'No input provided' })
    }

    const visibilityMap = await getVisibilityMap()
    let predictedTools = []

    // ========== IMAGE PATH ==========
    if (inputImage && !inputText) {
      const imageCapableSet = new Set(
        Object.entries(TOOLS)
          .filter(([toolId, toolData]) => {
            return toolData.inputTypes?.includes('image')
          })
          .map(([toolId]) => toolId)
      )

      predictedTools = Object.entries(TOOLS)
        .map(([toolId, toolData]) => {
          if (visibilityMap[toolId] === false) return null

          let similarity = 0
          let source = 'unmatched'

          if (imageCapableSet.has(toolId)) {
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

    // ========== TEXT PATH: hard detection + bias weighting ==========

    const rawInput = inputText || ''
    const hardResult = hardDetectMatrix(rawInput)

    const inputType = hardResult?.best || {
      type: 'plain_text',
      confidence: 0.5,
      reason: 'Fallback to plain_text',
    }

    const inputTypeLabel = inputType.type

    console.log(
      `Detected: ${inputTypeLabel} (${(
        inputType.confidence * 100
      ).toFixed(0)}%)`
    )

    // Build full scored list of tools
    const toolsWithScores = []

    for (const [toolId, toolData] of Object.entries(TOOLS)) {
      if (visibilityMap[toolId] === false) continue

      // Base heuristic from inputType→tool relevance matrix
      let base = getToolBaseWeight(toolId, inputTypeLabel)

      // Apply bias
      const bias = getToolBiasWeight(
        toolId,
        inputTypeLabel,
        rawInput
      )
      let similarity = base + bias

      // Clamp to [0, 1]
      similarity = Math.max(0, Math.min(1, similarity))

      const tool = {
        toolId,
        name: toolData.name,
        description: toolData.description,
        similarity,
        source: 'heuristic',
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
        pipelineUsed: 'hard-detection + bias-weighting',
        detectedType: inputTypeLabel,
        totalTools: predictedTools.length,
        hardCandidates: hardResult?.candidates || [],
      },
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
