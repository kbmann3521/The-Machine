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

  const response = await fetch('/api/blog/create-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(postData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create post')
  }

  return response.json()
}

export async function updatePost(postId, postData) {
  const authHeader = await getAuthHeader()

  const response = await fetch('/api/blog/update-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ id: postId, ...postData }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update post')
  }

  return response.json()
}

export async function deletePost(postId) {
  const authHeader = await getAuthHeader()

  const response = await fetch('/api/blog/delete-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ id: postId }),
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
