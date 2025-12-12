import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { RECENT_LEADS, UPCOMING_BOOKINGS, TOURS } from '../../data/mockData';

// -------------------- Types --------------------
type ReportType = 'leads' | 'bookings' | 'tours';

type FieldType = 'text' | 'select' | 'number' | 'date';

type FilterOperator =
  | 'equals'
  | 'contains'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'before'
  | 'after'
  | 'isEmpty'
  | 'isNotEmpty';

interface FilterCriteria {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

type FilterLogic = 'AND' | 'OR';
type SortDir = 'asc' | 'desc';

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
  groupBy: string; // '' means none
  sortBy: string; // '' means none
  sortDir: SortDir;
  savedAt: number;
}

const STORAGE_KEY = 'tourcrm_saved_reports_v1';

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
    ],
  },
};

// -------------------- Helpers --------------------
function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function safeLower(v: any) {
  return String(v ?? '').toLowerCase();
}

function isNumericField(fieldType?: FieldType) {
  return fieldType === 'number';
}

function isDateField(fieldType?: FieldType) {
  return fieldType === 'date';
}

function parseNumber(val: string) {
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
}

function parseDate(val: string) {
  // expects YYYY-MM-DD or any Date-parsable string
  const d = new Date(val);
  return Number.isFinite(d.getTime()) ? d.getTime() : NaN;
}

function getFieldConfig(type: ReportType, key: string) {
  return REPORT_CONFIG[type].fields.find((f) => f.key === key);
}

function formatChipValue(v: number) {
  // Keep it simple, looks good in UI
  if (!Number.isFinite(v)) return '0';
  if (Math.abs(v) >= 1000000) return `${Math.round(v / 100000) / 10}M`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v * 100) / 100);
}

function loadSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedReport[];
  } catch {
    return [];
  }
}

function saveSavedReports(reports: SavedReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

function getDefaultSelectedFields(type: ReportType) {
  const fields = REPORT_CONFIG[type].fields.map((f) => f.key);
  return fields.slice(0, Math.min(4, fields.length));
}

// -------------------- Main --------------------
const ReportsPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'builder'>('overview');

  // Builder state
  const [reportName, setReportName] = useState('New Custom Report');
  const [selectedType, setSelectedType] = useState<ReportType>('leads');
  const [selectedFields, setSelectedFields] = useState<string[]>(getDefaultSelectedFields('leads'));
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>('AND');

  const [groupBy, setGroupBy] = useState<string>(''); // none
  const [sortBy, setSortBy] = useState<string>(''); // none
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [hasRun, setHasRun] = useState(false);
  const [reportResult, setReportResult] = useState<any[]>([]);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);

  // Saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => loadSavedReports());
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  // UI helpers
  const [fieldSearch, setFieldSearch] = useState('');
  const [showOutline, setShowOutline] = useState(true);

  React.useEffect(() => {
    // Reset builder when object changes (keeps things predictable)
    setSelectedFields(getDefaultSelectedFields(selectedType));
    setFilters([]);
    setFilterLogic('AND');
    setGroupBy('');
    setSortBy('');
    setSortDir('asc');
    setReportResult([]);
    setHasRun(false);
    setLastRunAt(null);
    setSelectedSavedId('');
  }, [selectedType]);

  const config = REPORT_CONFIG[selectedType];

  const visibleFieldConfigs = useMemo(() => {
    const q = fieldSearch.trim().toLowerCase();
    if (!q) return config.fields;
    return config.fields.filter((f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
  }, [config.fields, fieldSearch]);

  const selectedFieldConfigs = useMemo(() => {
    const map = new Map(config.fields.map((f) => [f.key, f]));
    return selectedFields.map((k) => map.get(k)).filter(Boolean) as FieldConfig[];
  }, [config.fields, selectedFields]);

  const filterCountLabel = filters.length;

  function toggleField(key: string) {
    setSelectedFields((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  }

  function moveField(key: string, dir: 'up' | 'down') {
    setSelectedFields((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapWith = dir === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[swapWith];
      next[swapWith] = tmp;
      return next;
    });
  }

  function selectAllFields() {
    setSelectedFields(config.fields.map((f) => f.key));
  }

  function clearFields() {
    setSelectedFields([]);
  }

  function addFilter() {
    const firstField = config.fields[0]?.key ?? 'name';
    const newFilter: FilterCriteria = {
      id: uid('filter'),
      field: firstField,
      operator: 'equals',
      value: '',
    };
    setFilters((prev) => [...prev, newFilter]);
  }

  function removeFilter(id: string) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFilter(id: string, key: keyof FilterCriteria, val: string) {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  }

  function getOperatorOptions(fieldType?: FieldType) {
    if (isDateField(fieldType)) {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
      ] as const;
    }
    if (isNumericField(fieldType)) {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'ne', label: 'Not Equal To' },
        { value: 'gt', label: 'Greater Than' },
        { value: 'gte', label: 'Greater Than Or Equal' },
        { value: 'lt', label: 'Less Than' },
        { value: 'lte', label: 'Less Than Or Equal' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
      ] as const;
    }
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'ne', label: 'Not Equal To' },
      { value: 'isEmpty', label: 'Is Empty' },
      { value: 'isNotEmpty', label: 'Is Not Empty' },
    ] as const;
  }

  function matchFilter(item: any, filter: FilterCriteria): boolean {
    const fieldCfg = getFieldConfig(selectedType, filter.field);
    const fieldType = fieldCfg?.type;

    const rawItemVal = item?.[filter.field];
    const operator = filter.operator;

    if (operator === 'isEmpty') return rawItemVal === null || rawItemVal === undefined || String(rawItemVal).trim() === '';
    if (operator === 'isNotEmpty') return !(rawItemVal === null || rawItemVal === undefined || String(rawItemVal).trim() === '');

    if (isNumericField(fieldType)) {
      const itemNum = parseNumber(String(rawItemVal ?? ''));
      const filterNum = parseNumber(filter.value);
      if (!Number.isFinite(itemNum)) return false;
      if (!Number.isFinite(filterNum)) return true; // allow empty/invalid filter value to not block
      if (operator === 'equals') return itemNum === filterNum;
      if (operator === 'ne') return itemNum !== filterNum;
      if (operator === 'gt') return itemNum > filterNum;
      if (operator === 'gte') return itemNum >= filterNum;
      if (operator === 'lt') return itemNum < filterNum;
      if (operator === 'lte') return itemNum <= filterNum;
      return true;
    }

    if (isDateField(fieldType)) {
      const itemTs = parseDate(String(rawItemVal ?? ''));
      const filterTs = parseDate(filter.value);
      if (!Number.isFinite(itemTs)) return false;
      if (!Number.isFinite(filterTs)) return true;
      if (operator === 'equals') return itemTs === filterTs;
      if (operator === 'before') return itemTs < filterTs;
      if (operator === 'after') return itemTs > filterTs;
      return true;
    }

    const itemStr = safeLower(rawItemVal);
    const filterStr = safeLower(filter.value);

    if (operator === 'equals') return itemStr === filterStr;
    if (operator === 'contains') return itemStr.includes(filterStr);
    if (operator === 'ne') return itemStr !== filterStr;
    return true;
  }

  function applyFilters(source: any[]) {
    if (filters.length === 0) return source;

    return source.filter((item) => {
      const matches = filters.map((f) => matchFilter(item, f));
      return filterLogic === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
    });
  }

  function applySort(rows: any[]) {
    if (!sortBy) return rows;

    const fieldCfg = getFieldConfig(selectedType, sortBy);
    const fieldType = fieldCfg?.type;

    const sorted = [...rows].sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];

      if (isNumericField(fieldType)) {
        const an = parseNumber(String(av ?? ''));
        const bn = parseNumber(String(bv ?? ''));
        if (!Number.isFinite(an) && !Number.isFinite(bn)) return 0;
        if (!Number.isFinite(an)) return 1;
        if (!Number.isFinite(bn)) return -1;
        return an - bn;
      }

      if (isDateField(fieldType)) {
        const at = parseDate(String(av ?? ''));
        const bt = parseDate(String(bv ?? ''));
        if (!Number.isFinite(at) && !Number.isFinite(bt)) return 0;
        if (!Number.isFinite(at)) return 1;
        if (!Number.isFinite(bt)) return -1;
        return at - bt;
      }

      const as = safeLower(av);
      const bs = safeLower(bv);
      if (as < bs) return -1;
      if (as > bs) return 1;
      return 0;
    });

    return sortDir === 'asc' ? sorted : sorted.reverse();
  }

  function runReport() {
    const source = config.data ?? [];
    const filtered = applyFilters(source);
    const sorted = applySort(filtered);

    setReportResult(sorted);
    setHasRun(true);
    setLastRunAt(Date.now());
  }

  function exportCsv() {
    if (!hasRun || reportResult.length === 0) return;
    if (selectedFields.length === 0) return;

    const fields = selectedFieldConfigs;
    const headers = fields.map((f) => f.label).join(',');
    const rows = reportResult
      .map((row) =>
        fields
          .map((f) => {
            const val = row?.[f.key];
            return `"${String(val ?? '').replace(/"/g, '""')}"`
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Grouping (simple UI): returns either flat rows or grouped structure
  const grouped = useMemo(() => {
    if (!groupBy) return null;

    const map = new Map<string, any[]>();
    for (const row of reportResult) {
      const key = String(row?.[groupBy] ?? 'Blank');
      map.set(key, [...(map.get(key) ?? []), row]);
    }

    // Sort group keys for stable view
    const keys = Array.from(map.keys()).sort((a, b) => safeLower(a).localeCompare(safeLower(b)));
    return keys.map((k) => ({ key: k, rows: map.get(k) ?? [] }));
  }, [groupBy, reportResult]);

  const summary = useMemo(() => {
    if (!hasRun) return { count: 0, sums: [] as { key: string; label: string; value: number }[] };

    const numericFields = selectedFieldConfigs.filter((f) => f.type === 'number');
    const sums = numericFields.map((f) => {
      const total = reportResult.reduce((acc, row) => {
        const n = parseNumber(String(row?.[f.key] ?? ''));
        return Number.isFinite(n) ? acc + n : acc;
      }, 0);
      return { key: f.key, label: f.label, value: total };
    });

    return { count: reportResult.length, sums };
  }, [hasRun, reportResult, selectedFieldConfigs]);

  function saveCurrentReport() {
    const trimmed = reportName.trim();
    const name = trimmed.length ? trimmed : 'Untitled Report';

    const newReport: SavedReport = {
      id: uid('report'),
      name,
      type: selectedType,
      selectedFields,
      filters,
      filterLogic,
      groupBy,
      sortBy,
      sortDir,
      savedAt: Date.now(),
    };

    const next = [newReport, ...savedReports].slice(0, 50);
    setSavedReports(next);
    setSelectedSavedId(newReport.id);
    saveSavedReports(next);
  }

  function loadReportById(id: string) {
    const r = savedReports.find((x) => x.id === id);
    if (!r) return;

    setReportName(r.name);
    setSelectedType(r.type);
    // The effect on selectedType resets, so apply after tick
    setTimeout(() => {
      setSelectedFields(r.selectedFields ?? getDefaultSelectedFields(r.type));
      setFilters(r.filters ?? []);
      setFilterLogic(r.filterLogic ?? 'AND');
      setGroupBy(r.groupBy ?? '');
      setSortBy(r.sortBy ?? '');
      setSortDir(r.sortDir ?? 'asc');
      setReportResult([]);
      setHasRun(false);
      setLastRunAt(null);
      setSelectedSavedId(r.id);
    }, 0);
  }

  function deleteSavedReport(id: string) {
    const next = savedReports.filter((r) => r.id !== id);
    setSavedReports(next);
    saveSavedReports(next);
    if (selectedSavedId === id) setSelectedSavedId('');
  }

  const fieldsForGrouping = config.fields.filter((f) => f.type === 'text' || f.type === 'select' || f.type === 'date');

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Tabs */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 lg:px-8">
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
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' ? (
          <OverviewTab />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-6 lg:py-8">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Report Name
                      </label>
                      <input
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        placeholder="New Custom Report"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Build Salesforce-style reports: choose columns, filters, grouping, sorting, then run and export.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowOutline((v) => !v)}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                        title="Toggle Builder Panels"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Builder
                      </button>
                    </div>
                  </div>

                  {/* Saved reports row */}
                  <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Saved Reports
                      </label>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <select
                            value={selectedSavedId}
                            onChange={(e) => {
                              const id = e.target.value;
                              setSelectedSavedId(id);
                              if (id) loadReportById(id);
                            }}
                            className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                          >
                            <option value="">Select a saved report...</option>
                            {savedReports.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} - {REPORT_CONFIG[r.type].label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        <button
                          onClick={saveCurrentReport}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                          title="Save current report (localStorage)"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>

                        <button
                          onClick={() => selectedSavedId && deleteSavedReport(selectedSavedId)}
                          disabled={!selectedSavedId}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete selected saved report"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>

                        <button
                          onClick={() => selectedSavedId && loadReportById(selectedSavedId)}
                          disabled={!selectedSavedId}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reload saved report"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Load
                        </button>
                      </div>
                    </div>

                    {/* Run / Export */}
                    <div className="flex gap-3 md:pt-7">
                      <button
                        onClick={exportCsv}
                        disabled={!hasRun || reportResult.length === 0 || selectedFields.length === 0}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>

                      <button
                        onClick={runReport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                      >
                        <Play className="w-4 h-4" />
                        Run Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Builder panels */}
                {showOutline && (
                  <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    {/* Report Object */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Report Object
                      </label>

                      <div className="relative">
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value as ReportType)}
                          className="w-full appearance-none bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                        >
                          <option value="leads">Leads</option>
                          <option value="bookings">Bookings</option>
                          <option value="tours">Tours</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Group By
                          </label>
                          <div className="relative">
                            <select
                              value={groupBy}
                              onChange={(e) => setGroupBy(e.target.value)}
                              className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg py-2 px-3 pr-9 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            >
                              <option value="">None</option>
                              {fieldsForGrouping.map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Sort
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg py-2 px-3 pr-9 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                              >
                                <option value="">None</option>
                                {config.fields.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            <button
                              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200 text-sm font-medium"
                              title="Toggle sort direction"
                              disabled={!sortBy}
                            >
                              {sortDir === 'asc' ? 'ASC' : 'DESC'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Columns / Outline */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Columns</h3>
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {selectedFields.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={selectAllFields}
                            className="text-xs font-medium text-gray-500 hover:text-indigo-600 px-2 py-1 transition-colors"
                          >
                            Select all
                          </button>
                          <button
                            onClick={clearFields}
                            className="text-xs font-medium text-gray-500 hover:text-red-500 px-2 py-1 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                          <input
                            value={fieldSearch}
                            onChange={(e) => setFieldSearch(e.target.value)}
                            placeholder="Search fields..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {visibleFieldConfigs.map((f) => {
                            const checked = selectedFields.includes(f.key);
                            return (
                              <label
                                key={f.key}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleField(f.key)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.label}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{f.type.toUpperCase()}</div>
                                  </div>
                                </div>
                                <div className="text-xs font-semibold text-gray-400">{f.key}</div>
                              </label>
                            );
                          })}
                        </div>

                        {/* Selected order */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Column order
                            </div>
                            <div className="text-xs text-gray-400">Use arrows to reorder</div>
                          </div>

                          {selectedFields.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4">
                              Select at least 1 column to show results.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedFieldConfigs.map((f, idx) => (
                                <div
                                  key={f.key}
                                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                      {idx + 1}. {f.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{f.key}</div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => moveField(f.key, 'up')}
                                      className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition text-gray-500"
                                      title="Move up"
                                      disabled={idx === 0}
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => moveField(f.key, 'down')}
                                      className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition text-gray-500"
                                      title="Move down"
                                      disabled={idx === selectedFieldConfigs.length - 1}
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-gray-500" />
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filters</h3>
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {filterCountLabel}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {filters.length > 0 && (
                            <button
                              onClick={() => setFilters([])}
                              className="text-xs font-medium text-gray-500 hover:text-red-500 px-3 py-1.5 transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                          <button
                            onClick={addFilter}
                            className="text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Filter
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50/30 dark:bg-gray-800/30">
                        {filters.length === 0 ? (
                          <div className="text-center py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/20">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 text-gray-400">
                              <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">No filters applied</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                              Add criteria to narrow down results for {REPORT_CONFIG[selectedType].label}.
                            </p>
                            <button onClick={addFilter} className="mt-4 text-sm text-indigo-600 font-medium hover:underline">
                              Add Filter
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filters.length > 1 && (
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Logic</div>
                                <div className="flex bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <button
                                    onClick={() => setFilterLogic('AND')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                      filterLogic === 'AND'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                  >
                                    AND (All)
                                  </button>
                                  <button
                                    onClick={() => setFilterLogic('OR')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                      filterLogic === 'OR'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                  >
                                    OR (Any)
                                  </button>
                                </div>
                              </div>
                            )}

                            {filters.map((filter, index) => {
                              const fieldCfg = getFieldConfig(selectedType, filter.field);
                              const ops = getOperatorOptions(fieldCfg?.type);

                              // Keep operator valid when field changes type
                              const operatorIsValid = ops.some((o) => o.value === filter.operator);
                              const operator = operatorIsValid ? filter.operator : ops[0]?.value ?? 'equals';

                              if (!operatorIsValid && operator !== filter.operator) {
                                // normalize silently
                                setTimeout(() => updateFilter(filter.id, 'operator', operator), 0);
                              }

                              return (
                                <div
                                  key={filter.id}
                                  className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-gray-400">#{index + 1}</div>
                                    <button
                                      onClick={() => removeFilter(filter.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title="Remove Filter"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Field */}
                                    <div>
                                      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                        Field
                                      </div>
                                      <select
                                        value={filter.field}
                                        onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-900 dark:text-white"
                                      >
                                        {config.fields.map((f) => (
                                          <option key={f.key} value={f.key}>
                                            {f.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Operator */}
                                    <div>
                                      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                        Operator
                                      </div>
                                      <select
                                        value={operator}
                                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as any)}
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                                      >
                                        {ops.map((o) => (
                                          <option key={o.value} value={o.value}>
                                            {o.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Value */}
                                    <div>
                                      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                        Value
                                      </div>

                                      {operator === 'isEmpty' || operator === 'isNotEmpty' ? (
                                        <div className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                                          No value needed
                                        </div>
                                      ) : fieldCfg?.type === 'select' ? (
                                        <select
                                          value={filter.value}
                                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                          className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                                        >
                                          <option value="">Select value...</option>
                                          {(fieldCfg.options ?? []).map((opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type={fieldCfg?.type === 'number' ? 'number' : fieldCfg?.type === 'date' ? 'date' : 'text'}
                                          value={filter.value}
                                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                          placeholder="Enter value..."
                                          className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                <div className={showOutline ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col min-h-[520px]">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">Report Results</h3>

                          {hasRun && (
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-medium">
                              {summary.count} Records
                            </span>
                          )}

                          {groupBy && hasRun && (
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full text-xs font-medium">
                              Grouped by {getFieldConfig(selectedType, groupBy)?.label ?? groupBy}
                            </span>
                          )}
                        </div>

                        {!hasRun ? (
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Click "Run Report" to update results
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last run:{' '}
                            {lastRunAt ? new Date(lastRunAt).toLocaleString() : 'Just now'}
                          </div>
                        )}
                      </div>

                      {hasRun && (
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            Count: {summary.count}
                          </span>

                          {summary.sums.map((s) => (
                            <span
                              key={s.key}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                            >
                              Sum {s.label}: {formatChipValue(s.value)}
                            </span>
                          ))}

                          {selectedFields.length === 0 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                              No columns selected
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-x-auto">
                      {selectedFields.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center gap-3">
                            <FileSpreadsheet className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            <div className="text-base font-semibold text-gray-900 dark:text-white">Select columns to display</div>
                            <div className="text-sm max-w-md">
                              Use the Columns panel to pick the fields you want in this report, then run it again.
                            </div>
                          </div>
                        </div>
                      ) : !hasRun ? (
                        <div className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm italic">
                          Set your columns and filters, then click "Run Report" to view data.
                        </div>
                      ) : reportResult.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            <p className="font-medium text-gray-900 dark:text-white">No records found</p>
                            <p className="text-sm">Try changing your filters or logic (AND/OR).</p>
                          </div>
                        </div>
                      ) : groupBy && grouped ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {grouped.map((g) => (
                            <div key={g.key}>
                              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {g.key}
                                  <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    ({g.rows.length})
                                  </span>
                                </div>
                              </div>

                              <table className="w-full text-left border-collapse">
                                <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                                  <tr>
                                    {selectedFieldConfigs.map((field) => (
                                      <th
                                        key={field.key}
                                        className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap"
                                      >
                                        {field.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {g.rows.map((row: any, i: number) => (
                                    <tr
                                      key={`${g.key}_${i}`}
                                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                    >
                                      {selectedFieldConfigs.map((field) => (
                                        <td
                                          key={`${g.key}_${i}_${field.key}`}
                                          className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                        >
                                          {row?.[field.key] ?? ''}
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
                          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                            <tr>
                              {selectedFieldConfigs.map((field) => (
                                <th
                                  key={field.key}
                                  className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{field.label}</span>
                                    <span className="text-[10px] text-gray-400">{field.key}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {reportResult.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                {selectedFieldConfigs.map((field) => (
                                  <td
                                    key={`${i}-${field.key}`}
                                    className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                  >
                                    {row?.[field.key] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        <span>
                          Object: <span className="font-semibold">{REPORT_CONFIG[selectedType].label}</span> • Filters:{' '}
                          <span className="font-semibold">{filters.length}</span> • Columns:{' '}
                          <span className="font-semibold">{selectedFields.length}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sortBy ? (
                          <span>
                            Sort: <span className="font-semibold">{getFieldConfig(selectedType, sortBy)?.label ?? sortBy}</span>{' '}
                            ({sortDir.toUpperCase()})
                          </span>
                        ) : (
                          <span>Sort: None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Small help card */}
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          Salesforce-style workflow
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          • Choose your columns (and order) • Add filters • Optional: group + sort • Run Report • Export CSV
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* end grid */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------- Overview Tab (unchanged) --------------------
const OverviewTab: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_reports_title')}</h2>
        <div className="flex gap-2">
          <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-2 outline-none">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Download PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Revenue', value: '$24,500', change: '+12%', up: true, icon: DollarSign },
          { label: 'Bookings', value: '142', change: '+5%', up: true, icon: Calendar },
          { label: 'Avg. Order Value', value: '$172', change: '-2%', up: false, icon: BarChart3 },
          { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', up: true, icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
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

      {/* Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
            <div className="flex gap-4 text-sm">
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
            {[40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 65, 85].map((h, i) => (
              <div key={i} className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-t-sm relative group">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 dark:bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600"
                  style={{ height: `${h}%` }}
                ></div>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                  ${h * 100}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Top Performing Tours</h3>
          <div className="space-y-6">
            {[
              { name: 'Sunset City Bike Tour', val: 85, color: 'bg-blue-500' },
              { name: 'Historical Walk', val: 62, color: 'bg-emerald-500' },
              { name: 'Food & Wine Tasting', val: 45, color: 'bg-amber-500' },
              { name: 'Mountain Hike', val: 30, color: 'bg-purple-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{item.val}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/30">
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
