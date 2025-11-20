const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lightweight Supabase client using fetch instead of SDK
export const supabase = {
  from: (table) => ({
    select: (columns = '*') => ({
      then: async (callback) => {
        try {
          const response = await fetch(
            `${supabaseUrl}/rest/v1/${table}?select=${columns}`,
            {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
            }
          )
          const data = await response.json()
          return callback({ data, error: null })
        } catch (error) {
          return callback({ data: null, error })
        }
      },
    }),
  }),

  rpc: (functionName, params) => ({
    then: async (callback) => {
      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify(params),
          }
        )
        const data = await response.json()
        return callback({ data, error: null })
      } catch (error) {
        return callback({ data: null, error })
      }
    },
  }),
}
