/**
 * Setup endpoint to create media storage bucket
 * 
 * This is a one-time setup endpoint for admins to initialize storage.
 * Call: POST /api/admin/setup-storage
 * 
 * Security: Requires admin authentication
 */

import { supabase, supabaseAdmin } from '../../../lib/supabase-client'

async function verifyAdminAccess(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header')
  }

  const token = authHeader.substring(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new Error('Invalid token')
  }

  const client = supabaseAdmin || supabase
  const { data: adminUsers, error: adminError } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)

  if (adminError || !adminUsers || adminUsers.length === 0) {
    throw new Error('Not an admin user')
  }

  return data.user.id
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAdminAccess(req)

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Admin client not configured' })
    }

    // Check if bucket already exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === 'media')

    if (bucketExists) {
      return res.status(200).json({ message: 'Bucket already exists', bucket: 'media' })
    }

    // Create bucket
    const { data, error } = await supabaseAdmin.storage.createBucket('media', {
      public: true,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Set public access policy
    const { error: policyError } = await supabaseAdmin.storage.from('media').updateBucketPolicies({
      public: true,
    })

    if (policyError) {
      console.warn('Warning: Could not update bucket policies:', policyError)
      // Don't fail - bucket was created successfully
    }

    return res.status(200).json({
      message: 'Bucket created successfully',
      bucket: data,
    })
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
}
