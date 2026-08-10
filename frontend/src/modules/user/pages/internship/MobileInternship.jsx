import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import BottomNavbar from '../../components/BottomNavbar';
import api from '../../../../shared/api/axiosInstance';
import ApplyDialog from './ApplyDialog';

/**
 * The internship programme on a phone.
 *
 * Same endpoints as the desktop page, stacked into one column with the tracks
 * and courses on their own tabs so neither list buries the other.
 */

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const STEPS = [
  ['Apply Online', 'Fill the application form'],
  ['Shortlisting', 'We review your application'],
  ['Interview', 'Online interaction with our team'],
  ['Offer Letter', 'Receive your offer'],
  ['Onboarding', 'Start your journey with Taxi09'],
];

const MobileInternship = () => {
  const [tab, setTab] = useState('tracks');
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

  const appliedFor = (id) =>
    mine.applications.some((a) => String(a.trackId) === String(id) || String(a.courseId) === String(id));

  return (
    <div className="premium-theme mx-auto min-h-screen max-w-lg bg-[#fffdf8] pb-24">
      <AppHeader subtitle="INTERNSHIP PROGRAM" />

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#FFF9E6] to-[#fffdf8] px-4 pb-5 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF0B8] px-2 py-1 text-[9.5px] font-black uppercase tracking-wider text-[#9A6B00]">
          <Sparkles size={11} /> Travel career programme
        </span>
        <h1 className="mt-2.5 text-[24px] font-black leading-[1.15] text-slate-900">
          Learn. Explore. Inspire.<br />
          Build Your Future in <span className="text-[#C79100]">Tourism.</span>
        </h1>
        <p className="mt-1.5 text-[12.5px] text-slate-600">
          Real-world experience, mentorship and recognised certificates.
        </p>

        {/* Counts come from the programme, not from copy */}
        {!loading ? (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-900 px-3 py-3">
            {[
              [stats.tracks, 'Tracks'],
              [stats.courses, 'Courses'],
              [stats.cities, 'Cities'],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <p className="text-[17px] font-black text-[#F5B700]">{value ?? 0}</p>
                <p className="text-[10px] text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Your applications, only once there are some */}
      {mine.applications.length > 0 ? (
        <div className="px-4 pb-1">
          <h2 className="text-[13.5px] font-black text-slate-900">Your Applications</h2>
          <div className="mt-2 space-y-2">
            {mine.applications.map((row) => (
              <div key={row._id} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                <p className="text-[12.5px] font-bold text-slate-900">{row.trackTitle || row.courseTitle}</p>
                <p className="text-[11px] text-slate-500">
                  {row.reference} · <span className="font-bold capitalize">{row.status}</span>
                </p>
              </div>
            ))}
          </div>

          {mine.certificates.length > 0 ? (
            <div className="mt-2 space-y-2">
              {mine.certificates.map((certificate) => (
                <div key={certificate._id} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-black text-emerald-800">
                    <Award size={13} /> {certificate.title}
                  </p>
                  <p className="font-mono text-[10.5px] text-emerald-700">{certificate.certificateNumber}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="sticky top-0 z-10 mt-3 flex gap-4 border-b border-slate-200 bg-[#fffdf8] px-4">
        {[['tracks', `Tracks (${tracks.length})`], ['courses', `Courses (${courses.length})`], ['how', 'How to apply']].map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 pb-2.5 pt-1 text-[12.5px] font-bold transition-colors ${
                tab === key ? 'border-[#F5B700] text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : null}

        {!loading && tab === 'tracks' ? (
          tracks.length === 0 ? (
            <p className="py-14 text-center text-[13px] text-slate-500">No tracks are open right now.</p>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => (
                <article key={track._id} className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                  {track.image && (
                    <div className="h-32 w-full overflow-hidden bg-slate-50 relative">
                      <img 
                        src={track.image} 
                        alt={track.title} 
                        className="h-full w-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3CC] shadow-sm">
                        <GraduationCap size={16} className="text-[#C79100]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-black leading-snug text-slate-900">{track.title}</h3>
                        {track.durationLabel ? (
                          <p className="text-[11px] text-slate-500">{track.durationLabel}</p>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-600">{track.summary}</p>

                    {(track.skills || []).length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {track.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[11.5px] text-slate-500">
                        {track.seats > 0 ? `${track.seats} seats` : ''}
                        {track.stipend > 0 ? ` · ${money(track.stipend)}/mo` : ''}
                      </span>
                      <button
                        onClick={() => setApplying({ kind: 'track', id: track._id, title: track.title })}
                        disabled={appliedFor(track._id)}
                        className="rounded-lg bg-[#F5B700] px-3.5 py-1.5 text-[12px] font-black text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        {appliedFor(track._id) ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}

        {!loading && tab === 'courses' ? (
          courses.length === 0 ? (
            <p className="py-14 text-center text-[13px] text-slate-500">No courses right now.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <article key={course._id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-black leading-snug text-slate-900">{course.title}</h3>
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold capitalize text-slate-600">
                      {course.mode}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[12.5px] text-slate-600">{course.summary}</p>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    {course.rating > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-[#F5B700]" fill="currentColor" /> {course.rating} ({course.ratingCount})
                      </span>
                    ) : null}
                    {course.lessons > 0 ? <span className="flex items-center gap-1"><BookOpen size={11} /> {course.lessons} lessons</span> : null}
                    {course.durationLabel ? <span className="flex items-center gap-1"><Clock size={11} /> {course.durationLabel}</span> : null}
                  </div>

                  {course.venue ? (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin size={11} /> {course.venue}
                    </p>
                  ) : null}
                  {course.startDate ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <CalendarDays size={11} /> Starts {course.startDate}
                    </p>
                  ) : null}

                  {course.awardsCertificate ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-700">
                      <BadgeCheck size={13} /> {course.certificateTitle || 'Certificate on completion'}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span>
                      <span className="text-[15px] font-black text-slate-900">{money(course.price)}</span>
                      {course.oldPrice > course.price ? (
                        <span className="ml-1.5 text-[11.5px] text-slate-400 line-through">{money(course.oldPrice)}</span>
                      ) : null}
                    </span>
                    <button
                      onClick={() => setApplying({ kind: 'course', id: course._id, title: course.title })}
                      disabled={appliedFor(course._id)}
                      className="rounded-lg bg-[#F5B700] px-3.5 py-1.5 text-[12px] font-black text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {appliedFor(course._id) ? 'Enrolled' : 'Enrol'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}

        {!loading && tab === 'how' ? (
          <ol className="space-y-3">
            {STEPS.map(([title, sub], index) => (
              <li key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5B700] text-[11px] font-black text-slate-900">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-[13px] font-black text-slate-900">{title}</span>
                  <span className="block text-[11.5px] text-slate-500">{sub}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {/* Certificate check, reachable without an account */}
      <div className="mt-5 px-4">
        <a
          href="/taxi/user/verify-certificate"
          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <BadgeCheck size={17} className="text-[#C79100]" />
            <span>
              <span className="block text-[13px] font-black text-slate-900">Verify a certificate</span>
              <span className="block text-[11px] text-slate-500">Check any Taxi09 certificate number</span>
            </span>
          </span>
          <ChevronRight size={16} className="text-slate-400" />
        </a>
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

      <BottomNavbar />
    </div>
  );
};

export default MobileInternship;
