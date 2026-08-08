import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import contentApi from '../../services/contentApi';

/**
 * Blocks hold arbitrary item shapes (hero slides, chips, add-ons), so the editor
 * is a JSON textarea rather than a bespoke form per key. Parse errors are caught
 * before saving so a typo can't push malformed content to the app.
 */
const ContentBlocksAdmin = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [errors, setErrors] = useState({});
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contentApi.listBlocks();
      const results = data?.results || [];
      setBlocks(results);
      setDrafts(
        results.reduce((map, block) => {
          map[block.key] = JSON.stringify(block.items, null, 2);
          return map;
        }, {}),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (block) => {
    const raw = drafts[block.key] ?? '[]';
    let items;
    try {
      items = JSON.parse(raw);
    } catch (parseError) {
      setErrors((current) => ({ ...current, [block.key]: `Invalid JSON: ${parseError.message}` }));
      return;
    }
    if (!Array.isArray(items)) {
      setErrors((current) => ({ ...current, [block.key]: 'Items must be a JSON array' }));
      return;
    }

    setErrors((current) => ({ ...current, [block.key]: '' }));
    setSavingKey(block.key);
    try {
      await contentApi.saveBlock({ key: block.key, label: block.label, items, active: block.active });
      await load();
    } catch (err) {
      setErrors((current) => ({ ...current, [block.key]: err.message }));
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-[22px] font-bold text-slate-900">Page Content</h1>
      <p className="mt-1 text-[13px] text-slate-500">
        Hero slides, category chips, trust badges and add-on catalogues used across the app.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={26} />
          <p className="text-[13px] font-semibold">Loading content…</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {blocks.map((block) => (
            <div key={block.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-bold text-slate-900">{block.label || block.key}</p>
                  <p className="text-[11px] font-mono text-slate-400">{block.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {(block.items || []).length} item{(block.items || []).length === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => save(block)}
                    disabled={savingKey === block.key}
                    className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-[12px] font-bold text-slate-900 disabled:opacity-60"
                  >
                    {savingKey === block.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              </div>

              <textarea
                value={drafts[block.key] ?? ''}
                onChange={(event) => setDrafts((current) => ({ ...current, [block.key]: event.target.value }))}
                spellCheck={false}
                rows={Math.min(20, Math.max(6, (drafts[block.key] || '').split('\n').length))}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[12px] text-slate-800 outline-none focus:border-amber-400"
              />

              {errors[block.key] ? (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-rose-600">
                  <AlertTriangle size={13} /> {errors[block.key]}
                </p>
              ) : null}
            </div>
          ))}

          {blocks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-slate-400">
              No content blocks yet. Run <span className="font-mono">node scripts/seedContent.js</span> to create them.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ContentBlocksAdmin;
