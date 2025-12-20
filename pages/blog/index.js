import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'
import styles from '../../styles/blog-index.module.css'

export default function BlogIndex({ posts }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className={styles.blogContainer}>
      <Head>
        <title>Blog - Pioneer Web Tools</title>
        <meta name="description" content="Read our latest blog posts about web tools and utilities." />
      </Head>

      <header className={styles.blogHeader}>
        <h1 className={styles.blogHeaderTitle}>Blog</h1>
        <p className={styles.blogHeaderSubtitle}>Articles and tutorials for web developers</p>
      </header>

      <main className={styles.blogContent}>
        {posts.length === 0 ? (
          <div className={styles.noPosts}>
            <h2>No posts yet</h2>
            <p>Check back soon for new content.</p>
          </div>
        ) : (
          <div className={styles.postsList}>
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className={styles.postCard}>
                <div className={styles.postCardContent}>
                  {post.thumbnail_url && (
                    <div className={styles.postCardThumbnail}>
                      <img src={post.thumbnail_url} alt={post.title} />
                    </div>
                  )}
                  <div className={styles.postCardText}>
                    <h2 className={styles.postCardTitle}>{post.title}</h2>
                    <time className={styles.postCardDate}>{formatDate(post.published_at)}</time>
                    {post.excerpt && <p className={styles.postCardExcerpt}>{post.excerpt}</p>}
                    <span className={styles.readMoreLink}>Read more →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export async function getStaticProps() {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return {
        props: { posts: [] },
        revalidate: 3600,
      }
    }

    return {
      props: { posts: posts || [] },
      revalidate: 3600,
    }
  } catch (err) {
    console.error('Error in getStaticProps:', err)
    return {
      props: { posts: [] },
      revalidate: 3600,
    }
  }
}
