import { runJWTTests } from '../../lib/jwtTestRunner.js'

export default function handler(req, res) {
  try {
    const results = runJWTTests()
    res.status(200).json(results)
  } catch (error) {
    console.error('Error running JWT tests:', error)
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}
