import React, { useState, useEffect } from 'react';
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
   List,
   Layout
} from 'lucide-react';
import { TOURS } from '../../data/mockData';

interface TourEditFormProps {
  tour: typeof TOURS[0];
  onSave: (t: typeof TOURS[0]) => void;
  onDelete?: (id: number) => void;
  onClose?: () => void;
}

const TourEditForm: React.FC<TourEditFormProps> = ({ tour, onSave, onDelete, onClose }) => {
   const [formData, setFormData] = useState(tour);
   const [newTag, setNewTag] = useState('');
   const isNew = tour.id === 0;

   useEffect(() => {
      setFormData(tour);
   }, [tour]);

   const addTag = () => {
      if (newTag && !formData.tags?.includes(newTag)) {
         setFormData({ ...formData, tags: [...(formData.tags || []), newTag] });
         setNewTag('');
      }
   };

   const removeTag = (tagToRemove: string) => {
      setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tagToRemove) });
   };

   return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 relative">
         {/* Fixed Header */}
         <div className="flex-none px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
               {isNew ? 'Create New Tour' : 'Edit Tour Details'}
            </h3>
            <button 
               onClick={onClose}
               className="p-2 -mr-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
            >
               <X className="w-5 h-5" />
            </button>
         </div>

         {/* Scrollable Content Area */}
         <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800">
            <div className="p-6 space-y-8">
               {/* Tour Name & Status Toggle */}
               <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tour Name</label>
                        <input 
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                           className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full placeholder-gray-300 leading-tight"
                           placeholder="Enter tour name"
                        />
                     </div>
                     <div className="flex flex-col items-end pt-1">
                        <button 
                           onClick={() => setFormData({...formData, active: !formData.active})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${formData.active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
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

               {/* Stats Cards - Only show for existing tours */}
               {!isNew && (
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                           <Activity className="w-3.5 h-3.5" /> Lifetime Bookings
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formData.bookingsCount}</div>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                           <DollarSign className="w-3.5 h-3.5" /> Total Revenue
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">${formData.revenue?.toLocaleString()}</div>
                     </div>
                  </div>
               )}

               {/* Tour Details Inputs */}
               <div className="space-y-5">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
                     <Layout className="w-4 h-4 text-gray-400" /> Tour Details
                  </h4>
                  <div className="grid grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price ($)</label>
                        <input 
                           type="number"
                           value={formData.price}
                           onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                           className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</label>
                        <input 
                           type="text"
                           value={formData.duration}
                           onChange={e => setFormData({...formData, duration: e.target.value})}
                           className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                           placeholder="e.g. 3h"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Difficulty</label>
                        <select 
                           value={formData.difficulty || 'Easy'}
                           onChange={e => setFormData({...formData, difficulty: e.target.value})}
                           className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
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
                           value={formData.maxPeople || 0}
                           onChange={e => setFormData({...formData, maxPeople: Number(e.target.value)})}
                           className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                           value={formData.location || ''}
                           onChange={e => setFormData({...formData, location: e.target.value})}
                           className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                     {formData.tags?.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                           {tag}
                           <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-200 ml-1"><X className="w-3 h-3" /></button>
                        </span>
                     ))}
                     <div className="flex items-center gap-2">
                        <input 
                           value={newTag}
                           onChange={e => setNewTag(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && addTag()}
                           placeholder="Add tag..."
                           className="w-24 px-2 py-1 text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500 outline-none transition-colors placeholder-gray-400"
                        />
                        <button onClick={addTag} disabled={!newTag} className="text-indigo-600 disabled:opacity-50 hover:text-indigo-800"><Plus className="w-4 h-4" /></button>
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
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        rows={6}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all placeholder-gray-400"
                        placeholder="Describe the tour experience, highlights, and requirements..."
                     />
                     <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                        {formData.description?.length || 0} chars
                     </div>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Fixed Footer */}
         <div className="flex-none p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex gap-3">
            <button 
               onClick={() => onSave(formData)} 
               className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               {isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
               {isNew ? 'Create Tour' : 'Save Changes'}
            </button>
            {!isNew && (
               <button 
                  onClick={() => onDelete && onDelete(tour.id)}
                  className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors flex items-center justify-center"
               >
                  <Trash2 className="w-5 h-5" />
               </button>
            )}
         </div>
      </div>
   );
};

export default TourEditForm;