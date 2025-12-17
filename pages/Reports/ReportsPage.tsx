import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  Calendar,
  BarChart3,
  TrendingUp,
  LayoutDashboard,
  FileText,
  Filter,
  Plus,
  Play,
  Download,
  ChevronDown,
  Search,
  X,
  Save,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronRight,
  RefreshCw,
  GripVertical,
  Columns
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { RECENT_LEADS, UPCOMING_BOOKINGS, TOURS } from '../../data/mockData';

// -------------------- Types --------------------
type ReportType = 'leads' | 'bookings' | 'tours';
type FieldType = 'text' | 'select' | 'number' | 'date';
type FilterOperator = 'equals' | 'contains' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'before' | 'after' | 'isEmpty' | 'isNotEmpty';
type FilterLogic = 'AND' | 'OR';
type SortDir = 'asc' | 'desc';
// Added missing TimeRange type
type TimeRange = '7days' | '30days' | 'year';

interface FilterCriteria {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

interface ReportConfig {
  label: string;
  data: any[];
  fields: FieldConfig[];
}

interface SavedReport {
  id: string;
  name: string;
  type: ReportType;
  selectedFields: string[];
  filters: FilterCriteria[];
  filterLogic: FilterLogic;
  groupBy: string;
  sortBy: string;
  sortDir: SortDir;
  savedAt: number;
}

const STORAGE_KEY = 'tourcrm_saved_reports_v2';

// -------------------- Config --------------------
const REPORT_CONFIG: Record<ReportType, ReportConfig> = {
  leads: {
    label: 'Leads',
    data: RECENT_LEADS as any[],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'] },
      { key: 'channel', label: 'Channel', type: 'select', options: ['Website', 'WhatsApp', 'Email', 'Referral'] },
      { key: 'lastMessageTime', label: 'Last Active', type: 'text' },
      { key: 'assignedTo', label: 'Assigned To', type: 'text' },
      { key: 'value', label: 'Deal Value', type: 'number' },
    ],
  },
  bookings: {
    label: 'Bookings',
    data: UPCOMING_BOOKINGS as any[],
    fields: [
      { key: 'bookingNo', label: 'Ref No', type: 'text' },
      { key: 'tourName', label: 'Tour Name', type: 'text' },
      { key: 'clientName', label: 'Client', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Pending', 'Cancelled', 'Completed'] },
      { key: 'people', label: 'Pax', type: 'number' },
      { key: 'paymentStatus', label: 'Payment', type: 'select', options: ['Paid', 'Unpaid', 'Partially Paid'] },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
    ],
  },
  tours: {
    label: 'Tours',
    data: TOURS as any[],
    fields: [
      { key: 'tourNo', label: 'Ref No', type: 'text' },
      { key: 'name', label: 'Tour Name', type: 'text' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'bookingsCount', label: 'Bookings', type: 'number' },
      { key: 'revenue', label: 'Revenue', type: 'number' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Moderate', 'Hard'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'active', label: 'Active', type: 'select', options: ['true', 'false'] },
    ],
  },
};

// -------------------- Helpers --------------------
function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
function parseNumber(val: string) { const n = Number(val); return Number.isFinite(n) ? n : NaN; }
function parseDate(val: string) { const d = new Date(val); return Number.isFinite(d.getTime()) ? d.getTime() : NaN; }
function formatChipValue(v: number) {
  if (!Number.isFinite(v)) return '0';
  if (Math.abs(v) >= 1000000) return `${Math.round(v / 100000) / 10}M`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v * 100) / 100);
}
function loadSavedReports(): SavedReport[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function persistSavedReports(reports: SavedReport[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); } catch { }
}
function getDefaultSelectedFields(type: ReportType) {
  const fields = REPORT_CONFIG[type].fields.map((f) => f.key);
  return fields.slice(0, Math.min(5, fields.length));
}

// -------------------- Components --------------------

interface SidebarSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  badge?: number;
}

const SidebarSection = ({ 
  title, 
  isOpen, 
  onToggle, 
  children,
  badge 
}: SidebarSectionProps) => (
  <div className="border-b border-gray-100 dark:border-gray-700">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {title}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">
          {badge}
        </span>
      )}
    </button>
    {isOpen && <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1">{children}</div>}
  </div>
);

// -------------------- Main Page --------------------
const ReportsPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'builder'>('overview');

  // --- Builder State ---
  const [reportName, setReportName] = useState('New Custom Report');
  const [selectedType, setSelectedType] = useState<ReportType>('leads');
  const [selectedFields, setSelectedFields] = useState<string[]>(getDefaultSelectedFields('leads'));
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>('AND');
  const [groupBy, setGroupBy] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // --- UI State ---
  const [sidebarOpenSections, setSidebarOpenSections] = useState<Record<string, boolean>>({ setup: true, columns: true, filters: true });
  const [fieldSearch, setFieldSearch] = useState('');
  const [isPreview, setIsPreview] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(loadSavedReports());
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);

  // --- Computed Data ---
  const config = REPORT_CONFIG[selectedType];
  const activeFields = selectedFields.map(key => config.fields.find(f => f.key === key)).filter(Boolean) as FieldConfig[];
  const availableFields = config.fields.filter(f => !selectedFields.includes(f.key) && f.label.toLowerCase().includes(fieldSearch.toLowerCase()));

  // Reset when Type Changes
  useEffect(() => {
    if (activeTab === 'builder') {
      setSelectedFields(getDefaultSelectedFields(selectedType));
      setFilters([]);
      setGroupBy('');
      setSortBy('');
      setIsPreview(true);
    }
  }, [selectedType]);

  // Persist Saved Reports
  useEffect(() => {
    persistSavedReports(savedReports);
  }, [savedReports]);

  // Live Preview Effect
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedType, selectedFields, filters, groupBy, sortBy, sortDir, reportName]);

  // --- Processing Logic ---
  const processData = useMemo(() => {
    let result = [...config.data];

    // 1. Filters
    if (filters.length > 0) {
      result = result.filter(item => {
        const matches = filters.map(f => {
          const val = String(item[f.field] ?? '').toLowerCase();
          const target = f.value.toLowerCase();
          switch(f.operator) {
            case 'equals': return val === target;
            case 'contains': return val.includes(target);
            case 'ne': return val !== target;
            case 'isEmpty': return !val;
            case 'isNotEmpty': return !!val;
            case 'gt': return parseNumber(val) > parseNumber(target);
            case 'lt': return parseNumber(val) < parseNumber(target);
            default: return true;
          }
        });
        return filterLogic === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
      });
    }

    // 2. Sort
    if (sortBy) {
      result.sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        const fieldType = config.fields.find(f => f.key === sortBy)?.type;
        
        let comp = 0;
        if (fieldType === 'number') comp = parseNumber(av) - parseNumber(bv);
        else if (fieldType === 'date') comp = parseDate(av) - parseDate(bv);
        else comp = String(av).localeCompare(String(bv));
        
        return sortDir === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [config.data, filters, filterLogic, sortBy, sortDir, selectedType]);

  const displayedData = isPreview ? processData.slice(0, 10) : processData;

  const groupedData = useMemo(() => {
    if (!groupBy) return null;
    const groups: Record<string, any[]> = {};
    displayedData.forEach(item => {
      const key = String(item[groupBy] || 'Uncategorized');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  }, [displayedData, groupBy]);

  const summaryMetrics = useMemo(() => {
    const totalCount = processData.length;
    const sums = activeFields
      .filter(f => f.type === 'number')
      .map(f => ({
        label: f.label,
        value: processData.reduce((acc, curr) => acc + (Number(curr[f.key]) || 0), 0)
      }));
    return { totalCount, sums };
  }, [processData, activeFields]);

  // Actions
  const toggleSection = (key: string) => {
    setSidebarOpenSections(prev => ({...prev, [key]: !prev[key]}));
  };

  const addFilter = () => {
    setFilters([...filters, { id: uid(), field: config.fields[0].key, operator: 'equals', value: '' }]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, key: keyof FilterCriteria, val: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const saveReport = () => {
    const newReport: SavedReport = {
      id: uid('rep'),
      name: reportName,
      type: selectedType,
      selectedFields,
      filters,
      filterLogic,
      groupBy,
      sortBy,
      sortDir,
      savedAt: Date.now()
    };
    setSavedReports([newReport, ...savedReports]);
    setSaveMenuOpen(false);
  };

  const loadReport = (report: SavedReport) => {
    setSelectedType(report.type);
    setReportName(report.name);
    setSelectedFields(report.selectedFields);
    setFilters(report.filters);
    setFilterLogic(report.filterLogic);
    setGroupBy(report.groupBy);
    setSortBy(report.sortBy);
    setSortDir(report.sortDir);
    setLoadMenuOpen(false);
  };

  const exportCSV = () => {
    const headers = activeFields.map(f => f.label).join(',');
    const rows = processData.map(row => activeFields.map(f => `"${row[f.key] || ''}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'builder'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Custom Report Builder
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'overview' ? (
          <OverviewTab onNavigateToBuilder={(type) => { setSelectedType(type); setActiveTab('builder'); }} />
        ) : (
          <div className="flex h-full">
            {/* --- LEFT SIDEBAR (BUILDER) --- */}
            <aside className="w-80 flex-none bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full z-10 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Data Source</h3>
                <div className="relative">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as ReportType)}
                    className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="leads">Leads</option>
                    <option value="bookings">Bookings</option>
                    <option value="tours">Tours</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* 1. Columns Picker */}
                <SidebarSection 
                  title="Columns" 
                  isOpen={sidebarOpenSections.columns} 
                  onToggle={() => toggleSection('columns')}
                  badge={selectedFields.length}
                >
                  <div className="space-y-4">
                    {/* Selected List */}
                    {activeFields.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-between">
                          <span>Selected</span>
                          <button onClick={() => setSelectedFields([])} className="hover:text-indigo-600 transition-colors">Clear All</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {activeFields.map((f) => (
                            <div key={f.key} className="flex items-center justify-between group bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-3 h-3 text-gray-300 cursor-grab" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{f.label}</span>
                              </div>
                              <button 
                                onClick={() => setSelectedFields(selectedFields.filter(k => k !== f.key))}
                                className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Fields Area (Screenshot Reference) */}
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Available Fields</div>
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                          value={fieldSearch}
                          onChange={(e) => setFieldSearch(e.target.value)}
                          placeholder="Find a field..."
                          className="w-full pl-8 pr-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      
                      {/* Fixed height and improved scroll for Available Fields list */}
                      <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-900/20 p-1 custom-scrollbar">
                        {availableFields.map(f => (
                          <button
                            key={f.key}
                            onClick={() => setSelectedFields([...selectedFields, f.key])}
                            className="w-full text-left px-2 py-2 hover:bg-white dark:hover:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between group transition-all"
                          >
                            <span>{f.label}</span>
                            <Plus className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                        {availableFields.length === 0 && (
                          <div className="text-[10px] text-gray-400 p-4 text-center italic">No fields match your search</div>
                        )}
                      </div>
                    </div>
                  </div>
                </SidebarSection>

                {/* 2. Filters Builder */}
                <SidebarSection 
                  title="Filters" 
                  isOpen={sidebarOpenSections.filters} 
                  onToggle={() => toggleSection('filters')}
                  badge={filters.length}
                >
                  <div className="space-y-3">
                    {filters.length > 0 && (
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        {(['AND', 'OR'] as const).map(l => (
                          <button
                            key={l}
                            onClick={() => setFilterLogic(l)}
                            className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${filterLogic === l ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500'}`}
                          >
                            {l === 'AND' ? 'MATCH ALL' : 'MATCH ANY'}
                          </button>
                        ))}
                      </div>
                    )}

                    {filters.map((filter) => (
                      <div key={filter.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                        <button 
                          onClick={() => removeFilter(filter.id)}
                          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        
                        <div className="space-y-2 mt-1">
                          <select 
                            value={filter.field} 
                            onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[11px] py-1 px-2 font-bold"
                          >
                            {config.fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                          <div className="flex gap-1.5">
                            <select 
                              value={filter.operator}
                              onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as FilterOperator)}
                              className="w-[45%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] py-1 px-2"
                            >
                              <option value="equals">is</option>
                              <option value="contains">contains</option>
                              <option value="gt">&gt;</option>
                              <option value="lt">&lt;</option>
                            </select>
                            <input 
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                              placeholder="Value..."
                              className="w-[55%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] py-1 px-2 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button 
                      onClick={addFilter}
                      className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-[10px] font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1 uppercase"
                    >
                      <Plus className="w-3 h-3" /> Add Filter
                    </button>
                  </div>
                </SidebarSection>

                {/* 3. Group & Sort */}
                <SidebarSection 
                  title="Group & Sort" 
                  isOpen={sidebarOpenSections.setup} 
                  onToggle={() => toggleSection('setup')}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Group By</label>
                      <div className="relative">
                        <select 
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-3 text-xs font-medium appearance-none"
                        >
                          <option value="">None</option>
                          {config.fields.filter(f => f.type !== 'number').map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sort By</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-3 text-xs font-medium appearance-none"
                          >
                            <option value="">None</option>
                            {config.fields.map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                        <button 
                          onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-indigo-600"
                        >
                          {sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </SidebarSection>
              </div>
              
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <button 
                  onClick={() => { setSelectedFields(getDefaultSelectedFields(selectedType)); setFilters([]); setGroupBy(''); setSortBy(''); }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase hover:underline w-full text-center"
                >
                  Reset to defaults
                </button>
              </div>
            </aside>

            {/* --- RIGHT MAIN AREA --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
                <div className="flex-1 min-w-0">
                  <input 
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full truncate placeholder-gray-400"
                    placeholder="Untitled Report"
                  />
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2 mt-1">
                    <span className={savedReports.some(r => r.name === reportName) ? 'text-emerald-500' : 'text-gray-400'}>{savedReports.some(r => r.name === reportName) ? 'Saved' : 'Unsaved changes'}</span>
                    <span className="text-gray-200 dark:text-gray-700">|</span>
                    <span className="flex items-center gap-1">{isRefreshing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : null} {isPreview ? 'Live Preview' : 'Full Data'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setLoadMenuOpen(!loadMenuOpen)} className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" /> Load
                  </button>
                  <button onClick={saveReport} className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  <button onClick={exportCSV} className="p-2 text-gray-400 hover:text-indigo-600 transition" title="Export CSV"><Download className="w-4 h-4" /></button>
                  <button onClick={() => setIsPreview(false)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2 uppercase tracking-wider">
                    <Play className="w-3.5 h-3.5 fill-current" /> Run Full
                  </button>
                </div>
              </div>

              {/* Metrics Bar */}
              <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-8 py-3 flex items-center gap-8 overflow-x-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Records</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{summaryMetrics.totalCount}</span>
                </div>
                {summaryMetrics.sums.map(s => (
                  <div key={s.label} className="flex flex-col pl-8 border-l border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sum {s.label}</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{formatChipValue(s.value)}</span>
                  </div>
                ))}
              </div>

              {/* Grid View */}
              <div className="flex-1 overflow-auto p-6 lg:p-8">
                {activeFields.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-30">
                    <Columns className="w-16 h-16 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">No columns selected</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {groupBy ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {groupedData?.map(([groupName, rows]) => (
                          <div key={groupName}>
                            <div className="px-6 py-2 bg-gray-50/50 dark:bg-gray-900/30 font-bold text-xs text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex justify-between uppercase tracking-wider">
                              <span>{groupName}</span>
                              <span className="text-[10px] text-gray-400 lowercase font-medium">{rows.length} records</span>
                            </div>
                            <table className="w-full text-left">
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={idx} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    {activeFields.map(f => (
                                      <td key={f.key} className="px-6 py-2.5 text-xs text-gray-700 dark:text-gray-300">
                                        {String(row[f.key] ?? '-')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                            {activeFields.map(f => (
                              <th key={f.key} className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {f.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {displayedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-colors">
                              {activeFields.map(f => (
                                <td key={f.key} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {String(row[f.key] ?? '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                {isPreview && processData.length > 10 && (
                  <div className="mt-4 text-center">
                    <button onClick={() => setIsPreview(false)} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest">
                      Showing 10 of {processData.length} records. Load all.
                    </button>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------- Overview Tab --------------------

const OverviewTab: React.FC<{ onNavigateToBuilder: (type: ReportType) => void }> = ({ onNavigateToBuilder }) => {
  const [range, setRange] = useState<TimeRange>('30days');

  const stats = useMemo(() => {
    return [
      { label: 'Total Revenue', value: '$24,500', change: '+12%', up: true, icon: DollarSign },
      { label: 'Bookings', value: '142', change: '+5%', up: true, icon: Calendar },
      { label: 'Avg. Order', value: '$172', change: '-2%', up: false, icon: BarChart3 },
      { label: 'Conv. Rate', value: '3.2%', change: '+0.4%', up: true, icon: TrendingUp },
    ];
  }, [range]);

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Overview</h2>
          <p className="text-sm text-gray-500">Key metrics for your agency operations.</p>
        </div>
        <select 
          value={range} 
          onChange={e => setRange(e.target.value as any)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400">
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.up ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                {s.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{s.value}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[350px]">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Revenue Growth</h3>
          <div className="h-48 flex items-end justify-between gap-3 px-2">
            {[40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 65, 85].map((h, i) => (
              <div key={i} className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-t relative group transition-all hover:bg-gray-200">
                <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t" style={{ height: `${h}%` }}></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-bold uppercase">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Popular Tours</h3>
          <div className="flex-1 space-y-6">
            {[
              { name: 'Sunset Bike', val: 85, color: 'bg-indigo-500' },
              { name: 'Old Town Walk', val: 62, color: 'bg-emerald-500' },
              { name: 'Wine Tasting', val: 45, color: 'bg-amber-500' },
            ].map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wide">
                  <span className="text-gray-500">{t.name}</span>
                  <span className="text-gray-900 dark:text-white">{t.val}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigateToBuilder('tours')}
            className="w-full mt-8 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 transition-colors rounded-xl text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-widest border border-gray-200 dark:border-gray-600"
          >
            Create Tour Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;