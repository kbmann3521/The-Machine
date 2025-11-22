// Lightweight OpenAI API wrapper that works without the package
let OpenAI = null

try {
  // Try to use the npm package if installed
  OpenAI = require('openai')
} catch (e) {
  // Fallback: implement minimal OpenAI API interface
  OpenAI = class OpenAI {
    constructor(options = {}) {
      this.apiKey = options.apiKey || process.env.OPENAI_API_KEY
      this.baseURL = 'https://api.openai.com/v1'
    }

    async request(method, endpoint, data) {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API error')
      }

      return response.json()
    }

    get embeddings() {
      return {
        create: async (options) => {
          const response = await this.request('POST', '/embeddings', {
            model: options.model || 'text-embedding-3-small',
            input: options.input,
          })
          return response
        },
      }
    }

    get chat() {
      return {
        completions: {
          create: async (options) => {
            const response = await this.request('POST', '/chat/completions', {
              model: options.model || 'gpt-4o-mini',
              messages: options.messages,
              temperature: options.temperature || 0.7,
              max_tokens: options.max_tokens || 256,
            })
            return response
          },
        },
      }
    }
  }
}

module.exports = OpenAI
