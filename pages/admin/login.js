import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase-client'
import styles from '../../styles/blog-admin.module.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkExistingSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single()

        if (adminUser) {
          router.push('/admin/posts')
          return
        }
      }

      setCheckingAuth(false)
    }

    checkExistingSession()
  }, [router])

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

          router.push('/admin/posts')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>Admin Login</title>
        </Head>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    )
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
