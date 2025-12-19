'use client'

import { supabase } from './supabase-client'

export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function isAdmin(userId) {
  if (!userId) return false

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false
  return true
}

export async function checkAdminAuth() {
  const session = await getCurrentSession()
  if (!session) {
    return { isAuthorized: false, session: null }
  }

  const adminStatus = await isAdmin(session.user.id)
  return { isAuthorized: adminStatus, session }
}

export async function signOut() {
  await supabase.auth.signOut()
}
