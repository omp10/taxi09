import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';

/**
 * Reads the blog written in the admin panel.
 *
 * One file covers both the index and a single post, because they share the
 * fetch, the chrome and the empty state - the only difference is whether a
 * slug is in the URL.
 *
 * The body is rendered as text split on blank lines, never as markup, so a
 * post cannot inject script into the page.
 */

const unwrap = (response) => response?.data?.data?.results ?? response?.data?.results ?? [];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

const BlogRoute = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    const request = slug ? api.get(`/users/blogs/${slug}`) : api.get('/users/blogs?limit=50');

    request
      .then((response) => {
        if (cancelled) return;
        if (slug) setPost(response?.data?.data ?? response?.data ?? null);
        else setPosts(unwrap(response));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[900px] px-4 py-5 lg:py-10">
        <button
          type="button"
          onClick={() => (slug ? navigate('/taxi/user/blog') : navigate('/taxi/user'))}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          {slug ? 'All stories' : 'Home'}
        </button>

        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Loading...</p>
        ) : failed || (slug && !post) ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">That post is not available.</p>
            <button
              type="button"
              onClick={() => navigate('/taxi/user/blog')}
              className="mt-3 rounded-full bg-[#F5B700] px-4 py-2 text-[13px] font-bold text-slate-900"
            >
              See all stories
            </button>
          </div>
        ) : slug ? (
          <article>
            {post.coverImage ? (
              <img src={post.coverImage} alt="" className="mb-5 aspect-[16/9] w-full rounded-[20px] object-cover" />
            ) : null}
            {post.category ? (
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#F5B700]">{post.category}</p>
            ) : null}
            <h1 className="mt-1 text-[24px] lg:text-[36px] font-black leading-tight text-slate-900">{post.title}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-slate-500">
              {post.author ? <span>{post.author}</span> : null}
              {post.publishedAt ? (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {formatDate(post.publishedAt)}
                </span>
              ) : null}
              {post.readMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {post.readMinutes} min read
                </span>
              ) : null}
            </div>

            {post.excerpt ? (
              <p className="mt-4 text-[15px] lg:text-[17px] font-semibold leading-[1.6] text-slate-600">{post.excerpt}</p>
            ) : null}

            <div className="mt-5 space-y-4">
              {String(post.content || '')
                .split(/\n{2,}/)
                .filter((para) => para.trim())
                .map((para, index) => (
                  <p key={index} className="text-[14.5px] lg:text-[16.5px] leading-[1.75] text-slate-700">
                    {para.trim()}
                  </p>
                ))}
            </div>

            {post.gallery?.length ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {post.gallery.map((image) => (
                  <img key={image} src={image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : null}
          </article>
        ) : (
          <>
            <h1 className="text-[24px] lg:text-[34px] font-black leading-tight text-slate-900">Explore stories &amp; tips</h1>
            <p className="mt-1 text-[13.5px] lg:text-[15px] font-medium text-slate-500">
              Travel guides, car tips and lifestyle stories curated for you.
            </p>

            {posts.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">Nothing published yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => navigate(`/taxi/user/blog/${item.slug}`)}
                    className="group flex flex-col overflow-hidden rounded-[20px] border border-slate-100 bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : null}
                      {item.category ? (
                        <span className="absolute bottom-3 left-3 rounded-md bg-slate-900/85 px-2 py-1 text-[9.5px] font-black uppercase tracking-[0.08em] text-white">
                          {item.category}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      <span className="text-[15px] font-bold leading-[1.35] text-slate-900">{item.title}</span>
                      {item.excerpt ? (
                        <span className="mt-1 line-clamp-2 text-[13px] font-medium leading-[1.5] text-slate-500">{item.excerpt}</span>
                      ) : null}
                      <span className="mt-3 flex items-center gap-3 text-[12px] font-semibold text-slate-400">
                        {formatDate(item.publishedAt)}
                        {item.readMinutes ? <span>{item.readMinutes} min read</span> : null}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogRoute;
