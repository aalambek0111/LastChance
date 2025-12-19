
import React, { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  MapPin,
  Tag,
  X,
  Plus,
  Save,
  Trash2,
  AlignLeft,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp,
  Eye,
  Ticket
} from 'lucide-react';
import { Tour, PricingTier } from '../../types';

interface TourEditFormProps {
  tour: Tour;
  onSave: (t: Tour) => void;
  onDelete?: (id: number) => void;
  onClose?: () => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&q=80&w=900';

const CURRENT_USER_NAME = "Alex Walker"; // Mock user for activity logs

// Mock data structures for Tabs
interface ActivityLogItem {
  id: string;
  field: string;
  from: string | number | boolean;
  to: string | number | boolean;
  actor: string;
  timestamp: number;
}

interface CommentItem {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

const Toast = ({ message, visible }: { message: string, visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300 z-50">
      <CheckCircle2 className="w-4 h-4 text-green-400 dark:text-green-600" />
      {message}
    </div>
  );
};

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <button 
      onClick={onClose}
      className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
    >
      <X className="w-6 h-6" />
    </button>
    <img src={src} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" alt="Full preview" />
  </div>
);

const TourEditForm: React.FC<TourEditFormProps> = ({ tour, onSave, onDelete, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [formData, setFormData] = useState<Tour>(tour);
  const [newTag, setNewTag] = useState('');
  const isNew = tour.id === 0;
  
  // Local states for mock "database" features
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  
  // UX States
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(false); // Default collapsed/compact
  const [showLightbox, setShowLightbox] = useState(false);

  // Initialize data
  useEffect(() => {
    setFormData(tour);
    setNewTag('');
    setActiveTab('details');
    if (tour.id === 0) setIsImageSectionOpen(true);
    
    // Load mock activities/comments
    const storedActivities = localStorage.getItem(`tour_activities_${tour.id}`);
    if (storedActivities) setActivities(JSON.parse(storedActivities));
    else setActivities([]);

    const storedComments = localStorage.getItem(`tour_comments_${tour.id}`);
    if (storedComments) setComments(JSON.parse(storedComments));
    else setComments([]);

  }, [tour]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(formData) !== JSON.stringify(tour);
    } catch {
      return true;
    }
  }, [formData, tour]);

  const canSave = (formData.name || '').trim().length > 0 && (formData.price || 0) >= 0;

  const handleSave = () => {
    if (!canSave) return;
    setIsSaving(true);

    // 1. Detect Changes & Log Activity
    const changes: ActivityLogItem[] = [];
    if (formData.price !== tour.price) changes.push({ id: Date.now() + 'p', field: 'Price', from: tour.price, to: formData.price, actor: CURRENT_USER_NAME, timestamp: Date.now() });
    if (formData.name !== tour.name) changes.push({ id: Date.now() + 'n', field: 'Name', from: tour.name, to: formData.name, actor: CURRENT_USER_NAME, timestamp: Date.now() });
    
    // Update local storage for activity
    if (changes.length > 0) {
      const updatedActivities = [...changes, ...activities];
      setActivities(updatedActivities);
      localStorage.setItem(`tour_activities_${tour.id}`, JSON.stringify(updatedActivities));
    }

    // 2. Mock API Call
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }, 600);
  };

  const handlePostComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentInput.trim()) return;
    
    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      text: commentInput,
      author: CURRENT_USER_NAME,
      timestamp: Date.now()
    };
    
    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentInput('');
    localStorage.setItem(`tour_comments_${tour.id}`, JSON.stringify(updated));
  };

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
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    const existing = new Set(formData.tags || []);
    const nextTags = [...(formData.tags || [])];
    parts.forEach(p => { if (!existing.has(p)) nextTags.push(p); });
    setFormData({ ...formData, tags: nextTags });
    setNewTag('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && newTag === '' && (formData.tags?.length || 0) > 0) {
      const nextTags = [...(formData.tags || [])];
      nextTags.pop();
      setFormData({ ...formData, tags: nextTags });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tagToRemove) });
  };

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_IMAGE;
  };

  // --- Pricing Logic ---
  const updateTier = (index: number, field: keyof PricingTier, value: any) => {
    const newTiers = [...(formData.pricingTiers || [])];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, pricingTiers: newTiers });
  };

  const addTier = () => {
    const newTiers = [...(formData.pricingTiers || []), { name: '', price: 0 }];
    setFormData({ ...formData, pricingTiers: newTiers });
  };

  const removeTier = (index: number) => {
    const newTiers = [...(formData.pricingTiers || [])].filter((_, i) => i !== index);
    setFormData({ ...formData, pricingTiers: newTiers });
  };

  // --- Render Tabs Content ---

  const renderDetails = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Tour Name */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Tour Name <span className="text-red-500">*</span>
        </label>
        <input
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-indigo-500 focus:ring-0 w-full placeholder-gray-300 leading-tight transition-colors py-1"
          placeholder="Enter tour name"
        />
      </div>

      {/* 2. Key Details Grid */}
      <div className="bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        
        {/* Pricing Tiers Section */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4" /> Pricing Options
          </label>
          
          <div className="space-y-2">
            {(formData.pricingTiers || []).map((tier, idx) => (
              <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <input 
                  value={tier.name}
                  onChange={(e) => updateTier(idx, 'name', e.target.value)}
                  placeholder="Option Name (e.g. Adult)"
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <div className="relative w-28">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input 
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTier(idx, 'price', Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={() => removeTier(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              onClick={addTier}
              className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          </div>

          {/* Legacy Base Price (Calculated or Fallback) */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
             <span>Base Price (for lists):</span>
             <span className="font-mono font-bold">
               ${(formData.pricingTiers && formData.pricingTiers.length > 0) 
                  ? Math.min(...formData.pricingTiers.map(t => t.price)) 
                  : formData.price}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. 3h"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Difficulty</label>
            <select
              value={formData.difficulty || 'Easy'}
              onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
            >
              <option>Easy</option>
              <option>Moderate</option>
              <option>Hard</option>
              <option>Expert</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Max Group Size</label>
            <input
              type="number"
              value={formData.maxPeople || 0}
              onChange={e => setFormData({ ...formData, maxPeople: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
            <div className="flex items-center gap-3 h-[38px]">
              <button
                onClick={() => setFormData({ ...formData, active: !formData.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  formData.active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`${formData.active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </button>
              <span className={`text-xs font-bold uppercase tracking-wider ${formData.active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                {formData.active ? 'Live' : 'Draft'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Meeting point or area"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cover Image (Compact & Collapsible) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
        <button 
          onClick={() => setIsImageSectionOpen(!isImageSectionOpen)}
          className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-400" /> Cover Image
          </h4>
          {isImageSectionOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        
        {isImageSectionOpen && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
            <div className="flex gap-4 items-start">
              {/* Thumbnail */}
              <div className="relative group shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <img
                  src={formData.image || FALLBACK_IMAGE}
                  onError={onImgError}
                  alt="Preview"
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                />
                <button 
                  onClick={() => setShowLightbox(true)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white"
                  title="View larger"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => document.getElementById('image-url-input')?.focus()}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Change URL
                  </button>
                  {formData.image && (
                    <button 
                      onClick={() => setFormData({...formData, image: ''})}
                      className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tags */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
          <Tag className="w-4 h-4 text-gray-400" /> Tags
        </h4>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          {(formData.tags || []).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 dark:hover:text-red-400 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => { if (newTag) addTag(); }}
            placeholder={formData.tags?.length ? "" : "Add tags..."}
            className="flex-1 min-w-[80px] bg-transparent border-none text-sm focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <p className="text-[10px] text-gray-400 px-1">Press Enter or Comma to add tags.</p>
      </div>

      {/* 5. Description */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
          <AlignLeft className="w-4 h-4 text-gray-400" /> Description
        </h4>
        <textarea
          value={formData.description || ''}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all placeholder-gray-400"
          placeholder="Describe highlights, itinerary, requirements..."
        />
      </div>

      {/* Audit Fields */}
      {!isNew && (
        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-xs text-gray-400 dark:text-gray-500">
          <div>
            <span className="block font-semibold uppercase tracking-wider mb-0.5 text-[10px]">Created</span>
            Oct 12, 2023 09:00 AM
          </div>
          <div>
            <span className="block font-semibold uppercase tracking-wider mb-0.5 text-[10px]">Last Modified</span>
            Today, 2:30 PM by {CURRENT_USER_NAME}
          </div>
        </div>
      )}
    </div>
  );

  const renderComments = () => (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No comments yet.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                {comment.author.charAt(0)}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.author}</span>
                  <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.text.split(/(@\w+)/g).map((part, i) => 
                    part.startsWith('@') ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/50 rounded px-1">{part}</span> : part
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handlePostComment} className="relative mt-auto">
        <input 
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          placeholder="Write a comment... (@ to mention)"
          className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
        />
        <button 
          type="submit"
          disabled={!commentInput.trim()}
          className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  const renderActivity = () => (
    <div className="animate-in fade-in duration-300 relative">
      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-0 pl-2">
          {activities.slice().reverse().map((log, idx) => (
            <div key={log.id} className="relative pl-6 pb-8 last:pb-0">
              {idx !== activities.length - 1 && (
                <div className="absolute left-[9px] top-3 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              )}
              <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-gray-700 flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">{log.actor}</span>
                  <span className="text-gray-500 dark:text-gray-400"> changed </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{log.field}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300 px-1.5 py-0.5 rounded line-through opacity-80">
                    {String(log.from)}
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  <span className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">
                    {String(log.to)}
                  </span>
                </div>
                
                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 relative">
      <Toast message="Saved successfully" visible={showToast} />
      {showLightbox && <Lightbox src={formData.image || FALLBACK_IMAGE} onClose={() => setShowLightbox(false)} />}

      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
        <div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {isNew ? 'Create Tour' : `Tour ID: ${tour.id}`}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate max-w-md">
            {formData.name || 'Untitled Tour'}
          </h3>
        </div>

        <button
          onClick={requestClose}
          className="p-2 -mr-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-none px-6 border-b border-gray-100 dark:border-gray-700 flex gap-6 bg-white dark:bg-gray-800 z-10">
        {[
          { id: 'details', label: 'Details', icon: Info },
          { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
          { id: 'activity', label: 'Activity', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800">
        <div className="p-6 pb-24">
          {activeTab === 'details' && renderDetails()}
          {activeTab === 'comments' && renderComments()}
          {activeTab === 'activity' && renderActivity()}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex-none p-6 border-t border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md absolute bottom-0 left-0 right-0 z-20 flex gap-3">
        <button
          onClick={handleSave}
          disabled={!isDirty || !canSave || isSaving}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : (isNew ? 'Create Tour' : 'Save Changes')}
        </button>

        {!isNew && (
          <button
            onClick={() => {
              if (window.confirm('Delete this tour?')) {
                onDelete && onDelete(tour.id);
              }
            }}
            className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors flex items-center justify-center"
            title="Delete Tour"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TourEditForm;
