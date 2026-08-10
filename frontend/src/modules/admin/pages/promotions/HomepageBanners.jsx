import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const Motion = motion;

const createInitialFormData = (type) => ({
  image: null,
  image_url: '',
  desktopImage: null,
  use_url: false,
  type: type || 'top',
});

const HomepageBanners = ({ type = 'top', mode = 'list' }) => {
  const navigate = useNavigate();
  const isCreateRoute = mode === 'create';

  const LIST_PATH = `/admin/homepage-banners/${type}`;
  const CREATE_PATH = `/admin/homepage-banners/${type}/create`;

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => createInitialFormData(type));
  const [imagePreview, setImagePreview] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(null);

  const token = localStorage.getItem('adminToken') || '';
  const baseUrl = globalThis.__LEGACY_BACKEND_ORIGIN__ + '/api/v1/admin';

  const resolveImageUrl = useCallback(
    (img) => {
      if (!img) return null;
      if (img.startsWith('data:') || img.startsWith('http')) return img;
      const rootUrl = baseUrl.replace('/api/v1/admin', '');
      return `${rootUrl}/${img.startsWith('/') ? img.slice(1) : img}`;
    },
    [baseUrl],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/banners?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const items = data.data?.results || (Array.isArray(data.data) ? data.data : data.results || []);
          setBanners(items);
        } else {
          setBanners([]);
        }
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isCreateRoute) {
      setFormData(createInitialFormData(type));
      setImagePreview(null);
    }
  }, [isCreateRoute, type]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormData((current) => ({
      ...current,
      image: file,
      use_url: false,
      image_url: '',
    }));
    setImagePreview(URL.createObjectURL(file));
  };

  /** Optional wide-screen artwork; without it the phone image serves both. */
  const handleDesktopImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormData((current) => ({ ...current, desktopImage: file }));
    setDesktopPreview(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    // Either slot alone is a complete banner; the server copies whichever is
    // missing across so both surfaces have artwork.
    if (formData.use_url && !formData.image_url.trim()) {
      alert('Please enter an image URL');
      return;
    }

    if (!formData.use_url && !formData.image && !formData.desktopImage) {
      alert('Upload a phone or desktop banner image');
      return;
    }

    setSaving(true);
    try {
      let imageData = formData.use_url ? formData.image_url.trim() : '';

      if (!formData.use_url && formData.image instanceof File) {
        imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.image);
        });
      }

      let desktopData = '';
      if (formData.desktopImage instanceof File) {
        desktopData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.desktopImage);
        });
      }

      const payload = {
        image: imageData,
        desktopImage: desktopData,
        image_url: formData.image_url.trim(),
        use_url: formData.use_url,
        type: type, // Hardcoded type from props
      };

      const res = await fetch(`${baseUrl}/banners`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFormData(createInitialFormData(type));
        setImagePreview(null);
        await fetchData();
        navigate(LIST_PATH);
      } else {
        alert(data.message || 'Failed to save banner');
      }
    } catch (error) {
      console.error('Save banner error:', error);
      alert(`Network Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const res = await fetch(`${baseUrl}/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Delete banner error:', error);
    }
  };

  const toggleStatus = async (item) => {
    const id = item._id || item.id;
    try {
      const res = await fetch(`${baseUrl}/banners/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json();
      if (data.success) {
        setBanners((current) =>
          current.map((banner) => ((banner._id || banner.id) === id ? { ...banner, active: !item.active } : banner)),
        );
      }
    } catch (error) {
      console.error('Banner status toggle error:', error);
    }
  };

  const pageTitle = type === 'top' ? 'HOMEPAGE TOP BANNERS' : 'HOMEPAGE BOTTOM BANNERS';
  const pageLabel = type === 'top' ? 'Top Banners' : 'Bottom Banners';

  return (
    <div className="space-y-6 p-1 animate-in fade-in duration-500 font-sans text-gray-950 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-black text-[#2D3A6E] uppercase tracking-tight italic leading-none mb-1">
            {isCreateRoute ? `CREATE ${pageLabel.toUpperCase()}` : pageTitle}
          </h1>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            <span>Homepage Banners</span>
            <ChevronRight size={12} className="opacity-50" />
            <span className="text-gray-900">{isCreateRoute ? 'Create' : pageLabel}</span>
          </div>
        </div>
        {isCreateRoute ? (
          <button
            type="button"
            onClick={() => navigate(LIST_PATH)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {!isCreateRoute ? (
          <Motion.div
            key="banner-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[22px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-500 font-semibold">
                  <span>List of active carousels</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(CREATE_PATH)}
                  className="bg-[#2D3A6E] text-white h-10 px-5 rounded-lg flex items-center gap-2 text-[13px] font-bold hover:bg-[#1d2756] transition-all"
                >
                  <Plus size={16} />
                  Add {pageLabel}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr className="text-[13px] font-bold text-gray-700">
                      <th className="px-6 py-4">Icon / Preview</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-14 text-center text-sm text-gray-400">
                          Loading banners...
                        </td>
                      </tr>
                    ) : banners.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-14 text-center text-sm text-gray-400">
                          No banners found in this section.
                        </td>
                      </tr>
                    ) : (
                      banners.map((item) => (
                        <tr key={item._id || item.id}>
                          <td className="px-6 py-4">
                            <div className="h-14 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                              {item.image ? (
                                <img
                                  src={resolveImageUrl(item.image)}
                                  alt="Banner"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => toggleStatus(item)}
                              className={`inline-flex rounded px-2.5 py-1 text-[11px] font-bold uppercase ${
                                item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {item.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(item._id || item.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-rose-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Motion.div>
        ) : (
          <Motion.form
            key="banner-create"
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[22px] border border-gray-200 shadow-sm p-8"
          >
            <div className="space-y-6 max-w-3xl">
              {/* Two equal slots. Either one on its own is a valid banner - the
                  backend copies whichever is missing across - so neither is
                  marked required and the copy says so plainly. */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-900">
                  Banner artwork
                </label>
                <p className="mt-1 text-[13px] text-gray-500">
                  Upload one or both. If you add only one, it is used on phone and desktop.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {[
                    {
                      key: 'image',
                      heading: 'Phone',
                      hint: 'Tall artwork, shown in the app',
                      preview: imagePreview,
                      onChange: handleImageChange,
                      onRemove: () => {
                        setImagePreview(null);
                        setFormData((current) => ({ ...current, image: null }));
                      },
                    },
                    {
                      key: 'desktopImage',
                      heading: 'Desktop',
                      hint: 'Wide artwork, shown on the website',
                      preview: desktopPreview,
                      onChange: handleDesktopImageChange,
                      onRemove: () => {
                        setDesktopPreview(null);
                        setFormData((current) => ({ ...current, desktopImage: null }));
                      },
                    },
                  ].map((slot) => (
                    <div key={slot.key} className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-4">
                      <div className="mb-3 flex items-baseline justify-between gap-2">
                        <p className="text-[14px] font-semibold text-gray-900">{slot.heading}</p>
                        <span className="text-[12px] font-medium text-gray-400">Optional</span>
                      </div>

                      {slot.preview ? (
                        <div className="space-y-3">
                          <img
                            src={slot.preview}
                            alt={`${slot.heading} banner preview`}
                            className="h-32 w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                          />
                          <button
                            type="button"
                            onClick={slot.onRemove}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 text-center transition-colors hover:bg-gray-100">
                          <input type="file" className="hidden" accept="image/*" onChange={slot.onChange} />
                          <Upload size={24} className="text-gray-500" />
                          <p className="text-[14px] font-medium text-gray-900">Upload {slot.heading.toLowerCase()} image</p>
                          <p className="text-[12px] text-gray-500">{slot.hint}</p>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.use_url}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((current) => ({
                        ...current,
                        use_url: checked,
                        image: checked ? null : current.image,
                      }));
                      if (checked) {
                        setImagePreview(null);
                      }
                    }}
                    className="rounded border-gray-300 text-[#2D3A6E] focus:ring-[#2D3A6E]"
                  />
                  <span>Use image URL</span>
                </label>

                {formData.use_url ? (
                  <div>
                    <label className="block text-[14px] font-semibold text-gray-900 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData((current) => ({ ...current, image_url: e.target.value }))}
                      className="w-full max-w-xl border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-6 bg-[#2D3A6E] text-white rounded-lg text-[13px] font-bold hover:bg-[#1d2756] transition-all inline-flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Banner
              </button>
            </div>
          </Motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomepageBanners;
