import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import BannerHero from '../../components/BannerHero';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import api from '../../../../shared/api/axiosInstance';
import ApplyDialog from './ApplyDialog';

/**
 * The internship programme.
 *
 * Tracks, courses and the headline numbers are all admin-curated: the page
 * renders what the API returns and counts nothing itself, so a track added in
 * the admin panel appears here immediately.
 */

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const WHY = [
  { icon: Briefcase, title: 'Hands-on', sub: 'Industry exposure' },
  { icon: TrendingUp, title: 'Live Projects', sub: 'Real world impact' },
  { icon: MapPin, title: 'Travel & Explore', sub: 'New places' },
  { icon: GraduationCap, title: 'Skill Development', sub: 'In-demand skills' },
  { icon: Award, title: 'Certificate & LOR', sub: 'Recognised by Taxi09' },
  { icon: Users, title: 'Career Growth', sub: 'Get placed faster' },
];

const STEPS = [
  ['Apply Online', 'Fill the application form'],
  ['Shortlisting', 'We review your application'],
  ['Interview', 'Online interaction with our team'],
  ['Offer Letter', 'Receive your offer'],
  ['Onboarding', 'Start your journey with Taxi09'],
];


const DesktopInternship = () => {
  const { theme, toggleTheme } = useDesktopTheme();
  const [tracks, setTracks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});
  const [mine, setMine] = useState({ applications: [], certificates: [] });
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const loadMine = () =>
    api.get('/users/internship/mine')
      .then((response) => setMine(response?.data || { applications: [], certificates: [] }))
      .catch(() => {});

  useEffect(() => {
    Promise.allSettled([
      api.get('/users/internship/tracks'),
      api.get('/users/courses'),
      api.get('/users/internship/stats'),
      api.get('/users/internship/mine'),
    ])
      .then(([t, c, s, m]) => {
        if (t.status === 'fulfilled') setTracks(t.value?.data?.results || []);
        if (c.status === 'fulfilled') setCourses(c.value?.data?.results || []);
        if (s.status === 'fulfilled') setStats(s.value?.data || {});
        if (m.status === 'fulfilled') setMine(m.value?.data || { applications: [], certificates: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const appliedFor = (id) => mine.applications.some((a) => String(a.trackId) === String(id) || String(a.courseId) === String(id));

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/internship" theme={theme} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-[1728px] px-4 pb-16 pt-5 xl:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {/* Hero is admin artwork - Homepage Banners > Internship. */}
            <BannerHero type="internship" rounded="rounded-2xl" className="mb-4" />

            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-8">
              {/* Counts, taken from the programme rather than typed in */}
              {!loading ? (
                <div className="mt-6 flex flex-wrap gap-8 rounded-2xl bg-slate-900 px-6 py-4">
                  {[
                    [stats.tracks, 'Internship Tracks'],
                    [stats.courses, 'Courses'],
                    [stats.cities, 'Cities'],
                    [stats.placed, 'Interns Onboarded'],
                    [stats.certificates, 'Certificates Issued'],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <p className="text-[20px] font-black text-[#F5B700]">{value ?? 0}</p>
                      <p className="text-[13px] text-slate-300">{label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Tracks */}
            <h2 className="mt-8 text-[20px] font-black text-slate-900">Choose Your Internship Track</h2>
            <p className="text-[14px] text-slate-500">Select a path that matches your goals.</p>

            {loading ? (
              <div className="flex justify-center py-14"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : tracks.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-200 py-14 text-center text-[15px] text-slate-500">
                No tracks are open right now.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tracks.map((track) => (
                  <article key={track._id} className="flex flex-col rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                    {track.image && (
                      <div className="h-44 w-full overflow-hidden bg-slate-50 relative group">
                        <img 
                          src={track.image} 
                          alt={track.title} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3CC] shadow-sm">
                        <GraduationCap size={17} className="text-[#C79100]" />
                      </span>
                      <h3 className="mt-3 text-[16px] font-black leading-snug text-slate-900">{track.title}</h3>
                      {track.durationLabel ? (
                        <p className="mt-1 text-[13.5px] text-slate-500">
                          <span className="font-bold text-slate-700">Duration:</span> {track.durationLabel}
                        </p>
                      ) : null}
                      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">{track.summary}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(track.skills || []).slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[12.5px] font-semibold text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[13.5px] text-slate-500">
                          {track.seats > 0 ? `${track.seats} seats` : ''}
                          {track.stipend > 0 ? ` · ${money(track.stipend)}/mo` : ''}
                        </span>
                        <button
                          onClick={() => setApplying({ kind: 'track', id: track._id, title: track.title })}
                          disabled={appliedFor(track._id)}
                          className="rounded-lg bg-[#F5B700] px-3 py-1.5 text-[13.5px] font-black text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 transition-colors hover:bg-[#E0A600]"
                        >
                          {appliedFor(track._id) ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Courses */}
            <h2 className="mt-9 text-[20px] font-black text-slate-900">Courses (with certificates)</h2>
            <p className="text-[14px] text-slate-500">Classroom courses that award a recognised certificate.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <article key={course._id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3CC]">
                      <BookOpen size={17} className="text-[#C79100]" />
                    </span>
                    <span className="flex gap-1.5">
                      {course.badge ? (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[12px] font-black text-emerald-700">
                          {course.badge}
                        </span>
                      ) : null}
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[12px] font-bold capitalize text-slate-600">
                        {course.mode}
                      </span>
                    </span>
                  </div>

                  <h3 className="mt-3 text-[16px] font-black leading-snug text-slate-900">{course.title}</h3>
                  <p className="mt-1.5 flex-1 text-[14px] text-slate-600">{course.summary}</p>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13.5px] text-slate-500">
                    {course.rating > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-[#F5B700]" fill="currentColor" />
                        {course.rating} ({course.ratingCount})
                      </span>
                    ) : null}
                    {course.lessons > 0 ? <span className="flex items-center gap-1"><BookOpen size={11} /> {course.lessons} lessons</span> : null}
                    {course.durationLabel ? <span className="flex items-center gap-1"><Clock size={11} /> {course.durationLabel}</span> : null}
                  </div>

                  {course.venue ? (
                    <p className="mt-1.5 flex items-center gap-1 text-[13px] text-slate-500">
                      <MapPin size={11} /> {course.venue}
                    </p>
                  ) : null}
                  {course.startDate ? (
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
                      <CalendarDays size={11} /> Starts {course.startDate}
                    </p>
                  ) : null}

                  {course.awardsCertificate ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[13.5px] font-bold text-emerald-700">
                      <BadgeCheck size={13} /> {course.certificateTitle || 'Certificate on completion'}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span>
                      <span className="text-[16.5px] font-black text-slate-900">{money(course.price)}</span>
                      {course.oldPrice > course.price ? (
                        <span className="ml-1.5 text-[13.5px] text-slate-400 line-through">{money(course.oldPrice)}</span>
                      ) : null}
                    </span>
                    <button
                      onClick={() => setApplying({ kind: 'course', id: course._id, title: course.title })}
                      disabled={appliedFor(course._id)}
                      className="rounded-lg bg-[#F5B700] px-3 py-1.5 text-[13.5px] font-black text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {appliedFor(course._id) ? 'Enrolled' : 'Enrol'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="text-[16.5px] font-black text-slate-900">Why Intern With Taxi09?</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {WHY.map((item) => (
                  <div key={item.title}>
                    <item.icon size={17} className="text-[#C79100]" />
                    <p className="mt-1 text-[13.5px] font-black text-slate-900">{item.title}</p>
                    <p className="text-[12.5px] text-slate-500">{item.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="text-[16.5px] font-black text-slate-900">How to Apply?</h2>
              <ol className="mt-3 space-y-3">
                {STEPS.map(([title, sub], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5B700] text-[13px] font-black text-slate-900">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-[14px] font-black text-slate-900">{title}</span>
                      <span className="block text-[13px] text-slate-500">{sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Only shown once the person actually has something */}
            {mine.applications.length > 0 || mine.certificates.length > 0 ? (
              <section className="rounded-2xl border border-slate-100 bg-white p-5">
                <h2 className="text-[16.5px] font-black text-slate-900">Your Applications</h2>

                <div className="mt-3 space-y-2.5">
                  {mine.applications.map((row) => (
                    <div key={row._id} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[14px] font-bold text-slate-900">
                        {row.trackTitle || row.courseTitle}
                      </p>
                      <p className="text-[13px] text-slate-500">
                        {row.reference} · <span className="font-bold capitalize">{row.status}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {mine.certificates.length > 0 ? (
                  <>
                    <h3 className="mt-4 text-[14.5px] font-black text-slate-900">Certificates</h3>
                    {mine.certificates.map((certificate) => (
                      <div key={certificate._id} className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                        <p className="flex items-center gap-1.5 text-[14px] font-black text-emerald-800">
                          <Award size={14} /> {certificate.title}
                        </p>
                        <p className="text-[13px] text-emerald-700">{certificate.certificateNumber}</p>
                      </div>
                    ))}
                  </>
                ) : null}
              </section>
            ) : null}

            <div className="rounded-2xl bg-gradient-to-br from-[#FFD400] to-[#F5B700] p-5">
              <p className="flex items-center gap-2 text-[16.5px] font-black text-slate-900">
                <CheckCircle2 size={16} /> Your Journey Begins Here
              </p>
              <p className="mt-1 text-[13.5px] text-slate-800">
                Don't just dream about a travel career. Build it with Taxi09.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {applying ? (
        <ApplyDialog
          target={applying}
          onClose={() => setApplying(null)}
          onDone={() => {
            setApplying(null);
            toast.success('Application submitted');
            loadMine();
          }}
        />
      ) : null}
    </div>
  );
};

export default DesktopInternship;
