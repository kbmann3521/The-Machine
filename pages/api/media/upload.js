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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAdminAccess(req)

    const { filename, file, mimeType } = req.body

    if (!filename || !file) {
      return res.status(400).json({ error: 'Filename and file data required' })
    }

    const client = supabaseAdmin || supabase

    // Upload to storage
    const path = `media/${Date.now()}-${filename}`
    const buffer = Buffer.from(file, 'base64')

    const { data: uploadData, error: uploadError } = await client.storage
      .from('media')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from('media')
      .getPublicUrl(path)

    const publicUrl = urlData?.publicUrl

    if (!publicUrl) {
      throw new Error('Failed to generate public URL')
    }

    // Insert metadata into database
    const { data: dbData, error: dbError } = await client
      .from('media_files')
      .insert([
        {
          path,
          url: publicUrl,
          mime_type: mimeType,
          size: buffer.length,
        },
      ])
      .select()

    if (dbError) {
      // Attempt to delete the uploaded file if DB insert fails
      await client.storage.from('media').remove([path])
      throw new Error(`Failed to save metadata: ${dbError.message}`)
    }

    return res.status(200).json(dbData[0])
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}
