export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getUniqueSlug(baseSlug, excludeId = null) {
  const { supabase } = await import('./supabase-client.js')

  let slug = baseSlug
  let counter = 2
  let isUnique = false

  while (!isUnique) {
    let query = supabase.from('blog_posts').select('id').eq('slug', slug)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query.single()

    if (error && error.code === 'PGRST116') {
      // No rows found - slug is unique
      isUnique = true
    } else if (data) {
      // Slug exists, try next counter
      slug = `${baseSlug}-${counter}`
      counter++
    } else if (error && error.code !== 'PGRST116') {
      // Some other error occurred
      throw error
    }
  }

  return slug
}
