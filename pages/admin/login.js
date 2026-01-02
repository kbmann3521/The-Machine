import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase-client'
import styles from '../../styles/blog-admin-login.module.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (password !== passwordConfirm) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        if (data.user) {
          setError('')
          setEmail('')
          setPassword('')
          setPasswordConfirm('')
          setIsSignUp(false)
          setError(
            'Account created! You need admin access to log in. Please contact the site administrator to add your account as admin, or check if they have already added you.'
          )
          setLoading(false)
        }
      } else {
        try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            setError(signInError.message)
            setLoading(false)
            return
          }

          if (data.user) {
            // Check if user is in admin_users table
            const { data: adminUsers, error: adminCheckError } = await supabase
              .from('admin_users')
              .select('user_id')
              .eq('user_id', data.user.id)

            if (adminCheckError || !adminUsers || adminUsers.length === 0) {
              await supabase.auth.signOut()
              setError('You do not have admin access. Contact the site administrator.')
              setLoading(false)
              return
            }

            // Wait for the session to be available client-side
            let sessionAvailable = false
            let attempts = 0
            const maxAttempts = 20 // 2 seconds max

            while (!sessionAvailable && attempts < maxAttempts) {
              const { data: { session: currentSession } } = await supabase.auth.getSession()
              if (currentSession) {
                sessionAvailable = true
                break
              }
              attempts++
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            if (sessionAvailable) {
              // Redirect to admin posts page
              await router.push('/admin/posts')
            } else {
              setError('Session timeout. Please try logging in again.')
              setLoading(false)
            }
          }
        } catch (err) {
          setError('Network error: ' + (err.message || 'Failed to connect to authentication service'))
          setLoading(false)
          return
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Admin Login - Blog</title>
      </Head>

      <div className={styles.adminHeader}>
        <div className={styles.adminHeaderTitle}>Blog Admin</div>
      </div>

      <div className={styles.adminContent}>
        <div className={styles.loginSection}>
          <div className={styles.adminSection}>
            <h1 className={styles.adminTitle} style={{ fontSize: '2rem', marginTop: 0 }}>
              {isSignUp ? 'Create Admin Account' : 'Admin Login'}
            </h1>

            {error && (
              <div className={error.includes('created') ? styles.successMessage : styles.errorMessage}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.formInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className={styles.formInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {isSignUp && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="password-confirm">
                    Confirm Password
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    className={styles.formInput}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                    setEmail('')
                    setPassword('')
                    setPasswordConfirm('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '0.9rem',
                  }}
                  disabled={loading}
                >
                  {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  try {
    // Check if user has an active session by looking for auth cookie
    const authCookie = context.req.cookies['sb-lkcwoiyuzivqzynhwfsh-auth-token']

    if (authCookie) {
      // User is already logged in, redirect to admin panel
      return {
        redirect: {
          destination: '/admin/posts',
          permanent: false,
        },
      }
    }
  } catch (err) {
    console.error('Error checking auth in getServerSideProps:', err)
  }

  // User is not logged in, allow them to see the login page
  return {
    props: {},
  }
}
