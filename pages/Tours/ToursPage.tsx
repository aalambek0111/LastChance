import React, { useState } from 'react';
import { Plus, MoreHorizontal, Search, Filter } from 'lucide-react';
import { TOURS } from '../../data/mockData';
import { useI18n } from '../../context/ThemeContext';
import TourEditForm from './TourEditForm';

interface ToursPageProps {
  searchTerm?: string;
}

const ToursPage: React.FC<ToursPageProps> = ({ searchTerm = '' }) => {
  const { t } = useI18n();
  const [tours, setTours] = useState(TOURS);
  const [selectedTour, setSelectedTour] = useState<typeof TOURS[0] | null>(null);

  const filteredTours = tours.filter(tour => 
    tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateTour = (updatedTour: typeof TOURS[0]) => {
     setTours(prev => prev.map(t => t.id === updatedTour.id ? updatedTour : t));
     // Optional: keep sidebar open or close it
     // setSelectedTour(null); 
  };

  const handleDeleteTour = (tourId: number) => {
    setTours(prev => prev.filter(t => t.id !== tourId));
    if (selectedTour?.id === tourId) {
      setSelectedTour(null);
    }
  };

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main Content Area */}
      <div className="h-full flex flex-col">
         {/* Page Header */}
         <div className="flex-none px-8 py-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('page_tours_title')}</h2>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2 active:scale-95">
               <Plus className="w-4 h-4" /> Create Tour
            </button>
         </div>

         {/* Table Scroll Area */}
         <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                     <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tour Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     {filteredTours.map(tour => (
                        <tr 
                           key={tour.id}
                           onClick={() => setSelectedTour(tour)}
                           className={`group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${selectedTour?.id === tour.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                        >
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600">
                                    <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
                                 </div>
                                 <span className="font-semibold text-sm text-gray-900 dark:text-white">{tour.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {tour.duration}
                           </td>
                           <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              ${tour.price}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                 tour.active 
                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                              }`}>
                                 {tour.active ? 'Active' : 'Draft'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                 <MoreHorizontal className="w-5 h-5" />
                              </button>
                           </td>
                        </tr>
                     ))}
                     {filteredTours.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No tours found matching "{searchTerm}".
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* Edit Pane - Absolute Overlay */}
      {selectedTour && (
         <div className="absolute top-0 right-0 h-full w-[500px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-30 transform transition-transform duration-300 ease-in-out">
            <TourEditForm 
               tour={selectedTour} 
               onSave={handleUpdateTour} 
               onDelete={handleDeleteTour}
               onClose={() => setSelectedTour(null)}
            />
         </div>
      )}
    </div>
  );
};

export default ToursPage;