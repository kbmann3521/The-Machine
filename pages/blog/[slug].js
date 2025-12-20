import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'
import styles from '../../styles/blog-post.module.css'

export default function BlogPost({ post }) {
  if (!post) {
    return (
      <div className={styles.postPage}>
        <Head>
          <title>Post Not Found</title>
        </Head>
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

  return (
    <div className={styles.postPage}>
      <Head>
        <title>{post.title} - Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://www.pioneerwebtools.com/blog/${post.slug}`} />
      </Head>

      <header className={styles.postHeader}>
        <div className={styles.postHeaderContent}>
          {post.thumbnail_url && (
            <div className={styles.postHeaderThumbnail}>
              <img src={post.thumbnail_url} alt={post.title} />
            </div>
          )}
          <div className={styles.postHeaderInfo}>
            <h1 className={styles.postTitle}>{post.title}</h1>
            <div className={styles.postMeta}>
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
        <article className={styles.postContent}>
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

// Simple Markdown renderer (converts common markdown to HTML)
function MarkdownContent({ content }) {
  const html = parseMarkdown(content)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function parseMarkdown(markdown) {
  let html = markdown

  // Escape HTML special characters first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks (triple backticks)
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapedCode}</code></pre>`
  })

  // Inline code (backticks)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')

  // Blockquotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>')

  // Unordered lists
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = `<p>${html}</p>`

  // Clean up
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>|<ol>|<blockquote>)/g, '$1')
  html = html.replace(/(<\/ul>|<\/ol>|<\/blockquote>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)<\/p>/g, '$1')

  return html
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
