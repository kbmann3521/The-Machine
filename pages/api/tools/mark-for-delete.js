import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const TOOLS_CONFIG = require('../../../lib/tools.js')

function getCommentMarker(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    return '// #mark-for-delete'
  }
  if (filePath.endsWith('.json')) {
    return '/* #mark-for-delete */'
  }
  if (filePath.endsWith('.sql')) {
    return '-- #mark-for-delete'
  }
  if (filePath.endsWith('.md')) {
    return '<!-- #mark-for-delete -->'
  }
  return '// #mark-for-delete'
}

function findToolFiles(toolId) {
  const files = []
  const standaloneFile = path.join(process.cwd(), 'lib', 'tools', `${toolId.replace(/-/g, '')}.js`)

  if (fs.existsSync(standaloneFile)) {
    files.push(standaloneFile)
  }

  const toolsFile = path.join(process.cwd(), 'lib', 'tools.js')
  files.push(toolsFile)

  const apiFile = path.join(process.cwd(), 'pages', 'api', 'tools', `${toolId}`, 'route.js')
  if (fs.existsSync(apiFile)) {
    files.push(apiFile)
  }

  return files
}

function injectComment(filePath, toolId, marked) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const marker = getCommentMarker(filePath)
    const lines = content.split('\n')
    let modified = false

    if (marked) {
      // Check if already marked
      if (content.includes(marker)) {
        return false
      }

      // Inject marker before tool-related functions/definitions
      const toolIdPatterns = [
        `'${toolId}'`,
        `"${toolId}"`,
        `function ${toolId.replace(/-/g, '')}`,
        `const ${toolId.replace(/-/g, '')}`,
        `export const ${toolId.replace(/-/g, '')}`,
        `export function ${toolId.replace(/-/g, '')}`,
      ]

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const isToolDefinition = toolIdPatterns.some(pattern => line.includes(pattern))

        if (isToolDefinition && !lines[i - 1]?.includes(marker)) {
          lines.splice(i, 0, marker)
          modified = true
          i++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
      }
    } else {
      // Remove marker
      const newLines = lines.filter(line => !line.includes(marker))
      if (newLines.length < lines.length) {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8')
        modified = true
      }
    }

    return modified
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { toolId, marked } = req.body

  // Validate input
  if (!toolId || typeof marked !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid toolId or marked flag' })
  }

  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return res.status(503).json({ error: 'Database not configured' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Update the mark_for_delete flag in database
    const { data, error } = await supabase
      .from('tools')
      .update({ mark_for_delete: marked })
      .eq('id', toolId)
      .select()

    if (error) {
      console.error('Error updating tool mark_for_delete:', error)
      return res.status(400).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Tool not found' })
    }

    // Inject/remove comment markers in code files
    const toolFiles = findToolFiles(toolId)
    const modifiedFiles = []

    for (const filePath of toolFiles) {
      if (injectComment(filePath, toolId, marked)) {
        modifiedFiles.push(filePath)
      }
    }

    return res.status(200).json({
      success: true,
      tool: data[0],
      marked,
      modifiedFiles,
      message: marked
        ? `Tool marked for deletion. Added #mark-for-delete comments to ${modifiedFiles.length} file(s)`
        : `Deletion marking removed. Removed #mark-for-delete comments from ${modifiedFiles.length} file(s)`,
    })
  } catch (error) {
    console.error('Error in mark-for-delete handler:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
