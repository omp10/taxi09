import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bike,
  ChevronRight,
  Edit2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors';
const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5';

const StatusToggle = ({ active, onToggle }) => (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      onToggle();
    }}
    className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${active ? 'bg-[#10B981]' : 'bg-gray-300'}`}
  >
    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-5.5' : 'translate-x-0'}`} />
  </button>
);

const extractResults = (response) =>
  response?.data?.data?.results?.results ||
  response?.data?.data?.results ||
  response?.data?.results?.results ||
  response?.data?.results ||
  response?.results?.results ||
  response?.results ||
  [];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const RentalVehicleSubcategories = ({ mode: propMode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isCreate = propMode === 'create' || location.pathname.endsWith('/create');
  const isEdit = propMode === 'edit' || location.pathname.includes('/edit/');
  const isList = !isCreate && !isEdit;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
    vehicleCategory: 'Bike',
    status: 'active',
    image: '',
    bgClass: 'bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]',
    borderClass: 'border-[#FFDCD2]/40',
    imageScale: 'scale-110',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await adminService.getRentalVehicleSubcategories();
      const results = extractResults(response);
      setItems(Array.isArray(results) ? results : []);
    } catch (error) {
      toast.error('Failed to load rental sub categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isList) {
      fetchItems();
      return;
    }

    const loadItem = async () => {
      try {
        setLoading(true);
        const response = await adminService.getRentalVehicleSubcategories();
        const results = extractResults(response);
        const selected = (Array.isArray(results) ? results : []).find(
          (entry) => String(entry._id || entry.id) === String(id),
        );
        if (selected) {
          setFormData({
            name: selected.name || '',
            short_description: selected.short_description || '',
            description: selected.description || '',
            vehicleCategory: 'Bike',
            status: selected.status || (selected.active === false ? 'inactive' : 'active'),
            image: selected.image || '',
            bgClass: selected.bgClass || 'bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]',
            borderClass: selected.borderClass || 'border-[#FFDCD2]/40',
            imageScale: selected.imageScale || 'scale-110',
          });
        }
      } catch (error) {
        toast.error('Failed to load rental sub category');
      } finally {
        setLoading(false);
      }
    };

    if (isEdit && id) {
      loadItem();
    } else {
      setLoading(false);
    }
  }, [id, isEdit, isList]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        [item.name, item.short_description, item.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [items, searchTerm],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Sub category name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        vehicleCategory: 'Bike',
        active: formData.status === 'active',
      };

      if (isEdit) {
        await adminService.updateRentalVehicleSubcategory(id, payload);
        toast.success('Rental sub category updated');
      } else {
        await adminService.createRentalVehicleSubcategory(payload);
        toast.success('Rental sub category created');
      }

      navigate('/admin/pricing/rental-vehicle-subcategories');
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to save rental sub category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subcategoryId) => {
    if (!window.confirm('Delete this rental sub category?')) return;
    try {
      await adminService.deleteRentalVehicleSubcategory(subcategoryId);
      toast.success('Rental sub category deleted');
      fetchItems();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete rental sub category');
    }
  };

  if (isList) {
    return (
      <div className="min-h-screen bg-[#F3F4F9] animate-in fade-in duration-500 font-sans flex flex-col">
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0 shadow-sm relative z-10">
          <h1 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">RENTAL SUB CATEGORY</h1>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
            <span>Rental</span>
            <ChevronRight size={12} className="opacity-30" />
            <span className="text-gray-500">Two Wheeler</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
              <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
                  <span>show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(event) => setEntriesPerPage(Number(event.target.value))}
                    className="bg-white border border-gray-300 rounded-md px-2 py-1 text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search sub categories..."
                      className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all w-64"
                    />
                  </div>
                  <button
                    onClick={() => navigate('create')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3B488C] text-white rounded-lg text-[13px] font-bold shadow-md hover:bg-[#2D3870] transition-colors"
                  >
                    <Plus size={18} />
                    Add Sub Category
                  </button>
                </div>
              </div>

              <div className="px-8 pb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#E9E9E9]">
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Name</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Section</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Status</th>
                        <th className="px-6 py-4 text-right text-[13px] font-bold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="py-24 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                          </td>
                        </tr>
                      ) : filteredItems.length > 0 ? (
                        filteredItems.slice(0, entriesPerPage).map((item) => {
                          const itemId = item._id || item.id;
                          const active = item.status === 'active' || item.active;
                          return (
                            <tr key={itemId} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-slate-50 border border-slate-100 text-indigo-600 rounded-lg h-10 w-16 flex items-center justify-center overflow-hidden shrink-0">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                    ) : (
                                      <Bike size={16} />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-bold text-slate-700">{item.name}</div>
                                    <div className="text-[11px] text-slate-400">{item.short_description || 'Two wheeler rental sub category'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Two Wheeler
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <StatusToggle
                                  active={active}
                                  onToggle={() =>
                                    adminService
                                      .updateRentalVehicleSubcategory(itemId, {
                                        status: active ? 'inactive' : 'active',
                                        active: !active,
                                      })
                                      .then(() => {
                                        toast.success('Status updated');
                                        fetchItems();
                                      })
                                  }
                                />
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => navigate(`edit/${itemId}`)}
                                    className="p-2 bg-orange-50 text-orange-400 hover:bg-orange-100 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(itemId)}
                                    className="p-2 bg-rose-50 text-rose-400 hover:bg-rose-100 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-32 text-center text-gray-400 font-medium italic">
                            No two wheeler sub categories configured yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] animate-in fade-in duration-500 font-sans flex flex-col">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <h1 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">
          {isEdit ? 'EDIT SUB CATEGORY' : 'CREATE SUB CATEGORY'}
        </h1>
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
          <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/admin/pricing/rental-vehicle-subcategories')}>
            Rental Sub Category
          </span>
          <ChevronRight size={12} className="opacity-50" />
          <span className="text-gray-700 uppercase">{isEdit ? 'Edit' : 'Create'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-10 shrink-0">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-[1100px] mx-auto bg-white rounded shadow-sm border border-gray-100 mb-20 relative">
          <div className="p-8 lg:px-12 lg:py-10 border-b border-gray-100 border-dashed">
            <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Two wheeler rental sub category</p>
                <p className="mt-1 text-xs text-slate-500">This master is restricted to the bike section so admins can tag rental vehicles more precisely.</p>
              </div>
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-bold text-indigo-700">
                Bike only
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Sub Category Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Scooty, Sports Bike, EV Bike"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Vehicle Section</label>
                <input value="Two Wheeler / Bike" disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Short Description</label>
                <input
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  placeholder="Quick short note for admins"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1.5 font-sans md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Add a longer description for this two wheeler sub category."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="space-y-1.5 font-sans md:col-span-2">
                <label className={labelClass}>Banner Image (Upload or Data URL)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formData.image && (
                    <div className="h-28 w-44 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2 shrink-0 overflow-hidden relative group">
                      <img src={formData.image} alt="Preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormData(current => ({ ...current, image: '' }))}
                        className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-in fade-in"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const dataUrl = await fileToDataUrl(file);
                          setFormData(current => ({ ...current, image: dataUrl }));
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <input
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="Or paste direct image URL / base64 data..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Background CSS Class / Gradient</label>
                <select
                  name="bgClass"
                  value={formData.bgClass}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]">Orange Gradient (from-[#FFEBE6] to-[#FFF0E6])</option>
                  <option value="bg-gradient-to-br from-[#E8ECEF] to-[#DCE2E7]">Gray Gradient (from-[#E8ECEF] to-[#DCE2E7])</option>
                  <option value="bg-gradient-to-br from-[#E2ECE9] to-[#D5E5E0]">Teal Gradient (from-[#E2ECE9] to-[#D5E5E0])</option>
                  <option value="bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1]">Slate Gradient (from-[#E2E8F0] to-[#CBD5E1])</option>
                  <option value="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]">Purple Gradient (from-[#F5F3FF] to-[#EDE9FE])</option>
                  <option value="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]">Green Gradient (from-[#ECFDF5] to-[#D1FAE5])</option>
                  <option value="custom">Custom CSS Class...</option>
                </select>
                {formData.bgClass === 'custom' || (!['bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]', 'bg-gradient-to-br from-[#E8ECEF] to-[#DCE2E7]', 'bg-gradient-to-br from-[#E2ECE9] to-[#D5E5E0]', 'bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1]', 'bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]', 'bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]'].includes(formData.bgClass)) ? (
                  <input
                    name="bgClass"
                    value={formData.bgClass === 'custom' ? '' : formData.bgClass}
                    onChange={handleInputChange}
                    placeholder="Enter custom tailwind bg classes..."
                    className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                ) : null}
              </div>

              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Border CSS Class</label>
                <select
                  name="borderClass"
                  value={formData.borderClass}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="border-[#FFDCD2]/40">Orange Border (border-[#FFDCD2]/40)</option>
                  <option value="border-[#CFD9E1]/40">Gray Border (border-[#CFD9E1]/40)</option>
                  <option value="border-[#C8DDD7]/40">Teal Border (border-[#C8DDD7]/40)</option>
                  <option value="border-slate-200/40">Slate Border (border-slate-200/40)</option>
                  <option value="border-purple-200/40">Purple Border (border-purple-200/40)</option>
                  <option value="border-emerald-200/40">Emerald Border (border-emerald-200/40)</option>
                  <option value="custom">Custom CSS Class...</option>
                </select>
                {formData.borderClass === 'custom' || (!['border-[#FFDCD2]/40', 'border-[#CFD9E1]/40', 'border-[#C8DDD7]/40', 'border-slate-200/40', 'border-purple-200/40', 'border-emerald-200/40'].includes(formData.borderClass)) ? (
                  <input
                    name="borderClass"
                    value={formData.borderClass === 'custom' ? '' : formData.borderClass}
                    onChange={handleInputChange}
                    placeholder="Enter custom tailwind border classes..."
                    className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                ) : null}
              </div>

              <div className="space-y-1.5 font-sans">
                <label className={labelClass}>Banner Image Scale</label>
                <select
                  name="imageScale"
                  value={formData.imageScale}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="scale-100">scale-100 (100% size)</option>
                  <option value="scale-105">scale-105 (105% size)</option>
                  <option value="scale-110">scale-110 (110% size)</option>
                  <option value="scale-115">scale-115 (115% size)</option>
                  <option value="scale-120">scale-120 (120% size)</option>
                  <option value="scale-125">scale-125 (125% size)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-8 flex justify-between items-center gap-4">
            <button
              onClick={() => navigate('/admin/pricing/rental-vehicle-subcategories')}
              className="px-6 py-2.5 bg-gray-50 text-gray-500 rounded text-sm font-semibold hover:bg-gray-100 transition-all active:scale-95 border border-gray-200 inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="px-10 py-2.5 bg-[#3B488C] text-white rounded text-sm font-bold hover:bg-[#2D3870] transition-all shadow-md active:scale-95 flex items-center gap-2 group disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
              {isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RentalVehicleSubcategories;
