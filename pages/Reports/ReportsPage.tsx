import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  Calendar,
  BarChart3,
  TrendingUp,
  LayoutDashboard,
  FileText,
  Filter as FilterIcon,
  Plus,
  Play,
  Download,
  ChevronDown,
  Search,
  X,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronRight,
  RefreshCw,
  Table as TableIcon,
  Columns,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { RECENT_LEADS, UPCOMING_BOOKINGS, TOURS } from '../../data/mockData';
import { Booking } from '../../types';

// -------------------- Types --------------------
type ReportType = 'leads' | 'bookings' | 'tours';
type FieldType = 'text' | 'select' | 'number' | 'date';
type FilterOperator = 'equals' | 'contains' | 'ne' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty';
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

const STORAGE_KEY = 'tourcrm_saved_reports_v3';

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

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'ne', label: 'Not equal' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
];

// -------------------- Helpers --------------------
function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
function parseNumber(val: any) { const n = Number(val); return Number.isFinite(n) ? n : 0; }
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

const SidebarSection = ({ title, isOpen, onToggle, children, badge }: SidebarSectionProps) => (
  <div className="border-b border-gray-100 dark:border-gray-700">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 group-hover:text-indigo-600 transition-colors">
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black ring-1 ring-indigo-100 dark:ring-indigo-800">
          {badge}
        </span>
      )}
    </button>
    {isOpen && <div className="px-4 pb-6 pt-1 animate-in slide-in-from-top-1 duration-200">{children}</div>}
  </div>
);

interface ReportsPageProps { bookings: Booking[]; }

const ReportsPage: React.FC<ReportsPageProps> = ({ bookings }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'builder'>('overview');
  const [reportName, setReportName] = useState('New Custom Report');
  const [selectedType, setSelectedType] = useState<ReportType>('leads');
  const [selectedFields, setSelectedFields] = useState<string[]>(getDefaultSelectedFields('leads'));
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>('AND');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [sidebarOpenSections, setSidebarOpenSections] = useState<Record<string, boolean>>({ columns: true, filters: true });
  const [fieldSearch, setFieldSearch] = useState('');
  
  // Interaction State
  const [isPreview, setIsPreview] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(loadSavedReports());

  const config = REPORT_CONFIG[selectedType];
  const activeFields = selectedFields.map(key => config.fields.find(f => f.key === key)).filter(Boolean) as FieldConfig[];
  const availableFields = config.fields.filter(f => !selectedFields.includes(f.key) && f.label.toLowerCase().includes(fieldSearch.toLowerCase()));

  // Reset when object type changes
  useEffect(() => {
    if (activeTab === 'builder') {
      setSelectedFields(getDefaultSelectedFields(selectedType));
      setFilters([]);
      setSortBy('');
      setIsPreview(true);
      setFieldSearch('');
    }
  }, [selectedType, activeTab]);

  useEffect(() => { persistSavedReports(savedReports); }, [savedReports]);

  // Filtering Engine
  const processedData = useMemo(() => {
    let result = [...(selectedType === 'bookings' ? bookings : config.data)];
    
    if (filters.length > 0) {
      result = result.filter(item => {
        const matches = filters.map(f => {
          const val = String(item[f.field] ?? '').toLowerCase();
          const target = f.value.toLowerCase();
          
          switch(f.operator) {
            case 'equals': return val === target;
            case 'contains': return val.includes(target);
            case 'ne': return val !== target;
            case 'isEmpty': return !val || val === 'null' || val === '';
            case 'isNotEmpty': return !!val && val !== 'null' && val !== '';
            case 'gt': return parseNumber(item[f.field]) > parseNumber(f.value);
            case 'lt': return parseNumber(item[f.field]) < parseNumber(f.value);
            default: return true;
          }
        });
        return filterLogic === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
      });
    }

    if (sortBy) {
      result.sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        const comp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [config.data, bookings, filters, filterLogic, sortBy, sortDir, selectedType]);

  const displayedData = isPreview ? processedData.slice(0, 10) : processedData;

  // Handlers
  const toggleSection = (key: string) => setSidebarOpenSections(prev => ({...prev, [key]: !prev[key]}));
  
  const addFilter = () => {
    setFilters([...filters, { id: uid(), field: config.fields[0].key, operator: 'equals', value: '' }]);
    if (!sidebarOpenSections.filters) setSidebarOpenSections(prev => ({...prev, filters: true}));
  };

  const removeFilter = (id: string) => setFilters(filters.filter(f => f.id !== id));
  const updateFilter = (id: string, key: keyof FilterCriteria, val: any) => setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
  
  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  // Fix: Added missing clearFilters function to reset report builder filters and search
  const clearFilters = () => {
    setFilters([]);
    setSortBy('');
    setFieldSearch('');
  };

  // Fix: Added missing hasActiveFilters calculation
  const hasActiveFilters = filters.length > 0 || sortBy !== '' || fieldSearch !== '';

  const handleRunReport = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsPreview(false);
      setIsRefreshing(false);
    }, 800);
  };

  const handleSave = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const newReport: SavedReport = { 
        id: uid('rep'), 
        name: reportName, 
        type: selectedType, 
        selectedFields, 
        filters, 
        filterLogic, 
        groupBy: '',
        sortBy, 
        sortDir, 
        savedAt: Date.now() 
      };
      setSavedReports([newReport, ...savedReports]);
      setIsRefreshing(false);
      alert('Report saved to your dashboard library.');
    }, 600);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = activeFields.map(f => f.label).join(',');
      const rows = processedData.map(row => 
        activeFields.map(f => `"${String(row[f.key] ?? '').replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${reportName.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 z-10 shadow-sm">
        <div className="flex gap-8 max-w-[1600px] mx-auto">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2.5 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('builder')} 
            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2.5 ${activeTab === 'builder' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-4 h-4" /> Custom Builder
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' ? (
          <OverviewTab onNavigateToBuilder={(type) => { setSelectedType(type); setActiveTab('builder'); }} />
        ) : (
          <div className="flex h-full animate-in fade-in duration-300">
            {/* BUILDER SIDEBAR */}
            <aside className="w-80 flex-none bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden shadow-xl z-10">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2.5 px-1">Source Database</label>
                <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value as ReportType)} 
                  className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="leads">Leads & Prospects</option>
                  <option value="bookings">Bookings & Revenue</option>
                  <option value="tours">Tour Catalog & Performance</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* COLUMNS SECTION */}
                <SidebarSection title="Visible Columns" isOpen={sidebarOpenSections.columns} onToggle={() => toggleSection('columns')} badge={selectedFields.length}>
                  <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          value={fieldSearch} 
                          onChange={e => setFieldSearch(e.target.value)} 
                          placeholder="Search fields..." 
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/10" 
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                      {activeFields.map(f => (
                        <div key={f.key} className="flex items-center justify-between p-2.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 group animate-in slide-in-from-left-2 duration-200">
                           <div className="flex items-center gap-2">
                             <div className="w-1 h-3 bg-indigo-400 rounded-full" />
                             <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{f.label}</span>
                           </div>
                           <button onClick={() => setSelectedFields(selectedFields.filter(sf => sf !== f.key))} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-indigo-300 hover:text-red-500 transition-all">
                              <X className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      ))}
                      
                      {availableFields.length > 0 && (
                        <div className="pt-4 pb-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Available Fields</label>
                        </div>
                      )}
                      
                      {availableFields.map(f => (
                        <button key={f.key} onClick={() => setSelectedFields([...selectedFields, f.key])} className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl text-xs text-gray-600 dark:text-gray-400 transition-all group">
                          {f.label} <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </SidebarSection>

                {/* FILTERS SECTION */}
                <SidebarSection title="Data Filters" isOpen={sidebarOpenSections.filters} onToggle={() => toggleSection('filters')} badge={filters.length}>
                   <div className="space-y-4">
                      {filters.map((f) => (
                        <div key={f.id} className="p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 relative group animate-in zoom-in-95 duration-150">
                           <button 
                             onClick={() => removeFilter(f.id)} 
                             className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-red-500 hover:text-red-600 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                           >
                             <X className="w-3.5 h-3.5"/>
                           </button>
                           
                           <div className="space-y-2">
                              <select 
                                value={f.field} 
                                onChange={e => updateFilter(f.id, 'field', e.target.value)} 
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] font-bold p-1.5 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/10"
                              >
                                 {config.fields.map(fd => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                              </select>

                              <select 
                                value={f.operator} 
                                onChange={e => updateFilter(f.id, 'operator', e.target.value as FilterOperator)} 
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] p-1.5 font-medium outline-none shadow-sm"
                              >
                                 {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                              </select>

                              {!['isEmpty', 'isNotEmpty'].includes(f.operator) && (
                                 <input 
                                   value={f.value} 
                                   onChange={e => updateFilter(f.id, 'value', e.target.value)}
                                   placeholder="Filter value..."
                                   className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
                                 />
                              )}
                           </div>
                        </div>
                      ))}

                      {filters.length > 1 && (
                         <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700">
                            <button onClick={() => setFilterLogic('AND')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${filterLogic === 'AND' ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>AND</button>
                            <button onClick={() => setFilterLogic('OR')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${filterLogic === 'OR' ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>OR</button>
                         </div>
                      )}

                      <button 
                        onClick={addFilter} 
                        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-800 transition-all flex items-center justify-center gap-2 active:scale-95 group"
                      >
                         <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add Filter Row
                      </button>
                   </div>
                </SidebarSection>
              </div>
            </aside>

            {/* MAIN PREVIEW TABLE */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900 relative">
              
              {/* Table Toolbar */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 lg:px-8 flex flex-col sm:flex-row justify-between items-center z-10 gap-4 shadow-sm">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <input 
                    value={reportName} 
                    onChange={e => setReportName(e.target.value)} 
                    className="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-white flex-1" 
                    placeholder="Untitled Report Name" 
                  />
                </div>
                
                <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <button 
                    onClick={handleSave} 
                    disabled={isRefreshing}
                    className="whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-650 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    {isRefreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Config
                  </button>
                  
                  <button 
                    onClick={handleExportCSV} 
                    disabled={isExporting || processedData.length === 0}
                    className="whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-650 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export CSV
                  </button>
                  
                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 flex-none" />

                  {/* Fix: Usage of hasActiveFilters and clearFilters here */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="whitespace-nowrap px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                    >
                      Clear Filters
                    </button>
                  )}

                  <button 
                    onClick={handleRunReport} 
                    disabled={isRefreshing}
                    className="whitespace-nowrap px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isRefreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isPreview ? 'Run Full Report' : 'Refresh Data'}
                  </button>
                </div>
              </div>

              {/* Data Table Container */}
              <div className="flex-1 overflow-auto p-6 lg:p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto space-y-6">
                  
                  {/* Results Count Header */}
                  <div className="flex justify-between items-center px-2">
                    <p className="text-sm text-gray-500 font-medium">
                      Found <span className="text-gray-900 dark:text-white font-black">{processedData.length.toLocaleString()}</span> matching records
                    </p>
                    {isPreview && processedData.length > 10 && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full ring-1 ring-amber-200 dark:ring-amber-800">
                        <AlertCircle className="w-3.5 h-3.5" /> Showing Preview (First 10)
                      </div>
                    )}
                  </div>

                  {/* The Actual Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden ring-1 ring-black/5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-700 sticky top-0 backdrop-blur-md z-20">
                          <tr>
                            {activeFields.map(f => (
                              <th 
                                key={f.key} 
                                onClick={() => handleSort(f.key)}
                                className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none group"
                              >
                                 <div className="flex items-center gap-2">
                                   {f.label}
                                   <div className={`transition-opacity duration-200 ${sortBy === f.key ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                                      {sortBy === f.key && sortDir === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-500"/> : <ArrowUp className="w-3 h-3 text-indigo-500"/>}
                                   </div>
                                 </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                          {displayedData.length === 0 ? (
                            <tr>
                              <td colSpan={activeFields.length} className="px-6 py-32 text-center">
                                 <div className="flex flex-col items-center max-w-sm mx-auto animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                                       <Search className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No matching records</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters in the sidebar to expand your search results.</p>
                                    <button onClick={clearFilters} className="mt-6 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">Clear All Filters</button>
                                 </div>
                              </td>
                            </tr>
                          ) : (
                            displayedData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-all duration-200 group">
                                {activeFields.map(f => (
                                  <td key={f.key} className="px-6 py-4.5 text-sm text-gray-700 dark:text-gray-300 font-medium border-b border-transparent group-hover:border-indigo-100 dark:group-hover:border-indigo-900/30">
                                    {f.type === 'number' && typeof row[f.key] === 'number' 
                                      ? (f.key === 'price' || f.key === 'revenue' || f.key === 'value' ? `$${row[f.key].toLocaleString()}` : row[f.key])
                                      : String(row[f.key] ?? '-')}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Bottom Indicator */}
                    {!isPreview && processedData.length > 0 && (
                      <div className="p-5 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 text-center">
                         <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">End of report results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ onNavigateToBuilder: (type: ReportType) => void }> = ({ onNavigateToBuilder }) => {
  const stats = [
    { label: 'Total Revenue', value: '$24,500', change: '+12%', up: true, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Bookings', value: '142', change: '+5%', up: true, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Avg. Order', value: '$172', change: '-2%', up: false, icon: BarChart3, color: 'bg-amber-500' },
    { label: 'Conv. Rate', value: '3.2%', change: '+0.4%', up: true, icon: TrendingUp, color: 'bg-indigo-500' },
  ];

  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto space-y-10 animate-in fade-in duration-500 scrollbar-hide">
      <div className="max-w-[1600px] mx-auto w-full space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">System Performance</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Visual intelligence overview of your tour agency metrics.</p>
          </div>
          <button onClick={() => alert('Preparing export summary package...')} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all active:scale-95 text-gray-700 dark:text-gray-200">
            <FileDown className="w-4 h-4"/> Download Summary
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-7 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none hover:-translate-y-1 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3.5 rounded-2xl ${s.color} text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ring-1 ${s.up ? 'bg-green-50 text-green-700 ring-green-100' : 'bg-red-50 text-red-700 ring-red-100'}`}>{s.change}</span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{s.value}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none h-96 flex flex-col justify-center items-center overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
            <BarChart3 className="w-20 h-20 text-gray-100 dark:text-gray-700 mb-6" />
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Revenue Analytics Visualization</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none flex flex-col">
            <h3 className="font-black text-gray-900 dark:text-white text-lg mb-8 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Most Popular Tours
            </h3>
            <div className="flex-1 space-y-8">
              {['Sunset Bike Adventure', 'Old Town History Walk', 'Wine & Dine Tasting'].map((t, i) => (
                <div key={i} className="group cursor-default">
                  <div className="flex justify-between text-[11px] font-black mb-2.5 uppercase tracking-widest">
                    <span className="text-gray-400 group-hover:text-indigo-600 transition-colors truncate pr-4">{t}</span>
                    <span className="text-gray-900 dark:text-white">{85 - i * 15}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]" style={{ width: `${85 - i * 15}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => onNavigateToBuilder('tours')} 
              className="w-full mt-12 py-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              Open Tours Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;