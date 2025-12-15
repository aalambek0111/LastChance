
import React, { useState, useEffect, useMemo } from 'react';
import { 
  UploadCloud, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ChevronRight, 
  Download, 
  Trash2,
  File,
  HelpCircle,
  Check,
  X,
  Play,
  RefreshCw,
  Search,
  GripVertical,
  Table as TableIcon,
  Columns
} from 'lucide-react';

// --- Types & Config ---

type ImportStep = 1 | 2 | 3 | 4 | 5 | 6; // 6 is Summary/Success
type ImportObject = 'leads' | 'bookings' | 'tours';
type ImportMode = 'create' | 'upsert';

interface CrmField {
  key: string;
  label: string;
  required?: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'email' | 'phone';
  options?: string[];
  description?: string;
}

// Configuration Schema
const CRM_SCHEMA: Record<ImportObject, CrmField[]> = {
  leads: [
    { key: 'name', label: 'Full Name', required: true, type: 'text' },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'external_id', label: 'External ID', type: 'text', description: 'Unique ID from external system' },
    { key: 'channel', label: 'Channel', type: 'select', options: ['Website', 'Referral', 'Social', 'WhatsApp', 'Email'] },
    { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'] },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'value', label: 'Deal Value', type: 'number' },
  ],
  bookings: [
    { key: 'booking_reference', label: 'Booking Ref', required: true, type: 'text' },
    { key: 'clientName', label: 'Client Name', required: true, type: 'text' },
    { key: 'tourName', label: 'Tour Name', required: true, type: 'text', description: 'Must match an existing tour' },
    { key: 'external_id', label: 'External ID', type: 'text' },
    { key: 'date', label: 'Date', required: true, type: 'date' },
    { key: 'pax', label: 'Pax', required: true, type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Pending', 'Cancelled', 'Completed'] },
    { key: 'amount', label: 'Total Amount', type: 'number' },
    { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Paid', 'Unpaid', 'Partially Paid', 'Refunded'] },
  ],
  tours: [
    { key: 'tour_code', label: 'Tour Code', required: true, type: 'text' },
    { key: 'name', label: 'Tour Name', required: true, type: 'text' },
    { key: 'external_id', label: 'External ID', type: 'text' },
    { key: 'price', label: 'Price', required: true, type: 'number' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Moderate', 'Hard', 'Expert'] },
    { key: 'active', label: 'Active', type: 'select', options: ['true', 'false'] },
    { key: 'maxPeople', label: 'Max People', type: 'number' },
    { key: 'location', label: 'Location', type: 'text' },
  ]
};

const MATCH_KEYS: Record<ImportObject, { key: string; label: string }[]> = {
  leads: [
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'external_id', label: 'External ID' },
  ],
  bookings: [
    { key: 'booking_reference', label: 'Booking Reference' },
    { key: 'external_id', label: 'External ID' },
  ],
  tours: [
    { key: 'tour_code', label: 'Tour Code' },
    { key: 'external_id', label: 'External ID' },
  ],
};

// --- Utils ---

const generateCSV = (headers: string[], rows: Record<string, any>[] = []) => {
  const headerRow = headers.join(',');
  const dataRows = rows.map(row => headers.map(h => `"${row[h] || ''}"`).join(','));
  return [headerRow, ...dataRows].join('\n');
};

const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// --- Components ---

const ImportSummaryPanel = ({ 
  step, 
  config, 
  fileMeta, 
  mappingCount, 
  totalFields,
  validationStats
}: { 
  step: ImportStep, 
  config: { type: ImportObject, mode: ImportMode, matchKey?: string },
  fileMeta?: { name: string, rows: number, size: number },
  mappingCount: number,
  totalFields: number,
  validationStats?: { valid: number, error: number }
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Import Summary</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Configuration */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Configuration</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300 capitalize">{config.type}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${config.mode === 'upsert' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
              {config.mode}
            </span>
          </div>
          {config.mode === 'upsert' && (
            <div className="text-xs text-gray-500 mt-1">Match by: <span className="font-mono text-gray-700 dark:text-gray-300">{config.matchKey}</span></div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* File Info */}
        <div className={step < 2 ? 'opacity-40' : ''}>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">File Source</div>
          {fileMeta ? (
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={fileMeta.name}>{fileMeta.name}</div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{fileMeta.rows.toLocaleString()} rows</span>
                <span>{(fileMeta.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">No file selected</div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Mapping Status */}
        <div className={step < 3 ? 'opacity-40' : ''}>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Field Mapping</div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300">Mapped Fields</span>
            <span className={mappingCount === totalFields ? 'text-green-600 font-bold' : 'text-gray-900 dark:text-white font-bold'}>
              {mappingCount} / {totalFields}
            </span>
          </div>
          {fileMeta && (
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500" 
                style={{ width: `${(mappingCount / totalFields) * 100}%` }} 
              />
            </div>
          )}
        </div>

        {/* Validation Status */}
        {step >= 4 && validationStats && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Validation</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center border border-green-100 dark:border-green-800">
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">{validationStats.valid}</div>
                  <div className="text-[10px] text-green-600 dark:text-green-500 uppercase font-bold">Valid</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center border border-red-100 dark:border-red-800">
                  <div className="text-lg font-bold text-red-700 dark:text-red-400">{validationStats.error}</div>
                  <div className="text-[10px] text-red-600 dark:text-red-500 uppercase font-bold">Errors</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Page Component ---

const ImportPage: React.FC = () => {
  // Wizard State
  const [step, setStep] = useState<ImportStep>(1);
  const [objectType, setObjectType] = useState<ImportObject>('leads');
  const [mode, setMode] = useState<ImportMode>('create');
  const [matchKey, setMatchKey] = useState<string>('email');

  // File State
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Mapping State
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  // Validation State
  const [validationResults, setValidationResults] = useState<{
    validCount: number;
    errorCount: number;
    rows: { id: number, data: Record<string, any>, errors: string[], warnings: string[] }[];
  } | null>(null);
  const [validationFilter, setValidationFilter] = useState<'all' | 'valid' | 'error'>('all');
  const [selectedErrorRow, setSelectedErrorRow] = useState<number | null>(null);

  // Import State
  const [importStats, setImportStats] = useState({ created: 0, updated: 0, skipped: 0, failed: 0 });
  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  // Reset match key when object type changes
  useEffect(() => {
    if (MATCH_KEYS[objectType] && MATCH_KEYS[objectType].length > 0) {
      setMatchKey(MATCH_KEYS[objectType][0].key);
    }
  }, [objectType]);

  // --- Handlers ---

  const handleDownloadTemplate = () => {
    const headers = CRM_SCHEMA[objectType].map(f => f.key);
    const content = generateCSV(headers);
    downloadFile(content, `${objectType}_import_template.csv`);
  };

  const handleDownloadExample = () => {
    const headers = CRM_SCHEMA[objectType].map(f => f.key);
    const exampleRow: Record<string, any> = {};
    CRM_SCHEMA[objectType].forEach(f => {
      if (f.type === 'number') exampleRow[f.key] = 100;
      else if (f.type === 'date') exampleRow[f.key] = '2023-12-01';
      else if (f.type === 'email') exampleRow[f.key] = 'example@test.com';
      else if (f.options) exampleRow[f.key] = f.options[0];
      else exampleRow[f.key] = 'Sample Data';
    });
    const content = generateCSV(headers, [exampleRow]);
    downloadFile(content, `${objectType}_example_data.csv`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB.");
      return;
    }

    setFile(uploadedFile);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTimeout(() => {
        // Simple CSV parse
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = (values[i] || '').replace(/^"|"$/g, '').trim();
          });
          return row;
        });

        setCsvHeaders(headers);
        setCsvData(data);
        
        // Auto-Map Logic
        const newMapping: Record<string, string> = {};
        const crmFields = CRM_SCHEMA[objectType];
        
        crmFields.forEach(field => {
          const normFieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normFieldKey = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          const match = headers.find(h => {
            const normHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normHeader === normFieldLabel || normHeader === normFieldKey;
          });
          
          if (match) newMapping[field.key] = match;
        });
        
        setFieldMapping(newMapping);
        setIsProcessingFile(false);
      }, 600);
    };
    reader.readAsText(uploadedFile);
  };

  const handleValidate = () => {
    const schema = CRM_SCHEMA[objectType];
    const results = csvData.map((row, idx) => {
      const mappedRow: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      Object.entries(fieldMapping).forEach(([crmKey, csvHeader]) => {
        if (csvHeader) mappedRow[crmKey] = row[csvHeader];
      });

      schema.forEach(field => {
        const value = mappedRow[field.key];
        const strValue = value === null || value === undefined ? '' : String(value);
        
        if (field.required && strValue.trim() === '') {
          errors.push(`${field.label} is required.`);
        }

        if (strValue !== '') {
          if (field.type === 'number' && isNaN(Number(value))) {
            errors.push(`${field.label} must be a valid number.`);
          }
          if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
            errors.push(`Invalid email format for ${field.label}.`);
          }
          if (field.type === 'select' && field.options) {
             const match = field.options.some(opt => opt.toLowerCase() === strValue.toLowerCase());
             if (!match) warnings.push(`Value "${value}" is not a standard option for ${field.label}.`);
          }
        }
      });

      if (mode === 'upsert') {
         // Explicit string cast to prevent potential index type error
         const key = matchKey as string;
         const matchVal = mappedRow[key];
         if (!matchVal) errors.push(`Match Key (${key}) is missing for upsert.`);
      }

      return { id: idx, data: mappedRow, errors, warnings };
    });

    const errorCount = results.filter(r => r.errors.length > 0).length;
    setValidationResults({ 
      rows: results, 
      errorCount, 
      validCount: results.length - errorCount 
    });
    setStep(4);
  };

  const handleDownloadErrors = () => {
    if (!validationResults) return;
    const errorRows = validationResults.rows.filter(r => r.errors.length > 0);
    const headers = ['Row ID', ...csvHeaders, 'Errors'];
    const rows = errorRows.map(r => {
        const originalData = csvData[r.id];
        return {
            ...originalData,
            'Row ID': r.id + 1,
            'Errors': r.errors.join('; ')
        };
    });
    const content = generateCSV(headers, rows);
    downloadFile(content, `${objectType}_import_errors.csv`);
  };

  const executeImport = () => {
    setStep(5);
    setImportStatus('running');
    setImportStats({ created: 0, updated: 0, skipped: 0, failed: 0 });

    const totalToProcess = validationResults?.validCount || 0;
    let processed = 0;

    const interval = setInterval(() => {
      // Simulate batch processing
      const batchSize = Math.ceil(Math.random() * 5) + 1;
      processed += batchSize;
      
      setImportStats(prev => ({
        created: prev.created + (mode === 'create' ? batchSize : Math.floor(batchSize * 0.3)),
        updated: prev.updated + (mode === 'upsert' ? Math.floor(batchSize * 0.7) : 0),
        skipped: prev.skipped,
        failed: prev.failed 
      }));

      if (processed >= totalToProcess) {
        clearInterval(interval);
        setImportStatus('completed');
        setStep(6); // Go to summary
      }
    }, 500);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Data</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bulk upload leads, bookings, or tours from CSV.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left: Wizard Content */}
        <div className="flex-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[600px]">
          
          {/* Progress Bar (Mobile) */}
          <div className="lg:hidden w-full bg-gray-100 dark:bg-gray-700 h-1.5">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300" 
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>

          {/* STEP 1: CONFIGURE */}
          {step === 1 && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  1. Select Entity Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['leads', 'bookings', 'tours'] as ImportObject[]).map(obj => (
                    <button
                      key={obj}
                      onClick={() => setObjectType(obj)}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        objectType === obj 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {objectType === obj && <div className="absolute top-2 right-2 text-indigo-600"><CheckCircle2 className="w-5 h-5"/></div>}
                      <div className="font-bold capitalize text-gray-900 dark:text-white text-lg">{obj}</div>
                      <div className="text-xs text-gray-500 mt-1">Bulk import {obj}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  2. Import Mode
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${mode === 'create' ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="mode" className="mt-1 w-4 h-4 text-indigo-600" checked={mode === 'create'} onChange={() => setMode('create')} />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Create New Records
                        <span className="text-[10px] uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Adds all rows as new entries. Duplicates may be created if data already exists.</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${mode === 'upsert' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="mode" className="mt-1 w-4 h-4 text-amber-600" checked={mode === 'upsert'} onChange={() => setMode('upsert')} />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Update Existing (Upsert)
                        <span className="text-[10px] uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Advanced</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Updates records if a match is found, otherwise creates new ones.</p>
                      
                      {mode === 'upsert' && (
                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900 rounded-lg animate-in slide-in-from-top-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Match Records By</label>
                          <select 
                            value={matchKey}
                            onChange={(e) => setMatchKey(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-900"
                          >
                            {MATCH_KEYS[objectType].map(opt => (
                              <option key={opt.key} value={opt.key}>{opt.label} ({opt.key})</option>
                            ))}
                          </select>
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 
                            Rows missing this field will be skipped.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                  <button onClick={handleDownloadTemplate} className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Template CSV
                  </button>
                  <button onClick={handleDownloadExample} className="text-sm text-gray-500 font-medium hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Example Data
                  </button>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD */}
          {step === 2 && (
            <div className="p-8 flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-right-4">
              <div className="w-full max-w-xl text-center space-y-6">
                <div 
                  className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${
                    file ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {!file ? (
                    <>
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload CSV File</h3>
                      <p className="text-gray-500 dark:text-gray-400">Drag & drop or click to browse</p>
                      <p className="text-xs text-gray-400 mt-4">Max size 5MB</p>
                    </>
                  ) : (
                    <div className="w-full">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <File className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-sm mx-auto">{file.name}</h3>
                      <p className="text-sm text-gray-500 mb-6">{(file.size / 1024).toFixed(1)} KB • {csvData.length} rows detected</p>
                      
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => { setFile(null); setCsvData([]); }}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Replace File
                        </button>
                      </div>
                    </div>
                  )}

                  {isProcessingFile && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 z-10 flex flex-col items-center justify-center rounded-3xl">
                      <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                      <p className="font-medium text-gray-900 dark:text-white">Analyzing file...</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-8 w-full border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 font-medium px-4">Back</button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!file}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                  >
                    Map Fields <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MAPPING */}
          {step === 3 && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Map Columns</h2>
                  <p className="text-sm text-gray-500">Ensure required fields are mapped correctly.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/30">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 font-bold">
                      <tr>
                        <th className="px-6 py-4 w-1/3">Target Field (CRM)</th>
                        <th className="px-4 py-4 w-10 text-center"></th>
                        <th className="px-6 py-4 w-1/3">Source Column (CSV)</th>
                        <th className="px-6 py-4 w-1/3">Preview (Row 1)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {CRM_SCHEMA[objectType].map((field) => {
                        const selectedHeader = fieldMapping[field.key] || '';
                        const sampleValue = selectedHeader && csvData.length > 0 ? csvData[0][selectedHeader] : '';
                        const isMapped = !!selectedHeader;
                        
                        return (
                          <tr key={field.key} className={isMapped ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                                  {field.label}
                                  {field.required && <span className="text-red-500 text-xs" title="Required">*</span>}
                                  {field.description && (
                                    <span title={field.description} className="text-gray-400 cursor-help"><HelpCircle className="w-3 h-3" /></span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-400 font-mono mt-0.5">{field.key}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <ArrowRight className={`w-4 h-4 mx-auto ${isMapped ? 'text-indigo-500' : 'text-gray-300'}`} />
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                value={selectedHeader}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFieldMapping(prev => ({ ...prev, [field.key]: val }));
                                }}
                                className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                                  isMapped 
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-white' 
                                    : 'border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                }`}
                              >
                                <option value="">-- Ignore --</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              {isMapped ? (
                                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 font-mono truncate">
                                  {sampleValue || <span className="text-gray-400 italic">Empty</span>}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Not mapped</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-900 font-medium px-4">Back</button>
                <button 
                  onClick={handleValidate}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  Validate Data <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: VALIDATION */}
          {step === 4 && validationResults && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 relative">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Validation Results</h2>
                  <div className="flex gap-4 mt-2">
                    <button 
                      onClick={() => setValidationFilter('all')}
                      className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${validationFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      All ({validationResults.rows.length})
                    </button>
                    <button 
                      onClick={() => setValidationFilter('valid')}
                      className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${validationFilter === 'valid' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      Valid ({validationResults.validCount})
                    </button>
                    <button 
                      onClick={() => setValidationFilter('error')}
                      className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${validationFilter === 'error' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      Errors ({validationResults.errorCount})
                    </button>
                  </div>
                </div>
                {validationResults.errorCount > 0 && (
                  <button 
                    onClick={handleDownloadErrors}
                    className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                  >
                    <Download className="w-4 h-4" /> Download Errors
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 shadow-sm z-10 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 w-20">Row</th>
                      <th className="px-6 py-3 w-32">Status</th>
                      {Object.keys(fieldMapping).slice(0, 3).map((key: string) => (
                        <th key={key} className="px-6 py-3">{CRM_SCHEMA[objectType].find(f => f.key === key)?.label}</th>
                      ))}
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {validationResults.rows
                      .filter(r => {
                        if (validationFilter === 'valid') return r.errors.length === 0;
                        if (validationFilter === 'error') return r.errors.length > 0;
                        return true;
                      })
                      .map((row) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${row.errors.length > 0 ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                        onClick={() => row.errors.length > 0 && setSelectedErrorRow(row.id)}
                      >
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{row.id + 1}</td>
                        <td className="px-6 py-3">
                          {row.errors.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          ) : row.warnings.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                              Warning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <Check className="w-3 h-3" /> Valid
                            </span>
                          )}
                        </td>
                        {Object.keys(fieldMapping).slice(0, 3).map((key, i) => (
                          <td key={i} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                            {row.data[key] || '-'}
                          </td>
                        ))}
                        <td className="px-6 py-3 text-right">
                          {row.errors.length > 0 && (
                            <button className="text-red-600 text-xs font-bold hover:underline">View</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Detail Panel Overlay */}
              {selectedErrorRow !== null && (
                <div className="absolute inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-20 p-6 overflow-y-auto animate-in slide-in-from-right">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Row {selectedErrorRow + 1} Issues
                    </h3>
                    <button onClick={() => setSelectedErrorRow(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                      <h4 className="text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wider mb-3">Errors to Fix</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {validationResults.rows[selectedErrorRow].errors.map((err, i) => (
                          <li key={i} className="text-sm text-red-700 dark:text-red-300">{err}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Row Data</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                        {Object.entries(validationResults.rows[selectedErrorRow].data).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-500">{CRM_SCHEMA[objectType].find(f => f.key === key)?.label || key}:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={val as string}>{val as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                <button onClick={() => setStep(3)} className="text-gray-500 hover:text-gray-900 font-medium px-4">Back</button>
                <div className="flex items-center gap-4">
                  {validationResults.errorCount > 0 && (
                    <div className="text-xs text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                      <AlertTriangle className="w-3.5 h-3.5" /> Invalid rows will be skipped
                    </div>
                  )}
                  <button 
                    onClick={executeImport}
                    disabled={validationResults.validCount === 0}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                  >
                    Start Import <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: IMPORT PROGRESS */}
          {step === 5 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in">
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-gray-200 dark:text-gray-700 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle 
                    className="text-indigo-600 progress-ring__circle stroke-current transition-all duration-500 ease-out" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * importStats.created + importStats.updated) / (validationResults?.validCount || 1)}
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(((importStats.created + importStats.updated) / (validationResults?.validCount || 1)) * 100)}%
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Importing Records...</h3>
                <p className="text-gray-500">Please do not close this window.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
                {[
                  { label: 'Created', val: importStats.created, color: 'bg-green-100 text-green-700' },
                  { label: 'Updated', val: importStats.updated, color: 'bg-blue-100 text-blue-700' },
                  { label: 'Skipped', val: importStats.skipped, color: 'bg-gray-100 text-gray-700' },
                  { label: 'Failed', val: importStats.failed, color: 'bg-red-100 text-red-700' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{s.val}</div>
                    <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit mx-auto ${s.color}`}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: SUCCESS */}
          {step === 6 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Import Complete!</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your data has been successfully processed.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Total Processed</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{validationResults?.validCount}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-green-600 font-medium"><div className="w-2 h-2 rounded-full bg-green-500"></div> New Records</span>
                    <span className="font-bold text-gray-900 dark:text-white">{importStats.created}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-blue-600 font-medium"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Updated</span>
                    <span className="font-bold text-gray-900 dark:text-white">{importStats.updated}</span>
                  </div>
                  {importStats.failed > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-red-600 font-medium"><div className="w-2 h-2 rounded-full bg-red-500"></div> Failed</span>
                      <span className="font-bold text-red-600">{importStats.failed}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Import Another File
                </button>
                <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center gap-2">
                  View {objectType} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right: Sticky Summary Panel (Hidden on mobile) */}
        <div className="hidden lg:block w-80 flex-none h-full">
          <ImportSummaryPanel 
            step={step}
            config={{ type: objectType, mode, matchKey }}
            fileMeta={file ? { name: file.name, size: file.size, rows: csvData.length } : undefined}
            mappingCount={Object.keys(fieldMapping).length}
            totalFields={CRM_SCHEMA[objectType].length}
            validationStats={validationResults ? { valid: validationResults.validCount, error: validationResults.errorCount } : undefined}
          />
        </div>

      </div>
    </div>
  );
};

export default ImportPage;
