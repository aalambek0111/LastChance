import React, { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  DollarSign,
  MapPin,
  Tag,
  X,
  Plus,
  Save,
  Trash2,
  AlignLeft,
  Layout,
  Image as ImageIcon,
} from 'lucide-react';
import { TOURS } from '../../data/mockData';

interface TourEditFormProps {
  tour: typeof TOURS[0];
  onSave: (t: typeof TOURS[0]) => void;
  onDelete?: (id: number) => void;
  onClose?: () => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&q=80&w=900';

const TourEditForm: React.FC<TourEditFormProps> = ({ tour, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState(tour);
  const [newTag, setNewTag] = useState('');
  const isNew = tour.id === 0;

  useEffect(() => {
    setFormData(tour);
    setNewTag('');
  }, [tour]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(formData) !== JSON.stringify(tour);
    } catch {
      return true;
    }
  }, [formData, tour]);

  const canSave = (formData.name || '').trim().length > 0;

  const requestClose = () => {
    if (!onClose) return;
    if (isDirty) {
      const ok = window.confirm('You have unsaved changes. Close anyway?');
      if (!ok) return;
    }
    onClose();
  };

  const addTag = () => {
    const raw = newTag.trim();
    if (!raw) return;

    // Allow comma-separated tags: "bike, city, sunset"
    const parts = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const existing = new Set(formData.tags || []);
    const nextTags = [...(formData.tags || [])];

    parts.forEach(p => {
      if (!existing.has(p)) nextTags.push(p);
    });

    setFormData({ ...formData, tags: nextTags });
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tagToRemove) });
  };

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_IMAGE;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 relative">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isNew ? 'Create New Tour' : 'Edit Tour Details'}
          </h3>
          {isDirty && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              Unsaved changes
            </div>
          )}
        </div>

        <button
          onClick={requestClose}
          className="p-2 -mr-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800">
        <div className="p-6 space-y-8">
          {/* Tour Name + Active */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Tour Name
                </label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full placeholder-gray-300 leading-tight"
                  placeholder="Enter tour name"
                />
              </div>

              <div className="flex flex-col items-end pt-1">
                <button
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    formData.active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  aria-label="Toggle active"
                >
                  <span
                    className={`${
                      formData.active ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${formData.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className={`text-sm font-medium ${formData.active ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {formData.active ? 'Live on site' : 'Draft mode'}
              </span>
            </div>
          </div>

          {/* Cover image */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
              <ImageIcon className="w-4 h-4 text-gray-400" /> Cover Image
            </h4>

            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
              <img
                src={formData.image || FALLBACK_IMAGE}
                onError={onImgError}
                alt="Tour cover"
                className="w-full h-44 object-cover"
              />
              <div className="p-4">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Image URL</label>
                <input
                  type="text"
                  value={(formData as any).image || ''}
                  onChange={e => setFormData({ ...(formData as any), image: e.target.value } as any)}
                  className="mt-1 w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Paste image URL..."
                />
              </div>
            </div>
          </div>

          {/* Stats (existing only) */}
          {!isNew && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  <Activity className="w-3.5 h-3.5" /> Lifetime Bookings
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {(formData as any).bookingsCount}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  <DollarSign className="w-3.5 h-3.5" /> Total Revenue
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  ${(formData as any).revenue?.toLocaleString?.() ?? (formData as any).revenue ?? 0}
                </div>
              </div>
            </div>
          )}

          {/* Tour Details */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
              <Layout className="w-4 h-4 text-gray-400" /> Tour Details
            </h4>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price ($)</label>
                <input
                  type="number"
                  value={(formData as any).price}
                  onChange={e => setFormData({ ...(formData as any), price: Number(e.target.value) } as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</label>
                <input
                  type="text"
                  value={(formData as any).duration}
                  onChange={e => setFormData({ ...(formData as any), duration: e.target.value } as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. 3h"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Difficulty</label>
                <select
                  value={(formData as any).difficulty || 'Easy'}
                  onChange={e => setFormData({ ...(formData as any), difficulty: e.target.value } as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Hard</option>
                  <option>Expert</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Max Group Size</label>
                <input
                  type="number"
                  value={(formData as any).maxPeople || 0}
                  onChange={e => setFormData({ ...(formData as any), maxPeople: Number(e.target.value) } as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={(formData as any).location || ''}
                  onChange={e => setFormData({ ...(formData as any), location: e.target.value } as any)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Location (e.g. Downtown Marina)"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-4 h-4 text-gray-400" /> Tags
            </h4>

            <div className="flex flex-wrap gap-2">
              {(formData.tags || []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-200 ml-1"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-2">
                <input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Add tag... (comma-separated ok)"
                  className="w-44 px-2 py-1 text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500 outline-none transition-colors placeholder-gray-400"
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="text-indigo-600 disabled:opacity-50 hover:text-indigo-800"
                  aria-label="Add tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
              <AlignLeft className="w-4 h-4 text-gray-400" /> Description
            </h4>

            <div className="relative">
              <textarea
                value={(formData as any).description || ''}
                onChange={e => setFormData({ ...(formData as any), description: e.target.value } as any)}
                rows={6}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all placeholder-gray-400"
                placeholder="Describe the tour experience, highlights, and requirements..."
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                {(formData as any).description?.length || 0} chars
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex gap-3">
        <button
          onClick={() => onSave(formData)}
          disabled={!canSave}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-2xl font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isNew ? 'Create Tour' : 'Save Changes'}
        </button>

        {!isNew && (
          <button
            onClick={() => onDelete && onDelete(tour.id)}
            className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl font-medium transition-colors flex items-center justify-center"
            aria-label="Delete tour"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TourEditForm;
