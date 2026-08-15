import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Calendar, ArrowLeft } from 'lucide-react'
import DOMPurify from 'dompurify'
import PageHeader from '../components/PageHeader'
import { BlogDetaySkeleton } from '../components/Skeletons'
import LoadError from '../components/LoadError'
import SEO from '../components/SEO'
import { fetchPostBySlug } from '../api/blog.js'
import { formatDate } from '../lib/date.js'
import { API } from '../api/config.js'

export default function BlogDetay() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchPostBySlug(slug)
      .then(setPost)
      .catch((err) => {
        if (err.status === 404) {
          navigate('/blog', { replace: true })
          return
        }
        setError(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) {
    return (
      <>
        <PageHeader title="Blog" parent={{ to: '/blog', label: 'Blog' }} />
        <BlogDetaySkeleton />
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Blog" parent={{ to: '/blog', label: 'Blog' }} />
        <LoadError message="Yazı yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin." onRetry={load} />
      </>
    )
  }

  if (!post) return null

  const absoluteImage = post.coverImage
    ? `https://renelenerji.com${post.coverImage}`
    : undefined

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt || post.title,
    image: absoluteImage,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: {
      '@type': 'Organization',
      name: 'RenEl Enerji Mühendislik',
      url: 'https://renelenerji.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RenEl Enerji Mühendislik',
      logo: { '@type': 'ImageObject', url: 'https://renelenerji.com/renel-logo.svg' },
    },
  }

  return (
    <>
      <SEO
        title={post.title}
        description={post.metaDescription || post.excerpt || post.title}
        image={absoluteImage}
        type="article"
        jsonLd={blogSchema}
      />
      <PageHeader title={post.title} parent={{ to: '/blog', label: 'Blog' }} />

      <article className="max-w-3xl mx-auto px-6 py-16">
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-10 shadow-md">
            <img
              src={`${API}${post.coverImage}`}
              alt={post.title}
              className="w-full max-h-80 object-cover" loading="lazy" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(post.publishedAt || post.createdAt)}
          </p>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-gray-500 leading-relaxed mb-8 border-l-4 border-[#448834] pl-4">{post.excerpt}</p>
        )}

        <div
          className="prose prose-gray max-w-none text-gray-700 leading-relaxed blog-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#448834] font-semibold hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} />
            Tüm Yazılar
          </Link>
        </div>
      </article>
    </>
  )
}
