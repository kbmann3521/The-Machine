export function normalizeMeaning(classification, intent) {
  return {
    type: classification.input_type,
    content_summary: classification.content_summary,
    intent: intent.intent,
    sub_intent: intent.sub_intent,
    intent_confidence: intent.confidence,
    timestamp: new Date().toISOString(),
  }
}

export function meaningToEmbeddingText(normalizedMeaning) {
  const parts = [
    `input_type: ${normalizedMeaning.type}`,
    `content: ${normalizedMeaning.content_summary}`,
    `intent: ${normalizedMeaning.intent}`,
    `sub_intent: ${normalizedMeaning.sub_intent}`,
  ]
  return parts.join(', ')
}

export function createMeaningObject(userInput, classification, intent) {
  const normalized = normalizeMeaning(classification, intent)
  const embeddingText = meaningToEmbeddingText(normalized)

  return {
    normalized,
    embeddingText,
  }
}
