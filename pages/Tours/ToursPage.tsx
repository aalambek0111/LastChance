import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, MoreHorizontal, Search, Pencil, Trash2 } from 'lucide-react';
import { TOURS } from '../../data/mockData';
import { useI18n } from '../../context/ThemeContext';
import TourEditForm from './TourEditForm';

interface ToursPageProps {
  searchTerm?: string;
}

type Tour = typeof TOURS[number];

// Default template for a new tour
const EMPTY_TOUR = {
  id: 0,
  name: '',
  price: 0,
  duration: '',
  active: false,
  description: '',
  image:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600',
  tags: [],
  maxPeople: 12,
  difficulty: 'Easy',
  location: '',
  bookingsCount: 0,
  revenue: 0,
} as Tour;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&q=80&w=600';

const ToursPage: React.FC<ToursPageProps> = ({ searchTerm = '' }) => {
  const { t } = useI18n();

  const [tours, setTours] = useState<Tour[]>(TOURS as Tour[]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  // Drawer animation state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  // Local search (syncs with prop if parent provides it)
  const [localSearch, setLocalSearch] = useState(searchTerm);
  useEffect(() => setLocalSearch(searchTerm), [searchTerm]);

  // Row actions menu
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickedInsideMenu = target?.closest?.('[data-tour-menu="true"]');
      if (!clickedInsideMenu) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const effectiveSearch = localSearch.trim().toLowerCase();

  const filteredTours = useMemo(() => {
    if (!effectiveSearch) return tours;
    return tours.filter(tour => {
      const name = (tour.name || '').toLowerCase();
      const location = (tour.location || '').toLowerCase();
      return name.includes(effectiveSearch) || location.includes(effectiveSearch);
    });
  }, [tours, effectiveSearch]);

  const openDrawer = (tour: Tour) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSelectedTour(tour);
    // allow next paint then open for smooth transition
    requestAnimationFrame(() => setDrawerOpen(true));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setSelectedTour(null);
      closeTimerRef.current = null;
    }, 220);
  };

  useEffect(() => {
    if (!selectedTour) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKeyDown);

    // Prevent background scroll when drawer is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTour]);

  const handleSaveTour = (savedTour: Tour) => {
    if (savedTour.id === 0) {
      const newTour = {
        ...savedTour,
        id: Date.now(),
      };
      setTours(prev => [newTour, ...prev]);
    } else {
      setTours(prev => prev.map(t => (t.id === savedTour.id ? savedTour : t)));
    }
    closeDrawer();
  };

  const handleDeleteTour = (tourId: number) => {
    setTours(prev => prev.filter(t => t.id !== tourId));
    setMenuOpenId(null);

    if (selectedTour?.id === tourId) {
      closeDrawer();
    }
  };

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_IMAGE;
  };

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Page */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-none px-6 lg:px-8 py-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('page_tours_title')}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:w-[340px]">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search tours or locations..."
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => openDrawer(EMPTY_TOUR)}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Tour
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tour Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTours.map(tour => (
                  <tr
                    key={tour.id}
                    onClick={() => openDrawer(tour)}
                    className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600">
                          <img
                            src={tour.image}
                            onError={onImgError}
                            alt={tour.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {tour.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {tour.location || 'No location set'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {tour.duration || '-'}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      ${tour.price}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          tour.active
                            ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {tour.active ? 'Active' : 'Draft'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block" data-tour-menu="true">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setMenuOpenId(prev => (prev === tour.id ? null : tour.id));
                          }}
                          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Tour actions"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {menuOpenId === tour.id && (
                          <div
                            onClick={e => e.stopPropagation()}
                            className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden z-20"
                          >
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                openDrawer(tour);
                              }}
                              className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteTour(tour.id)}
                              className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTours.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      No tours found matching "{localSearch}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer + Backdrop */}
      {selectedTour && (
        <div className="absolute inset-0 z-30">
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className={`absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${
              drawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Drawer */}
          <div
            className={`absolute top-0 right-0 h-full w-full sm:max-w-[540px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-200 ease-out ${
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
          >
            <TourEditForm
              tour={selectedTour}
              onSave={handleSaveTour}
              onDelete={handleDeleteTour}
              onClose={closeDrawer}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ToursPage;
