
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, MoreHorizontal, Search, Pencil, Trash2, Filter, Activity, MapPin, ArrowUp, ArrowDown, Copy, Archive } from 'lucide-react';
import { TOURS } from '../../data/mockData';
import { Tour } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import TourEditForm from './TourEditForm';

interface ToursPageProps {
  searchTerm?: string;
}

type SortKey = keyof Tour | 'status';
type SortDir = 'asc' | 'desc';

// Default template for a new tour
const EMPTY_TOUR: Tour = {
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
  pricingTiers: [
    { name: 'Adult', price: 0 }
  ]
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&q=80&w=600';

const ToursPage: React.FC<ToursPageProps> = ({ searchTerm = '' }) => {
  const { t } = useI18n();

  const [tours, setTours] = useState<Tour[]>(TOURS);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Draft'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Drawer animation state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  // Sync with global search if provided
  useEffect(() => {
    if (searchTerm) setLocalSearch(searchTerm);
  }, [searchTerm]);

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

  const filteredTours = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    
    let result = tours.filter(tour => {
      // Search Text
      const matchesSearch = 
        (tour.name || '').toLowerCase().includes(q) || 
        (tour.location || '').toLowerCase().includes(q) ||
        (tour.tourNo || '').toLowerCase().includes(q);

      // Status Filter
      const matchesStatus = 
        statusFilter === 'All' ? true :
        statusFilter === 'Live' ? tour.active :
        !tour.active; // Draft

      // Difficulty Filter
      const matchesDifficulty = 
        difficultyFilter === 'All' || tour.difficulty === difficultyFilter;

      return matchesSearch && matchesStatus && matchesDifficulty;
    });

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Tour];
      let valB: any = b[sortKey as keyof Tour];

      // Handle Status specially since it's boolean in data but we might want to sort by that
      if (sortKey === 'status') {
        valA = a.active ? 1 : 0;
        valB = b.active ? 1 : 0;
      } else if (sortKey === 'price' || sortKey === 'bookingsCount') {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tours, localSearch, statusFilter, difficultyFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const hasActiveFilters = statusFilter !== 'All' || difficultyFilter !== 'All' || localSearch !== '';

  const clearFilters = () => {
    setStatusFilter('All');
    setDifficultyFilter('All');
    setLocalSearch('');
  };

  const openDrawer = (tour: Tour) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSelectedTour(tour);
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedTour]);

  const handleSaveTour = (savedTour: Tour) => {
    if (savedTour.id === 0) {
      const newTour = {
        ...savedTour,
        id: Date.now(),
        // Ensure starting price is accurate if tiers exist
        price: savedTour.pricingTiers && savedTour.pricingTiers.length > 0 
          ? Math.min(...savedTour.pricingTiers.map(t => t.price)) 
          : savedTour.price
      };
      setTours(prev => [newTour, ...prev]);
    } else {
      // Recalculate base price from tiers if changed
      const updatedTour = {
        ...savedTour,
        price: savedTour.pricingTiers && savedTour.pricingTiers.length > 0 
          ? Math.min(...savedTour.pricingTiers.map(t => t.price)) 
          : savedTour.price
      };
      setTours(prev => prev.map(t => (t.id === updatedTour.id ? updatedTour : t)));
    }
    closeDrawer();
  };

  const handleDeleteTour = (tourId: number) => {
    if(window.confirm("Are you sure you want to delete this tour?")) {
      setTours(prev => prev.filter(t => t.id !== tourId));
      setMenuOpenId(null);
      if (selectedTour?.id === tourId) {
        closeDrawer();
      }
    }
  };

  const handleDuplicateTour = (tour: Tour) => {
    const newTour = {
      ...tour,
      id: Date.now(),
      name: `${tour.name} (Copy)`,
      active: false, // Default to draft for copy
      bookingsCount: 0,
      revenue: 0
    };
    setTours(prev => [newTour, ...prev]);
    setMenuOpenId(null);
  };

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_IMAGE;
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <div className="w-3 h-3" />; // spacer
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
      
      {/* Header Area - Tightened padding */}
      <div className="flex-none px-6 py-4 lg:px-8 pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('page_tours_title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Manage your tour catalog, pricing, and availability.
            </p>
          </div>
          <button
            onClick={() => openDrawer(EMPTY_TOUR)}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Create Tour
          </button>
        </div>

        {/* Filter Bar - Slimmer padding */}
        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:flex-nowrap">
            
            {/* Left: Filter Label + Status Toggle */}
            <div className="flex items-center gap-2.5 flex-none">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 px-1">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Filter:</span>
              </div>

              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                {(['All', 'Live', 'Draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                      statusFilter === status
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle: Difficulty Dropdown + Search - Slimmer inputs */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
              <div className="w-full sm:w-40 lg:flex-none">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none"
                >
                  <option value="All">All Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder="Search tours..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Right: Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex-none text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold transition-colors px-2 whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table - Tightened cell padding */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th 
                  className="px-6 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Tour Name <SortIcon colKey="name" /></div>
                </th>
                <th 
                  className="px-6 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center gap-1">Duration <SortIcon colKey="duration" /></div>
                </th>
                <th 
                  className="px-6 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">Price <SortIcon colKey="price" /></div>
                </th>
                <th 
                  className="px-6 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">Status <SortIcon colKey="status" /></div>
                </th>
                <th className="px-6 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
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
                  <td className="px-6 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {tour.tourNo || '-'}
                  </td>
                  
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600 relative">
                        <img
                          src={tour.image}
                          onError={onImgError}
                          alt={tour.name}
                          className="w-full h-full object-cover"
                        />
                        {!tour.active && (
                          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                             <Activity className="w-3.5 h-3.5 text-white opacity-70" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {tour.name}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {tour.location || 'No location set'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {tour.duration || '-'}
                  </td>

                  <td className="px-6 py-3.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {tour.pricingTiers && tour.pricingTiers.length > 0 
                        ? `From $${Math.min(...tour.pricingTiers.map(t => t.price))}`
                        : `$${tour.price}`
                      }
                    </span>
                  </td>

                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        tour.active
                          ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {tour.active ? 'Live' : 'Draft'}
                    </span>
                  </td>

                  <td className="px-6 py-3.5 text-right">
                    <div className="relative inline-block" data-tour-menu="true">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setMenuOpenId(prev => (prev === tour.id ? null : tour.id));
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Tour actions"
                      >
                        <MoreHorizontal className="w-4.5 h-4.5" />
                      </button>

                      {menuOpenId === tour.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 mt-1 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-20"
                        >
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              openDrawer(tour);
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Details
                          </button>

                          <button
                            onClick={() => {
                              handleDuplicateTour(tour);
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>

                          <button
                            onClick={() => {
                              handleSaveTour({ ...tour, active: !tour.active });
                              setMenuOpenId(null);
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            {tour.active ? 'Archive (Draft)' : 'Publish (Live)'}
                          </button>

                          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

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
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm"
                  >
                    No tours found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            className={`absolute top-0 right-0 h-full w-full lg:w-[720px] max-w-[90vw] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-200 ease-out ${
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
