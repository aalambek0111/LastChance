
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
  SlidersHorizontal,
  FileSpreadsheet,
  Save,
  FolderOpen,
  Trash2,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Check,
  ChevronRight,
  RefreshCw,
  GripVertical,
  Table as TableIcon,
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
      { key: 'value', label: 'Deal Value', type: 'number' }, // Mock field
    ],
  },
  bookings: {
    label: 'Bookings',
    data: UPCOMING_BOOKINGS as any[],
    fields: [
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
      { key: 'name', label: 'Tour Name', type: 'text' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'bookingsCount', label: 'Bookings', type: 'number' },
      { key: 'revenue', label: 'Revenue', type: 'number' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Moderate', 'Hard'] },
      { key: 'active', label: 'Active', type: 'select', options: ['true', 'false'] },
    ],
  },
};

// -------------------- Helpers --------------------
function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
function safeLower(v: any) { return String(v ?? '').toLowerCase(); }
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

// 1. Sidebar Section Header
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
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        {title}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </button>
    {isOpen && <div className="p-4 pt-0 animate-in slide-in-from-top-1">{children}</div>}
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
  const [isPreview, setIsPreview] = useState(true); // True = limit 10 rows, False = full
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

  // Live Preview Effect (Debounced)
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => {
      setIsRefreshing(false);
    }, 400); // Fake network delay
    return () => clearTimeout(timer);
  }, [selectedType, selectedFields, filters, groupBy, sortBy, sortDir, reportName]);

  // --- Logic Functions ---

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

  // Apply Preview Limit
  const displayedData = isPreview ? processData.slice(0, 10) : processData;

  // Grouping
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

  // Summary Metrics
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
    alert('Report saved successfully!');
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
  };

  const handleNavigateToBuilder = (type: ReportType) => {
    setSelectedType(type);
    setActiveTab('builder');
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
          <OverviewTab onNavigateToBuilder={handleNavigateToBuilder} />
        ) : (
          <div className="flex h-full">
            {/* --- LEFT SIDEBAR (BUILDER) --- */}
            <aside className="w-80 flex-none bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full z-10 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Data Source</h3>
                <div className="relative">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as ReportType)}
                    className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="leads">Leads</option>
                    <option value="bookings">Bookings</option>
                    <option value="tours">Tours</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  <div className="space-y-3">
                    {/* Selected (Draggable Area Mock) */}
                    {activeFields.length > 0 && (
                      <div className="space-y-1 mb-3">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Selected</div>
                        {activeFields.map((f, idx) => (
                          <div key={f.key} className="flex items-center justify-between group bg-gray-50 dark:bg-gray-700/30 p-1.5 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-3 h-3 text-gray-400 cursor-grab" />
                              <span className="text-sm text-gray-700 dark:text-gray-200">{f.label}</span>
                            </div>
                            <button 
                              onClick={() => setSelectedFields(selectedFields.filter(k => k !== f.key))}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Available */}
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Available Fields</div>
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                        <input 
                          value={fieldSearch}
                          onChange={(e) => setFieldSearch(e.target.value)}
                          placeholder="Find a field..."
                          className="w-full pl-7 pr-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {availableFields.map(f => (
                          <button
                            key={f.key}
                            onClick={() => setSelectedFields([...selectedFields, f.key])}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between group"
                          >
                            <span>{f.label}</span>
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500" />
                          </button>
                        ))}
                        {availableFields.length === 0 && <div className="text-xs text-gray-400 p-2 text-center">No fields match</div>}
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
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-2">
                        {(['AND', 'OR'] as const).map(l => (
                          <button
                            key={l}
                            onClick={() => setFilterLogic(l)}
                            className={`flex-1 text-xs font-bold py-1 rounded-md transition-all ${filterLogic === l ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500'}`}
                          >
                            {l === 'AND' ? 'Match ALL' : 'Match ANY'}
                          </button>
                        ))}
                      </div>
                    )}

                    {filters.map((filter, i) => (
                      <div key={filter.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                        <button 
                          onClick={() => removeFilter(filter.id)}
                          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        
                        <div className="space-y-2">
                          <select 
                            value={filter.field} 
                            onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs py-1.5 px-2 font-medium"
                          >
                            {config.fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <select 
                              value={filter.operator}
                              onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as FilterOperator)}
                              className="w-1/3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs py-1.5 px-2"
                            >
                              <option value="equals">is</option>
                              <option value="contains">contains</option>
                              <option value="gt">&gt;</option>
                              <option value="lt">&lt;</option>
                              <option value="isEmpty">empty</option>
                            </select>
                            <input 
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                              placeholder="Value..."
                              className="w-2/3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs py-1.5 px-2 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button 
                      onClick={addFilter}
                      className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1"
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
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Group By</label>
                      <div className="relative">
                        <select 
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm appearance-none"
                        >
                          <option value="">None</option>
                          {config.fields.filter(f => f.type !== 'number').map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sort By</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm appearance-none"
                          >
                            <option value="">None</option>
                            {config.fields.map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button 
                          onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
                        >
                          {sortDir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </SidebarSection>
              </div>
              
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <button 
                  onClick={() => { setSelectedFields(getDefaultSelectedFields(selectedType)); setFilters([]); }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline w-full text-center"
                >
                  Reset to defaults
                </button>
              </div>
            </aside>

            {/* --- RIGHT MAIN AREA --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
              {/* Toolbar */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
                <div className="flex-1 min-w-0 group">
                  <input 
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full truncate placeholder-gray-400"
                    placeholder="Untitled Report"
                  />
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    {savedReports.some(r => r.name === reportName) ? <span className="flex items-center gap-1 text-green-600"><Check className="w-3 h-3" /> Saved</span> : 'Unsaved changes'}
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="flex items-center gap-1">{isRefreshing ? <RefreshCw className="w-3 h-3 animate-spin" /> : null} {isPreview ? 'Live Preview' : 'Full Data'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <button 
                      onClick={() => setLoadMenuOpen(!loadMenuOpen)}
                      className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" /> <span className="hidden xl:inline">Load</span>
                    </button>
                    {loadMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Reports</div>
                        <div className="max-h-60 overflow-y-auto">
                          {savedReports.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No saved reports</div>
                          ) : (
                            savedReports.map(r => (
                              <button 
                                key={r.id}
                                onClick={() => loadReport(r)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                              >
                                {r.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setSaveMenuOpen(!saveMenuOpen)}
                      className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> <span className="hidden xl:inline">Save</span>
                    </button>
                    {saveMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                        <button onClick={saveReport} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Save New</button>
                        <button disabled className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm opacity-50 cursor-not-allowed">Update Existing</button>
                      </div>
                    )}
                  </div>

                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

                  <button 
                    onClick={exportCSV}
                    disabled={processData.length === 0}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    title="Export CSV"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => setIsPreview(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2 ${
                      !isPreview 
                        ? 'bg-gray-100 text-gray-400 cursor-default' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Play className="w-4 h-4" /> Run Full
                  </button>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-3 flex items-center gap-6 overflow-x-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Records</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{summaryMetrics.totalCount}</span>
                </div>
                {summaryMetrics.sums.map(s => (
                  <div key={s.label} className="flex flex-col pl-6 border-l border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sum {s.label}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatChipValue(s.value)}</span>
                  </div>
                ))}
              </div>

              {/* Table Area */}
              <div className="flex-1 overflow-auto p-6 lg:p-8">
                {activeFields.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Columns className="w-12 h-12 mb-3 opacity-20" />
                    <p>No columns selected. Use the sidebar to add fields.</p>
                  </div>
                ) : displayedData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Search className="w-12 h-12 mb-3 opacity-20" />
                    <p>No results found matching your filters.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Render Grouped or Flat Table */}
                    {groupBy ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {groupedData?.map(([groupName, rows]) => (
                          <div key={groupName}>
                            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/30 font-semibold text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex justify-between">
                              <span>{groupName}</span>
                              <span className="text-xs text-gray-500 font-normal">{rows.length} records</span>
                            </div>
                            <table className="w-full text-left">
                              <thead className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                  {activeFields.map(f => (
                                    <th key={f.key} className="px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{f.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={idx} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    {activeFields.map(f => (
                                      <td key={f.key} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        {row[f.key]}
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
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 backdrop-blur-sm z-10">
                          <tr>
                            {activeFields.map(f => (
                              <th key={f.key} className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setSortBy(f.key)}>
                                <div className="flex items-center gap-1">
                                  {f.label}
                                  {sortBy === f.key && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {displayedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
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
                
                {/* Footer Preview Message */}
                {isPreview && processData.length > 10 && (
                  <div className="mt-4 text-center">
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      Previewing top 10 of {processData.length} records. Click "Run Full" to see all.
                    </span>
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

type TimeRange = '7days' | '30days' | 'year';

interface OverviewTabProps {
  onNavigateToBuilder: (type: ReportType) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateToBuilder }) => {
  const { t } = useI18n();
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');

  // Define dynamic data sets for different time ranges
  const DASHBOARD_DATA = {
    '7days': {
      stats: [
        { label: 'Total Revenue', value: '$4,250', change: '+8%', up: true, icon: DollarSign },
        { label: 'Bookings', value: '28', change: '+12%', up: true, icon: Calendar },
        { label: 'Avg. Order Value', value: '$152', change: '-4%', up: false, icon: BarChart3 },
        { label: 'Conversion Rate', value: '4.1%', change: '+1.2%', up: true, icon: TrendingUp },
      ],
      chartData: [30, 45, 25, 60, 75, 90, 55],
      chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      topTours: [
        { name: 'Sunset City Bike Tour', val: 75, color: 'bg-blue-500' },
        { name: 'Historical Walk', val: 50, color: 'bg-emerald-500' },
        { name: 'Food & Wine Tasting', val: 35, color: 'bg-amber-500' },
        { name: 'Mountain Hike', val: 20, color: 'bg-purple-500' },
      ]
    },
    '30days': {
      stats: [
        { label: 'Total Revenue', value: '$24,500', change: '+12%', up: true, icon: DollarSign },
        { label: 'Bookings', value: '142', change: '+5%', up: true, icon: Calendar },
        { label: 'Avg. Order Value', value: '$172', change: '-2%', up: false, icon: BarChart3 },
        { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', up: true, icon: TrendingUp },
      ],
      chartData: [40, 65, 45, 80, 55, 70, 40, 60],
      chartLabels: ['W1', 'W1.5', 'W2', 'W2.5', 'W3', 'W3.5', 'W4', 'W4.5'], // Simplification for 8 bars
      topTours: [
        { name: 'Sunset City Bike Tour', val: 85, color: 'bg-blue-500' },
        { name: 'Historical Walk', val: 62, color: 'bg-emerald-500' },
        { name: 'Food & Wine Tasting', val: 45, color: 'bg-amber-500' },
        { name: 'Mountain Hike', val: 30, color: 'bg-purple-500' },
      ]
    },
    'year': {
      stats: [
        { label: 'Total Revenue', value: '$245,000', change: '+24%', up: true, icon: DollarSign },
        { label: 'Bookings', value: '1,420', change: '+18%', up: true, icon: Calendar },
        { label: 'Avg. Order Value', value: '$178', change: '+2%', up: true, icon: BarChart3 },
        { label: 'Conversion Rate', value: '3.5%', change: '+0.1%', up: true, icon: TrendingUp },
      ],
      chartData: [40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 65, 85],
      chartLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      topTours: [
        { name: 'Historical Walk', val: 92, color: 'bg-emerald-500' },
        { name: 'Sunset City Bike Tour', val: 88, color: 'bg-blue-500' },
        { name: 'Food & Wine Tasting', val: 65, color: 'bg-amber-500' },
        { name: 'Private Boat Charter', val: 40, color: 'bg-indigo-500' },
      ]
    }
  };

  const currentData = DASHBOARD_DATA[timeRange];

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto" id="printable-dashboard-container">
      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            visibility: hidden;
          }
          #printable-dashboard-container {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
            background: white;
            overflow: visible;
          }
          #printable-dashboard-container * {
            visibility: visible;
          }
          /* Hide interactive controls */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_reports_title')}</h2>
        <div className="flex gap-2 no-print">
          <select 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            title="Print or Save as PDF"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentData.stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400">
                <stat.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.up
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
            <div className="flex gap-4 text-sm no-print">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="text-gray-500">Current Period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                <span className="text-gray-500">Previous Period</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {currentData.chartData.map((h, i) => (
              <div key={i} className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-t-sm relative group">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 dark:bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600 print:bg-indigo-600"
                  style={{ height: `${h}%` }}
                ></div>
                {/* Tooltip mock - hide on print */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 no-print">
                  ${h * (timeRange === 'year' ? 1000 : 100)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
            {currentData.chartLabels.map((label, idx) => (
               <span key={idx}>{label}</span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Top Performing Tours</h3>
          <div className="space-y-6">
            {currentData.topTours.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{item.val}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color} print:bg-gray-800`} style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigateToBuilder('tours')}
            className="w-full mt-8 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/30 no-print"
          >
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
