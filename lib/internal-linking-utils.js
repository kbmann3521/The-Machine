/**
 * Detects if content is inside a code block (fenced)
 */
function isInCodeBlock(content, position) {
  const beforePosition = content.substring(0, position)
  const backtickCount = (beforePosition.match(/```/g) || []).length
  return backtickCount % 2 === 1
}

/**
 * Detects if content is inside inline code
 */
function isInInlineCode(content, position) {
  const lineStart = content.lastIndexOf('\n', position) + 1
  const lineEnd = content.indexOf('\n', position)
  const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd)
  const relativePos = position - lineStart

  let inBackticks = false
  for (let i = 0; i < relativePos; i++) {
    if (line[i] === '`' && (i === 0 || line[i - 1] !== '\\')) {
      inBackticks = !inBackticks
    }
  }
  return inBackticks
}

/**
 * Detects if content is inside a heading line
 */
function isInHeading(content, position) {
  const lineStart = content.lastIndexOf('\n', position) + 1
  const lineEnd = content.indexOf('\n', position)
  const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd)
  return line.match(/^#+\s/) !== null
}

/**
 * Detects if position is inside an existing markdown link
 */
function isInExistingLink(content, position) {
  const beforePos = content.substring(0, position)
  const lastBracket = beforePos.lastIndexOf('[')
  if (lastBracket === -1) return false

  const afterPos = content.substring(position)
  const closingBracket = afterPos.indexOf(']')
  const closingParen = afterPos.indexOf(')')
  
  if (closingBracket === -1 || closingParen === -1) return false
  
  // Check if it's a valid markdown link [text](url)
  return closingBracket < closingParen && content[lastBracket + 1] !== '!' // avoid images ![...]
}

/**
 * Checks if position is in first paragraph
 */
function isInFirstParagraph(content, position) {
  const beforePos = content.substring(0, position)
  // First paragraph ends at first double newline or first heading
  const firstH2 = content.search(/^##\s/m)
  const firstDoubleLine = content.search(/\n\n/)
  
  let paragraphEnd = content.length
  if (firstH2 !== -1) paragraphEnd = Math.min(paragraphEnd, firstH2)
  if (firstDoubleLine !== -1) paragraphEnd = Math.min(paragraphEnd, firstDoubleLine)
  
  return position < paragraphEnd
}

/**
 * Finds all valid match positions for a phrase in content
 * Respects all exclusion rules
 */
export function findValidMatches(content, phrase, options = {}) {
  const {
    skipHeadings = true,
    skipCodeBlocks = true,
    skipExistingLinks = true,
    skipFirstParagraph = false,
  } = options

  const matches = []
  const phraseRegex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  
  let match
  while ((match = phraseRegex.exec(content)) !== null) {
    const position = match.index
    
    // Apply exclusion rules
    if (skipCodeBlocks && isInCodeBlock(content, position)) continue
    if (skipCodeBlocks && isInInlineCode(content, position)) continue
    if (skipHeadings && isInHeading(content, position)) continue
    if (skipExistingLinks && isInExistingLink(content, position)) continue
    if (skipFirstParagraph && isInFirstParagraph(content, position)) continue
    
    matches.push({
      phrase: match[0], // preserve original casing
      position,
      length: match[0].length,
    })
  }
  
  return matches
}

/**
 * Inserts a markdown link at specified position
 * Returns modified content
 */
export function insertLink(content, position, phrase, targetUrl) {
  const before = content.substring(0, position)
  const matchedPhrase = content.substring(position, position + phrase.length)
  const after = content.substring(position + phrase.length)
  
  const link = `[${matchedPhrase}](${targetUrl})`
  return before + link + after
}

/**
 * Removes a markdown link that matches phrase and targetUrl
 * Returns modified content
 */
export function removeLink(content, phrase, targetUrl) {
  const linkPattern = `[${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}](${targetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`
  const regex = new RegExp(linkPattern, 'g')
  return content.replace(regex, phrase)
}

/**
 * Applies a rule to content, respecting max_links_per_post
 * Returns { modifiedContent, insertCount }
 */
export function applyRuleToContent(content, rule) {
  const matches = findValidMatches(content, rule.phrase, {
    skipHeadings: rule.skip_headings,
    skipCodeBlocks: rule.skip_code_blocks,
    skipExistingLinks: rule.skip_existing_links,
    skipFirstParagraph: rule.skip_first_paragraph,
  })

  if (matches.length === 0) {
    return { modifiedContent: content, insertCount: 0 }
  }

  // Only insert up to max_links_per_post
  const linksToInsert = matches.slice(0, rule.max_links_per_post)
  
  let modifiedContent = content
  let insertCount = 0

  // Insert in reverse order to maintain correct positions
  for (let i = linksToInsert.length - 1; i >= 0; i--) {
    const match = linksToInsert[i]
    modifiedContent = insertLink(modifiedContent, match.position, match.phrase, rule.target_url)
    insertCount++
  }

  return { modifiedContent, insertCount }
}

/**
 * Removes all links inserted by a rule from content
 * Returns modified content
 */
export function removeRuleLinksFromContent(content, rule) {
  return removeLink(content, rule.phrase, rule.target_url)
}

/**
 * Risk check: warns if phrase is too generic
 */
export function getRiskWarnings(phrase, affectedPostsCount, totalPosts = 100) {
  const warnings = []
  
  if (phrase.split(' ').length === 1) {
    warnings.push({
      type: 'single_word',
      message: 'Single-word phrases can match unintended contexts. Review preview carefully.',
    })
  }
  
  const percentageAffected = (affectedPostsCount / totalPosts) * 100
  if (percentageAffected > 30) {
    warnings.push({
      type: 'too_frequent',
      message: `This phrase appears in ${Math.round(percentageAffected)}% of posts. Consider narrowing it.`,
    })
  }
  
  return warnings
}
