import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { marked } from 'marked'
import { supabase } from '../../lib/supabase-client'
import styles from '../../styles/blog-post.module.css'
import AdminCSSBar from '../../components/AdminCSSBar'

export default function BlogPost({ post, customCss: initialCss = '' }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [customCss, setCustomCss] = useState(initialCss)

  // Apply custom CSS whenever it changes
  useEffect(() => {
    let styleElement = document.getElementById('blog-custom-css-style')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'blog-custom-css-style'
      document.head.appendChild(styleElement)
    }
    styleElement.textContent = customCss
  }, [customCss])

  useEffect(() => {
    const checkAdminAndRefreshCss = async () => {
      // Check if user is admin
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single()

        setIsAdmin(!!adminUser)

        // For admin: refresh CSS in case it was updated
        if (adminUser) {
          try {
            const response = await fetch('/api/blog/custom-css')
            const data = await response.json()
            const css = data.css || ''
            if (css !== initialCss) {
              setCustomCss(css)
            }
          } catch (err) {
            console.error('Failed to load custom CSS:', err)
          }
        }
      }
    }

    checkAdminAndRefreshCss()
  }, [initialCss])

  if (!post) {
    return (
      <div className={`${styles.postPage} ${isAdmin ? styles.postPageWithAdminBar : ''}`}>
        <Head>
          <title>Post Not Found</title>
        </Head>
        {isAdmin && <AdminCSSBar onCSSChange={setCustomCss} postId={post?.id} />}
        <div className={styles.postHeader}>
          <div className={styles.postHeaderContent}>
            <h1 className={styles.postTitle}>Post Not Found</h1>
          </div>
        </div>
        <div className={styles.postBody}>
          <div className={styles.notFound}>
            <h1>404</h1>
            <p>The blog post you are looking for does not exist.</p>
            <Link href="/blog" className={styles.backLink}>
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pageTitle = `${post.title} - Blog`
  const pageDescription = post.excerpt || post.title
  const ogImage = post.og_image_url || post.thumbnail_url || ''

  return (
    <div className={`${styles.postPage} ${isAdmin ? styles.postPageWithAdminBar : ''}`}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <link rel="canonical" href={`https://www.pioneerwebtools.com/blog/${post.slug}`} />
      </Head>

      {isAdmin && <AdminCSSBar onCSSChange={setCustomCss} postId={post.id} />}

      <header className={styles.postHeader}>
        <div className={styles.postHeaderContent}>
          {post.thumbnail_url && (
            <div className={styles.postHeaderThumbnail}>
              <img src={post.thumbnail_url} alt={post.title} />
            </div>
          )}
          <div className={styles.postHeaderInfo}>
            <h1 className={styles.postTitle} style={{ padding: '0 16px' }}>{post.title}</h1>
            <div className={styles.postMeta} style={{ padding: '0 16px' }}>
              <div className={styles.postMetaItem}>
                <span>Published</span>
                <time dateTime={post.published_at}>
                  {post.publishedFormatted}
                </time>
              </div>
              {post.updated_at && post.updated_at !== post.published_at && (
                <div className={styles.postMetaItem}>
                  <span>Updated</span>
                  <time dateTime={post.updated_at}>
                    {post.updatedFormatted}
                  </time>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.postBody}>
        <article className={`${styles.postContent} blog-post-content`}>
          <MarkdownContent content={post.content} />
        </article>

        <footer className={styles.postFooter}>
          <Link href="/blog" className={styles.backLink}>
            ← Back to Blog
          </Link>
        </footer>
      </main>
    </div>
  )
}

function MarkdownContent({ content }) {
  const html = marked(content || '')
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr)
  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return { date: formatted, time }
}

export async function getStaticProps({ params }) {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return {
        notFound: true,
        revalidate: 3600,
      }
    }

    // Fetch custom CSS on the server to avoid layout shift
    let customCss = ''
    try {
      const { data: cssData, error: cssError } = await supabase
        .from('blog_custom_css')
        .select('css_content')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      if (!cssError && cssData?.css_content) {
        customCss = cssData.css_content
      }
    } catch (cssErr) {
      console.error('Error fetching custom CSS:', cssErr)
    }

    // Format dates server-side to avoid hydration mismatch
    const { date: pubDate, time: pubTime } = formatDateForDisplay(post.published_at)
    const { date: updatedDate } = formatDateForDisplay(post.updated_at)

    return {
      props: {
        post: {
          ...post,
          publishedFormatted: `${pubDate} at ${pubTime}`,
          updatedFormatted: updatedDate,
        },
        customCss,
      },
      revalidate: 3600,
    }
  } catch (err) {
    console.error('Error in getStaticProps:', err)
    return {
      notFound: true,
      revalidate: 3600,
    }
  }
}

export async function getStaticPaths() {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published')

    if (error || !posts) {
      return {
        paths: [],
        fallback: 'blocking',
      }
    }

    return {
      paths: posts.map((post) => ({
        params: { slug: post.slug },
      })),
      fallback: 'blocking',
    }
  } catch (err) {
    console.error('Error in getStaticPaths:', err)
    return {
      paths: [],
      fallback: 'blocking',
    }
  }
}
