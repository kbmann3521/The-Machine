// Regex Toolkit Engine - Heavy regex analysis and testing functions
// This module is lazy-loaded only when regex testing/analysis is needed
// Keeping it separate allows Builder preview to stay fast

let cachedEngine = null

/**
 * Lazy-load regex toolkit functions
 * Results are cached to avoid re-importing on every call
 */
export async function loadRegexToolkitEngine() {
  if (cachedEngine) {
    return cachedEngine
  }

  try {
    // Import the specific regex functions from tools
    const { regexTester } = await import('./tools')

    cachedEngine = {
      regexTester,
    }

    return cachedEngine
  } catch (error) {
    console.error('Failed to load regex toolkit engine:', error)
    throw error
  }
}
