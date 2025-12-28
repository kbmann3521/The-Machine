// IP Toolkit Engine - Heavy IP validation and parsing functions
// This module is lazy-loaded only when IP parsing/validation is needed
// Keeping it separate allows Builder preview to stay fast

let cachedEngine = null

/**
 * Lazy-load all IP toolkit parsing and validation functions
 * Results are cached to avoid re-importing on every call
 */
export async function loadIPToolkitEngine() {
  if (cachedEngine) {
    return cachedEngine
  }

  try {
    const { detectIPInputType } = await import('./ipInputDetection')
    const { isBulkInput, parseBulkInput, classifyInputEntry } = await import('./bulkIPParser')
    const { validateIPAddress } = await import('./tools')

    cachedEngine = {
      detectIPInputType,
      isBulkInput,
      parseBulkInput,
      classifyInputEntry,
      validateIPAddress,
    }

    return cachedEngine
  } catch (error) {
    console.error('Failed to load IP toolkit engine:', error)
    throw error
  }
}
