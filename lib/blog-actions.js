'use server'

import { supabase } from './supabase-client'
import { getUniqueSlug, generateSlug } from './slug-utils'
import { getCurrentSession } from './auth-utils'

async function verifyAdminAccess() {
  const session = await getCurrentSession()
  if (!session) {
    throw new Error('Unauthorized: Not logged in')
  }

  // Check admin status using raw query to avoid RLS policy recursion
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('user_id', { count: 'exact' })
    .eq('user_id', session.user.id)

  if (error || !adminUser || adminUser.length === 0) {
    throw new Error('Unauthorized: Not an admin user')
  }

  return session.user.id
}

export async function createPost(postData) {
  const userId = await verifyAdminAccess()

  if (!postData.title?.trim()) {
    throw new Error('Title is required')
  }

  if (!postData.content?.trim()) {
    throw new Error('Content is required')
  }

  const baseSlug = generateSlug(postData.title)
  const slug = await getUniqueSlug(baseSlug)

  const publishedAt = postData.status === 'published' ? new Date().toISOString() : null

  const { data, error } = await supabase.from('blog_posts').insert([
    {
      title: postData.title.trim(),
      slug,
      excerpt: postData.excerpt?.trim() || null,
      content: postData.content.trim(),
      status: postData.status || 'draft',
      published_at: publishedAt,
    },
  ]).select()

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`)
  }

  return data[0]
}

export async function updatePost(postId, postData) {
  const userId = await verifyAdminAccess()

  if (!postData.title?.trim()) {
    throw new Error('Title is required')
  }

  if (!postData.content?.trim()) {
    throw new Error('Content is required')
  }

  const baseSlug = generateSlug(postData.title)
  const slug = await getUniqueSlug(baseSlug, postId)

  let publishedAt = postData.published_at
  if (postData.status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString()
  } else if (postData.status === 'draft') {
    publishedAt = null
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      title: postData.title.trim(),
      slug,
      excerpt: postData.excerpt?.trim() || null,
      content: postData.content.trim(),
      status: postData.status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('Post not found')
  }

  return data[0]
}

export async function deletePost(postId) {
  const userId = await verifyAdminAccess()

  const { error } = await supabase.from('blog_posts').delete().eq('id', postId)

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`)
  }
}

export async function getPostById(postId) {
  const userId = await verifyAdminAccess()

  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', postId).single()

  if (error) {
    throw new Error(`Failed to fetch post: ${error.message}`)
  }

  return data
}

export async function getAllPosts() {
  const userId = await verifyAdminAccess()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`)
  }

  return data
}

export async function publishPost(postId) {
  const userId = await verifyAdminAccess()

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()

  if (error) {
    throw new Error(`Failed to publish post: ${error.message}`)
  }

  return data[0]
}

export async function unpublishPost(postId) {
  const userId = await verifyAdminAccess()

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      status: 'draft',
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()

  if (error) {
    throw new Error(`Failed to unpublish post: ${error.message}`)
  }

  return data[0]
}
