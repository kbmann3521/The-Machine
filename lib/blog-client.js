import { supabase } from './supabase-client'

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  return `Bearer ${session.access_token}`
}

export async function createPost(postData) {
  const authHeader = await getAuthHeader()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
  const createUrl = `${baseUrl}/api/blog/create-post`

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(postData),
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create post')
  }

  return response.json()
}

export async function updatePost(postId, postData) {
  const authHeader = await getAuthHeader()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
  const updateUrl = `${baseUrl}/api/blog/update-post`

  const response = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ id: postId, ...postData }),
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update post')
  }

  return response.json()
}

export async function deletePost(postId) {
  const authHeader = await getAuthHeader()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
  const deleteUrl = `${baseUrl}/api/blog/delete-post`

  const response = await fetch(deleteUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ id: postId }),
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete post')
  }
}

export async function getPostById(postId) {
  const authHeader = await getAuthHeader()

  const response = await fetch(`/api/blog/get-post?id=${postId}`, {
    headers: {
      Authorization: authHeader,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch post')
  }

  return response.json()
}

export async function getAllPosts() {
  const authHeader = await getAuthHeader()

  const response = await fetch('/api/blog/get-posts', {
    headers: {
      Authorization: authHeader,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch posts')
  }

  return response.json()
}

export async function publishPost(postId) {
  const authHeader = await getAuthHeader()

  const response = await fetch('/api/blog/publish-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ id: postId, published: true }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to publish post')
  }

  return response.json()
}

export async function unpublishPost(postId) {
  const authHeader = await getAuthHeader()

  const response = await fetch('/api/blog/publish-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ id: postId, published: false }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to unpublish post')
  }

  return response.json()
}
